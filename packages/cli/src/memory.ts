import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, readdir, realpath, unlink } from "node:fs/promises";
import { join } from "node:path";

export type MemoryScope = "session" | "project";

export interface MemoryOrigin {
  kind: string;
  reference: string;
}

export interface MemoryEntry {
  id: string;
  scope: MemoryScope;
  value: string;
  valueSha256: string;
  createdAt: string;
  expiresAt: string;
  consent: true;
  origin: MemoryOrigin;
}

export interface ContextBundleItem {
  id: string;
  title: string;
  content: string;
  source: { path: string; sha256: string };
}

export interface ContextBundleInput {
  projectId: string;
  decisions: readonly ContextBundleItem[];
  requirements: readonly ContextBundleItem[];
  checkpoints: readonly ContextBundleItem[];
}

export interface ContextBundle extends ContextBundleInput {
  schemaVersion: "1";
  createdAt: string;
  redactions: number;
  integrity: { algorithm: "sha256"; sha256: string };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function validSlug(value: string, description: string): void {
  if (!/^[a-z0-9][a-z0-9._-]{1,127}$/i.test(value)) throw new Error(`${description} must be a 2-128 character identifier`);
}

async function memoryDirectory(workspaceRoot: string, scope: MemoryScope): Promise<string> {
  const root = await realpath(workspaceRoot);
  let directory = root;
  for (const part of [".ases", "memory", scope]) {
    directory = join(directory, part);
    try { await mkdir(directory); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("memory directory must be a real directory, not a symlink");
  }
  return directory;
}

/** Stores local memory only after explicit consent, with scope, expiry, provenance, and an integrity digest. */
export async function remember(workspaceRoot: string, input: {
  id?: string;
  scope: MemoryScope;
  value: string;
  ttlMs: number;
  consent: boolean;
  origin: MemoryOrigin;
}): Promise<MemoryEntry> {
  if (!input.consent) throw new Error("explicit consent is required before storing memory");
  if (!["session", "project"].includes(input.scope)) throw new Error("memory scope must be session or project");
  if (!Number.isSafeInteger(input.ttlMs) || input.ttlMs < 1_000 || input.ttlMs > 365 * 24 * 60 * 60 * 1_000) throw new Error("memory TTL must be between one second and one year");
  if (!input.value.trim()) throw new Error("memory value must not be empty");
  if (!input.origin.kind.trim() || !input.origin.reference.trim()) throw new Error("memory origin kind and reference are required");
  const id = input.id ?? randomUUID();
  validSlug(id, "memory ID");
  const createdAt = new Date();
  const entry: MemoryEntry = {
    id,
    scope: input.scope,
    value: input.value,
    valueSha256: sha256(input.value),
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + input.ttlMs).toISOString(),
    consent: true,
    origin: { kind: input.origin.kind.trim(), reference: input.origin.reference.trim() },
  };
  const directory = await memoryDirectory(workspaceRoot, input.scope);
  const file = await open(join(directory, `${id}.json`), "wx", 0o600);
  try {
    await file.writeFile(`${JSON.stringify(entry, null, 2)}\n`, "utf8");
    await file.sync();
  } finally {
    await file.close();
  }
  return entry;
}

/** Lists unexpired memory in a selected scope. Expired entries are hidden until explicitly purged. */
export async function inspectMemory(workspaceRoot: string, scope: MemoryScope, options: { includeExpired?: boolean } = {}): Promise<MemoryEntry[]> {
  const directory = await memoryDirectory(workspaceRoot, scope);
  const entries: MemoryEntry[] = [];
  for (const name of (await readdir(directory)).filter((entry) => entry.endsWith(".json")).sort()) {
    const path = join(directory, name);
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error("memory entry must be a regular, non-symlink file");
    const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
    if (!parsed || typeof parsed !== "object") throw new Error("invalid memory entry");
    const entry = parsed as MemoryEntry;
    validSlug(entry.id, "memory ID");
    if (entry.scope !== scope || entry.consent !== true || sha256(entry.value) !== entry.valueSha256 || !Number.isFinite(Date.parse(entry.expiresAt))) throw new Error("memory entry integrity or scope check failed");
    if (options.includeExpired || Date.parse(entry.expiresAt) > Date.now()) entries.push(entry);
  }
  return entries;
}

/** Removes one stored item and confirms whether it existed. */
export async function forgetMemory(workspaceRoot: string, scope: MemoryScope, id: string): Promise<boolean> {
  validSlug(id, "memory ID");
  const directory = await memoryDirectory(workspaceRoot, scope);
  const path = join(directory, `${id}.json`);
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error("memory entry must be a regular, non-symlink file");
    await unlink(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

const secretPatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /\b(password|passwd|secret|api[\s_-]*key|token|aws[\s_-]*secret[\s_-]*access[\s_-]*key)\s*[:=]\s*["']?[^\s"',;]+/gi,
  /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^@\s/]+@[^\s]+/gi,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]{10,})?\b/g,
  /\b(?:xox[baprs]-[A-Za-z0-9-]{20,}|glpat-[A-Za-z0-9_-]{20,}|npm_[A-Za-z0-9]{20,})\b/g,
  /\bAIza[A-Za-z0-9_-]{30,}\b/g,
  /\b(?:sk|rk)-[A-Za-z0-9_-]{20,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi,
];

export function redactSensitiveText(value: string): { text: string; count: number } {
  let output = value;
  let count = 0;
  for (const pattern of secretPatterns) {
    pattern.lastIndex = 0;
    output = output.replace(pattern, () => { count += 1; return "[REDACTED]"; });
  }
  return { text: output, count };
}

function canonicalBundleContent(bundle: Omit<ContextBundle, "integrity">): string {
  return JSON.stringify(bundle);
}

/** Exports selected decisions, requirements, and checkpoints with verified sources and secret redaction. */
export function createContextBundle(input: ContextBundleInput): ContextBundle {
  validSlug(input.projectId, "project ID");
  let redactions = 0;
  const sanitizeItems = (items: readonly ContextBundleItem[], category: string): ContextBundleItem[] => items.map((item) => {
    validSlug(item.id, `${category} item ID`);
    if (!item.title.trim() || !item.content.trim() || !item.source.path.trim()) throw new Error(`context bundle ${category} item is incomplete`);
    if (!/^[a-f0-9]{64}$/i.test(item.source.sha256) || sha256(item.content) !== item.source.sha256.toLowerCase()) throw new Error(`context bundle source hash mismatch: ${item.id}`);
    const title = redactSensitiveText(item.title);
    const content = redactSensitiveText(item.content);
    const path = redactSensitiveText(item.source.path);
    redactions += title.count + content.count + path.count;
    return { id: item.id, title: title.text, content: content.text, source: { path: path.text, sha256: item.source.sha256.toLowerCase() } };
  });
  const payload = {
    schemaVersion: "1" as const,
    projectId: input.projectId,
    createdAt: new Date().toISOString(),
    decisions: sanitizeItems(input.decisions, "decision"),
    requirements: sanitizeItems(input.requirements, "requirement"),
    checkpoints: sanitizeItems(input.checkpoints, "checkpoint"),
    redactions,
  };
  return { ...payload, integrity: { algorithm: "sha256", sha256: sha256(canonicalBundleContent(payload)) } };
}

/** Verifies bundle integrity, content hashes, and source hash syntax before import or use. */
export function verifyContextBundle(bundle: ContextBundle): boolean {
  if (bundle.schemaVersion !== "1" || bundle.integrity.algorithm !== "sha256" || !/^[a-f0-9]{64}$/i.test(bundle.integrity.sha256)) return false;
  const { integrity, ...payload } = bundle;
  if (sha256(canonicalBundleContent(payload)) !== integrity.sha256.toLowerCase()) return false;
  for (const collection of [bundle.decisions, bundle.requirements, bundle.checkpoints]) {
    for (const item of collection) if (!/^[a-f0-9]{64}$/i.test(item.source.sha256) || !item.content.trim()) return false;
  }
  return true;
}
