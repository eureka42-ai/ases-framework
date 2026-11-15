import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

export interface RagSourceMetadata {
  license: string;
  version: string;
  allowedPrincipals: string[];
}

export interface RagIndexedSource extends RagSourceMetadata {
  path: string;
  sha256: string;
}

export interface RagChunk {
  id: string;
  text: string;
  requirementIds: string[];
  source: { path: string; sha256: string; chunkSha256: string; startLine: number; endLine: number; license: string; version: string; allowedPrincipals: string[]; projectId: string };
}

export interface RagIndex {
  schemaVersion: "1";
  mode: "offline-lexical";
  embeddings: "optional-not-configured";
  projectId: string;
  sources: RagIndexedSource[];
  chunks: RagChunk[];
}

export interface RagQueryAccess {
  projectId: string;
  principalId: string;
  permissions?: readonly ("rag:cross-project" | "rag:acl:bypass")[];
}

export interface RagQueryFilters {
  licenses?: readonly string[];
  versions?: readonly string[];
}

export interface RagQueryOptions {
  limit?: number;
  filters?: RagQueryFilters;
  access?: RagQueryAccess;
}

export interface RagCitation {
  path: string;
  startLine: number;
  endLine: number;
  sha256: string;
  chunkSha256: string;
}

export interface RagResult {
  text: string;
  score: number;
  citation: RagCitation;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function tokens(value: string): string[] {
  return value.toLocaleLowerCase("en-US").match(/[\p{L}\p{N}][\p{L}\p{N}_-]*/gu) ?? [];
}

function isInside(root: string, path: string): boolean {
  const rel = relative(root, path);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`));
}

function splitIntoChunks(source: string): Array<{ text: string; startLine: number; endLine: number }> {
  const lines = source.replace(/\r\n?/g, "\n").trimEnd().split("\n");
  const paragraphs: Array<{ text: string; startLine: number; endLine: number }> = [];
  let current: string[] = [];
  let startLine = 1;
  const flush = (endLine: number) => {
    const text = current.join("\n").trim();
    if (text) paragraphs.push({ text, startLine, endLine });
    current = [];
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (!line.trim()) {
      flush(index + 1);
      startLine = index + 2;
    } else {
      if (!current.length) startLine = index + 1;
      current.push(line);
    }
  }
  flush(lines.length);
  const chunks: Array<{ text: string; startLine: number; endLine: number }> = [];
  let pendingHeadings: { text: string; startLine: number; endLine: number } | undefined;
  for (const paragraph of paragraphs) {
    const isHeading = paragraph.text.split("\n").every((line) => /^#{1,6}\s/.test(line.trim()));
    if (isHeading) {
      if (pendingHeadings) {
        pendingHeadings.text = `${pendingHeadings.text}\n\n${paragraph.text}`;
        pendingHeadings.endLine = paragraph.endLine;
      } else {
        pendingHeadings = { ...paragraph };
      }
    } else if (pendingHeadings) {
      chunks.push({ ...pendingHeadings, text: `${pendingHeadings.text}\n\n${paragraph.text}`, endLine: paragraph.endLine });
      pendingHeadings = undefined;
    } else {
      chunks.push({ ...paragraph });
    }
  }
  if (pendingHeadings) chunks.push(pendingHeadings);
  return chunks;
}

/** Builds an in-memory lexical index from regular Markdown/text files under one canonical workspace. */
export async function indexRagSources(
  workspaceRoot: string,
  sourcePaths: readonly string[],
  options: { projectId?: string; metadata?: Readonly<Record<string, Partial<RagSourceMetadata>>> } = {},
): Promise<RagIndex> {
  const root = await realpath(workspaceRoot);
  const projectId = options.projectId ?? `project-${hash(root).slice(0, 16)}`;
  if (!/^[a-z0-9][a-z0-9._-]{1,127}$/i.test(projectId)) throw new Error("RAG project ID must be a 2-128 character identifier");
  const chunks: RagChunk[] = [];
  const sources: RagIndexedSource[] = [];
  for (const requested of [...new Set(sourcePaths)].sort()) {
    const target = resolve(root, requested);
    if (!isInside(root, target)) throw new Error("RAG source escapes the workspace");
    const info = await lstat(target);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error("RAG source must be a regular, non-symlink file");
    const physical = await realpath(target);
    if (!isInside(root, physical)) throw new Error("RAG source resolves outside the workspace");
    const extension = extname(target).toLocaleLowerCase("en-US");
    if (![".md", ".markdown", ".txt"].includes(extension)) throw new Error(`unsupported RAG source type: ${extension || "<none>"}`);
    const source = await readFile(target, "utf8");
    const sourceHash = hash(source);
    const relativePath = relative(root, target).split(sep).join("/");
    const metadata = options.metadata?.[relativePath] ?? {};
    const license = metadata.license ?? "NOASSERTION";
    const version = metadata.version ?? "unversioned";
    const allowedPrincipals = [...new Set(metadata.allowedPrincipals ?? [])].sort();
    if (!license.trim() || !version.trim() || allowedPrincipals.some((principal) => !principal.trim())) throw new Error(`invalid RAG source metadata: ${relativePath}`);
    sources.push({ path: relativePath, sha256: sourceHash, license, version, allowedPrincipals });
    for (const [index, part] of splitIntoChunks(source).entries()) {
      const requirementIds = [...new Set(part.text.match(/\b(?:REQ|AFR)-\d{3}\b/g) ?? [])].sort();
      chunks.push({
        id: `${relativePath}:${part.startLine}-${part.endLine}:${index + 1}`,
        text: part.text,
        requirementIds,
        source: { path: relativePath, sha256: sourceHash, chunkSha256: hash(part.text), startLine: part.startLine, endLine: part.endLine, license, version, allowedPrincipals, projectId },
      });
    }
  }
  return { schemaVersion: "1", mode: "offline-lexical", embeddings: "optional-not-configured", projectId, sources, chunks };
}

/** Re-reads every indexed source, rebuilding changed content and dropping files that were removed. */
export async function refreshRagIndex(workspaceRoot: string, index: RagIndex): Promise<RagIndex> {
  const active: RagIndexedSource[] = [];
  for (const source of index.sources) {
    try {
      await lstat(resolve(workspaceRoot, source.path));
      active.push(source);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const metadata = Object.fromEntries(active.map((source) => [source.path, {
    license: source.license,
    version: source.version,
    allowedPrincipals: source.allowedPrincipals,
  }]));
  return indexRagSources(workspaceRoot, active.map((source) => source.path), { projectId: index.projectId, metadata });
}

function toResult(chunk: RagChunk, score: number): RagResult {
  return {
    text: chunk.text,
    score,
    citation: {
      path: chunk.source.path,
      startLine: chunk.source.startLine,
      endLine: chunk.source.endLine,
      sha256: chunk.source.sha256,
      chunkSha256: chunk.source.chunkSha256,
    },
  };
}

export class RagAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RagAccessError";
  }
}

function visibleChunks(index: RagIndex, options: RagQueryOptions): RagChunk[] {
  const access = options.access ?? { projectId: index.projectId, principalId: "anonymous", permissions: [] };
  const permissions = new Set(access.permissions ?? []);
  if (access.projectId !== index.projectId && !permissions.has("rag:cross-project")) {
    throw new RagAccessError("cross-project RAG access requires rag:cross-project permission");
  }
  const licenses = options.filters?.licenses;
  const versions = options.filters?.versions;
  return index.chunks.filter((chunk) => {
    if (licenses && !licenses.includes(chunk.source.license)) return false;
    if (versions && !versions.includes(chunk.source.version)) return false;
    if (chunk.source.allowedPrincipals.length && !chunk.source.allowedPrincipals.includes(access.principalId) && !permissions.has("rag:acl:bypass")) return false;
    return true;
  });
}

/** Retrieves exact requirement identifiers and always returns a source citation. */
export function retrieveRequirement(index: RagIndex, requirementId: string, options: Omit<RagQueryOptions, "limit"> = {}): RagResult[] {
  if (!/^(?:REQ|AFR)-\d{3}$/.test(requirementId)) throw new Error("requirement ID must match REQ-000 or AFR-000");
  return visibleChunks(index, options).filter((chunk) => chunk.requirementIds.includes(requirementId)).map((chunk) => toResult(chunk, 1));
}

/** Deterministic, offline token-overlap search. Empty indexes produce no answer. */
export function searchRag(index: RagIndex, query: string, options: RagQueryOptions = {}): RagResult[] {
  const limit = options.limit ?? 5;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error("RAG result limit must be an integer from 1 to 100");
  const queryTokens = [...new Set(tokens(query))];
  if (!queryTokens.length) return [];
  const ranked = visibleChunks(index, options).map((chunk) => {
    const sourceTokens = new Set(tokens(chunk.text));
    const score = queryTokens.filter((token) => sourceTokens.has(token)).length / queryTokens.length;
    return { chunk, score };
  }).filter((item) => item.score > 0).sort((left, right) => right.score - left.score || left.chunk.id.localeCompare(right.chunk.id));
  return ranked.slice(0, limit).map(({ chunk, score }) => toResult(chunk, score));
}
