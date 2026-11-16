import { DurableObject } from "cloudflare:workers";

const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_FILES = 100;
const MAX_OUTPUT_BYTES = 128 * 1024;
const MAX_EXECUTION_MS = 240_000;
const MAX_SETUP_MS = 15_000;
const MAX_SETUP_BUDGET_MS = 60_000;

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}

async function readBoundedJson(request) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw new Error("request too large");
  if (!request.body) throw new Error("missing body");
  const reader = request.body.getReader();
  const parts = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) { await reader.cancel().catch(() => undefined); throw new Error("request too large"); }
    parts.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

function validateJob(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || !Array.isArray(value.argv) || value.argv.length < 1 || value.argv.length > 64
    || value.argv.some((arg) => typeof arg !== "string" || !arg || arg.length > 4096 || /[\0\r\n]/.test(arg))) throw new Error("invalid argv");
  if (!Number.isSafeInteger(value.timeoutMs) || value.timeoutMs < 1000 || value.timeoutMs > MAX_EXECUTION_MS) throw new Error("invalid timeout");
  const cwd = value.cwd ?? ".";
  const safePath = (path) => typeof path === "string" && path.length <= 1024 && !path.startsWith("/") && !path.includes("\\") && !/[\0\r\n]/.test(path)
    && path.split("/").every((part) => part && part !== "." && part !== ".." && part.length <= 255)
    && !path.split("/").some((part) => part === ".git" || part === ".ssh" || part === ".aws" || /^\.(?:env(?:\.|$)|npmrc$|pypirc$|netrc$|secrets$)/i.test(part));
  if (cwd !== "." && !safePath(cwd)) throw new Error("invalid working directory");
  if (!Array.isArray(value.files) || value.files.length > MAX_FILES) throw new Error("invalid file list");
  const paths = new Set();
  let total = 0;
  for (const file of value.files) {
    if (!file || typeof file !== "object" || !safePath(file.path) || typeof file.content !== "string" || paths.has(file.path)) throw new Error("invalid input file");
    paths.add(file.path);
    total += new TextEncoder().encode(file.content).byteLength;
    if (total > MAX_FILE_BYTES) throw new Error("input files too large");
  }
  return { argv: [...value.argv], cwd, files: value.files.map(({ path, content }) => ({ path, content })), timeoutMs: value.timeoutMs };
}

function equalToken(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string") return false;
  const left = new TextEncoder().encode(received);
  const right = new TextEncoder().encode(expected);
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function readOutput(stream, controller) {
  if (!stream) return "";
  const reader = stream.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_OUTPUT_BYTES) {
      controller.abort();
      await reader.cancel().catch(() => undefined);
      throw new Error("sandbox output exceeded its limit");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export class AsesRemoteJob extends DurableObject {
  async runSetup(container, argv, deadlineAt, requestSignal, stdin, user = "0:0") {
    const remainingMs = deadlineAt - Date.now();
    if (remainingMs < 1) throw new Error("sandbox setup deadline exceeded");
    const controller = new AbortController();
    const abortFromRequest = () => controller.abort();
    if (requestSignal.aborted) controller.abort();
    else requestSignal.addEventListener("abort", abortFromRequest, { once: true });
    const timer = setTimeout(() => controller.abort(), Math.min(MAX_SETUP_MS, remainingMs));
    try {
      const process = await container.exec(argv, { cwd: "/workspace", user, stdout: "ignore", stderr: "ignore", ...(stdin ? { stdin } : {}), signal: controller.signal });
      const exitCode = await process.exitCode;
      if (exitCode !== 0) throw new Error("sandbox setup failed");
    } finally { clearTimeout(timer); requestSignal.removeEventListener("abort", abortFromRequest); }
  }

  async execute(rawJob, requestSignal) {
    const job = validateJob(rawJob);
    const firstUse = await this.ctx.blockConcurrencyWhile(async () => {
      if (await this.ctx.storage.get("used")) return false;
      await this.ctx.storage.put("used", true);
      return true;
    });
    if (!firstUse) throw new Error("remote execution job can run only once");
    const container = this.ctx.container;
    if (!container) throw new Error("sandbox container is unavailable");
    const startedAt = Date.now();
    const setupDeadlineAt = startedAt + MAX_SETUP_BUDGET_MS;
    let result;
    try {
      container.start({ image: container.images.base, entrypoint: ["sleep", "infinity"], enableInternet: false, instance: "lite" });
      await container.setInactivityTimeout(300_000);
      await this.runSetup(container, ["mkdir", "-p", "/workspace"], setupDeadlineAt, requestSignal);
      await this.runSetup(container, ["chown", "1000:1000", "/workspace"], setupDeadlineAt, requestSignal);
      for (const file of job.files) {
        const fullPath = `/workspace/${file.path}`;
        const parent = fullPath.slice(0, fullPath.lastIndexOf("/"));
        await this.runSetup(container, ["mkdir", "-p", parent], setupDeadlineAt, requestSignal, undefined, "1000:1000");
        const bytes = new TextEncoder().encode(file.content);
        const stdin = new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } });
        await this.runSetup(container, ["/usr/bin/tee", fullPath], setupDeadlineAt, requestSignal, stdin, "1000:1000");
      }

      const executionController = new AbortController();
      const abortFromRequest = () => executionController.abort();
      if (requestSignal.aborted) executionController.abort();
      else requestSignal.addEventListener("abort", abortFromRequest, { once: true });
      let timedOut = false;
      const timeoutSeconds = Math.ceil(job.timeoutMs / 1000);
      const timer = setTimeout(() => { timedOut = true; executionController.abort(); }, job.timeoutMs);
      let process;
      try {
        const command = ["/usr/bin/timeout", "--signal=TERM", "--kill-after=2s", `${timeoutSeconds}s`, ...job.argv];
        process = await container.exec(command, { cwd: `/workspace${job.cwd === "." ? "" : `/${job.cwd}`}`, user: "1000:1000", signal: executionController.signal });
        const [stdout, stderr, processExitCode] = await Promise.all([readOutput(process.stdout, executionController), readOutput(process.stderr, executionController), process.exitCode]);
        result = { stdout, stderr, exitCode: timedOut ? 124 : processExitCode, durationMs: Math.max(0, Date.now() - startedAt) };
      } finally { clearTimeout(timer); requestSignal.removeEventListener("abort", abortFromRequest); }
      if (result.stdout.length > MAX_OUTPUT_BYTES || result.stderr.length > MAX_OUTPUT_BYTES || result.durationMs > 300_000) throw new Error("remote execution limits exceeded");
      return result;
    } finally {
      try { if (container.running) await container.destroy("one-shot job completed"); } catch { /* Provider cleanup errors never expose or alter job output. */ }
    }
  }

  async fetch(request) {
    if (request.method !== "POST" || new URL(request.url).pathname !== "/execute") return new Response("Not found", { status: 404 });
    try { return json(await this.execute(validateJob(await readBoundedJson(request)), request.signal)); }
    catch { return json({ error: "isolated execution failed" }, 502); }
  }
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST" || new URL(request.url).pathname !== "/v1/execute") return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
    if (!env.ASES_SANDBOX_TOKEN) return json({ error: "sandbox unavailable" }, 503);
    if (!equalToken(request.headers.get("authorization")?.replace(/^Bearer /, ""), env.ASES_SANDBOX_TOKEN)) return json({ error: "unauthorized" }, 401);
    let job;
    try { job = validateJob(await readBoundedJson(request)); }
    catch { return json({ error: "invalid execution request" }, 400); }
    try {
      const id = env.ASES_JOBS.idFromName(crypto.randomUUID());
      const stub = env.ASES_JOBS.get(id);
      const jobRequest = new Request("https://ases-remote-job.invalid/execute", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(job), signal: request.signal });
      return await stub.fetch(jobRequest);
    } catch { return json({ error: "isolated execution failed" }, 502); }
  },
};
