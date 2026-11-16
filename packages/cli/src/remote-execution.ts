export interface RemoteExecutionFile { path: string; content: string }
export interface RemoteExecutionRequest { enabled: true; argv: readonly string[]; cwd?: string; files?: readonly RemoteExecutionFile[]; timeoutMs?: number }
export interface RemoteExecutionResult { stdout: string; stderr: string; exitCode: number; durationMs: number }
export interface RemoteExecutionOptions { enabled: true; endpoint: string; token: string; fetcher?: typeof fetch; requestTimeoutMs?: number }

const MAX_ARGS = 64;
const MAX_ARG_LENGTH = 4_096;
const MAX_FILES = 100;
const MAX_INPUT_BYTES = 3 * 1024 * 1024;
const MAX_REQUEST_BODY_BYTES = 4 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_OUTPUT_CHARS = 128 * 1024;

function validateArgv(argv: readonly string[]): void {
  if (!Array.isArray(argv) || argv.length < 1 || argv.length > MAX_ARGS || argv.some((arg) => typeof arg !== "string" || !arg.length || arg.length > MAX_ARG_LENGTH || /[\0\r\n]/.test(arg))) throw new TypeError("remote argv must contain 1 to 64 bounded arguments without NUL or newlines");
}
function validateRelativePath(value: string): void {
  if (typeof value !== "string" || !value || value.length > 1_024 || value.startsWith("/") || value.includes("\\") || /[\0\r\n]/.test(value) || value.split("/").some((part) => !part || part === "." || part === ".." || part.length > 255)) throw new TypeError("remote paths must be safe relative POSIX paths");
  if (value.split("/").some((part) => part === ".git" || part === ".ssh" || part === ".aws" || /^\.(?:env(?:\.|$)|npmrc$|pypirc$|netrc$|secrets$)/i.test(part))) throw new TypeError("remote input paths cannot include common secret or version-control locations");
}
function boundedResult(value: unknown): RemoteExecutionResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("remote execution response is invalid");
  const result = value as Record<string, unknown>;
  if (typeof result.stdout !== "string" || result.stdout.length > MAX_OUTPUT_CHARS || typeof result.stderr !== "string" || result.stderr.length > MAX_OUTPUT_CHARS
    || !Number.isSafeInteger(result.exitCode) || (result.exitCode as number) < 0 || (result.exitCode as number) > 255
    || !Number.isSafeInteger(result.durationMs) || (result.durationMs as number) < 0 || (result.durationMs as number) > 300_000) throw new Error("remote execution response is invalid or exceeds limits");
  return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode as number, durationMs: result.durationMs as number };
}
async function boundedJson(response: Response): Promise<unknown> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) throw new Error("remote execution response exceeds its 2 MiB limit");
  if (!response.body) throw new Error("remote execution response has no body");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_RESPONSE_BYTES) { await reader.cancel().catch(() => undefined); throw new Error("remote execution response exceeds its 2 MiB limit"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown; }
  catch { throw new Error("remote execution response is not valid JSON"); }
}

/** Creates a Cloudflare sandbox Worker client; each invocation still requires enabled: true. */
export function createRemoteExecutionClient(options: RemoteExecutionOptions) {
  if (!options || options.enabled !== true) throw new Error("remote execution client requires explicit enabled: true");
  let endpoint: URL;
  try { endpoint = new URL(options.endpoint); } catch { throw new TypeError("remote execution endpoint is invalid"); }
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new TypeError("remote execution endpoint must use HTTPS without embedded credentials, query, or fragment");
  if (typeof options.token !== "string" || options.token.length < 32 || options.token.length > 4_096 || /[\r\n\0]/.test(options.token)) throw new TypeError("remote execution token is invalid");
  const requestTimeoutMs = options.requestTimeoutMs ?? 190_000;
  if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs < 1_000 || requestTimeoutMs > 310_000) throw new TypeError("remote execution request timeout must be from 1 to 310 seconds");
  const fetcher = options.fetcher ?? fetch;
  return Object.freeze({
    async execute(request: RemoteExecutionRequest): Promise<RemoteExecutionResult> {
      if (!request || request.enabled !== true) throw new Error("remote execution requires explicit enabled: true for every call");
      validateArgv(request.argv);
      const timeoutMs = request.timeoutMs ?? 120_000;
      if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 240_000 || timeoutMs + 70_000 > requestTimeoutMs) throw new TypeError("remote command timeout must be 1 to 240 seconds and fit inside the setup and client request budgets");
      const cwd = request.cwd ?? ".";
      if (cwd !== ".") validateRelativePath(cwd);
      const files = request.files ?? [];
      if (!Array.isArray(files) || files.length > MAX_FILES) throw new TypeError("remote execution accepts at most 100 input files");
      const paths = new Set<string>();
      let inputBytes = 0;
      for (const file of files) {
        if (!file || typeof file.content !== "string") throw new TypeError("remote input files must contain UTF-8 text");
        validateRelativePath(file.path);
        if (paths.has(file.path)) throw new TypeError("remote input file paths must be unique");
        paths.add(file.path);
        inputBytes += Buffer.byteLength(file.content, "utf8");
        if (inputBytes > MAX_INPUT_BYTES) throw new TypeError("remote execution input files exceed 3 MiB");
      }
      const body = JSON.stringify({ argv: [...request.argv], cwd, files: files.map((file) => ({ path: file.path, content: file.content })), timeoutMs });
      if (Buffer.byteLength(body, "utf8") > MAX_REQUEST_BODY_BYTES) throw new TypeError("remote execution JSON request exceeds 4 MiB");
      let response: Response;
      try {
        response = await fetcher(endpoint, {
          method: "POST",
          headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${options.token}` },
          body,
          signal: AbortSignal.timeout(requestTimeoutMs),
        });
      } catch { throw new Error("remote execution request failed; endpoint and credentials omitted"); }
      if (!response.ok) throw new Error(`remote execution service returned HTTP ${response.status}; response details omitted`);
      return boundedResult(await boundedJson(response));
    },
  });
}
