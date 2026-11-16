import { createHash } from "node:crypto";

export interface VectorDocumentMetadata {
  projectId: string;
  sourcePath: string;
  contentHash: string;
  chunkHash: string;
  license: string;
  version: string;
  allowedPrincipals: string[];
  text: string;
}
export interface VectorDocument { id: string; vector: number[]; metadata: VectorDocumentMetadata }
export interface VectorQuery { vector: number[]; projectId: string; principalId: string; limit?: number; licenses?: string[]; versions?: string[] }
export interface VectorMatch { id: string; score: number; metadata: VectorDocumentMetadata }
export interface VectorStoreAdapter {
  readonly backend: "local" | "pgvector" | "qdrant" | "cloudflare-vectorize";
  upsert(documents: readonly VectorDocument[]): Promise<void>;
  query(query: VectorQuery): Promise<VectorMatch[]>;
  delete(ids: readonly string[]): Promise<void>;
}

const HASH = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function validateVector(vector: readonly number[], dimension?: number): void {
  if (!Array.isArray(vector) || vector.length < 1 || vector.length > 4_096 || (dimension !== undefined && vector.length !== dimension) || vector.some((value) => !Number.isFinite(value) || Math.abs(value) > 1_000_000)) throw new Error("vector must contain bounded finite values and have a consistent dimension from 1 to 4096");
}
function validateDocument(document: VectorDocument, dimension?: number): void {
  if (!document || !ID.test(document.id)) throw new Error("vector document ID is invalid");
  validateVector(document.vector, dimension);
  const metadata = document.metadata;
  if (!metadata || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(metadata.projectId) || !metadata.sourcePath || metadata.sourcePath.length > 2_000 || metadata.sourcePath.startsWith("/") || metadata.sourcePath.split(/[\\/]/).includes("..")) throw new Error("vector document source or project metadata is invalid");
  if (!HASH.test(metadata.contentHash) || !HASH.test(metadata.chunkHash) || !metadata.license.trim() || metadata.license.length > 100 || !metadata.version.trim() || metadata.version.length > 100) throw new Error("vector document provenance metadata is invalid");
  if (!Array.isArray(metadata.allowedPrincipals) || metadata.allowedPrincipals.length > 256 || metadata.allowedPrincipals.some((principal) => typeof principal !== "string" || !principal.trim() || principal.length > 128) || new Set(metadata.allowedPrincipals).size !== metadata.allowedPrincipals.length) throw new Error("vector document ACL metadata is invalid");
  if (typeof metadata.text !== "string" || metadata.text.length > 100_000) throw new Error("vector document text exceeds its limit");
}
function validateQuery(query: VectorQuery, dimension?: number): Required<Pick<VectorQuery, "limit">> & VectorQuery {
  if (!query || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(query.projectId) || !query.principalId || query.principalId.length > 128) throw new Error("vector query access identity is invalid");
  const limit = query.limit ?? 5;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error("vector query limit must be from 1 to 100");
  validateVector(query.vector, dimension);
  for (const filter of [query.licenses, query.versions]) if (filter && (!Array.isArray(filter) || filter.length > 50 || filter.some((value) => typeof value !== "string" || !value || value.length > 100))) throw new Error("vector query filters are invalid");
  return { ...query, limit };
}
function accessible(metadata: VectorDocumentMetadata, query: VectorQuery): boolean {
  return metadata.projectId === query.projectId
    && (!metadata.allowedPrincipals.length || metadata.allowedPrincipals.includes(query.principalId))
    && (!query.licenses || query.licenses.includes(metadata.license))
    && (!query.versions || query.versions.includes(metadata.version));
}
function cosine(left: readonly number[], right: readonly number[]): number {
  let product = 0; let leftNorm = 0; let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) { const a = left[index]!; const b = right[index]!; product += a * b; leftNorm += a * a; rightNorm += b * b; }
  return leftNorm && rightNorm ? product / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm)) : 0;
}
function cloneDocument(document: VectorDocument): VectorDocument { return { ...document, vector: [...document.vector], metadata: { ...document.metadata, allowedPrincipals: [...document.metadata.allowedPrincipals] } }; }
function backendUuid(value: string): string { const hex = createHash("sha256").update(value).digest("hex").slice(0, 32); return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`; }

async function boundedJson(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > 2 * 1024 * 1024) throw new Error("Qdrant response exceeded its 2 MiB limit");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Qdrant response had no body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 2 * 1024 * 1024) { await reader.cancel().catch(() => undefined); throw new Error("Qdrant response exceeded its 2 MiB limit"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; }
  catch { throw new Error("Qdrant response was not valid JSON"); }
}

/** Deterministic in-memory cosine index; data stays in process memory and is never persisted. */
export function createLocalVectorStore(): VectorStoreAdapter {
  const documents = new Map<string, VectorDocument>();
  let dimension: number | undefined;
  return Object.freeze({
    backend: "local" as const,
    async upsert(input: readonly VectorDocument[]) {
      if (!Array.isArray(input) || input.length > 10_000) throw new Error("upsert accepts at most 10000 vector documents");
      let nextDimension = dimension;
      const ids = new Set<string>();
      for (const item of input) { validateDocument(item, nextDimension); nextDimension ??= item.vector.length; if (ids.has(item.id)) throw new Error("upsert document IDs must be unique within a batch"); ids.add(item.id); }
      dimension = nextDimension;
      for (const item of input) documents.set(item.id, cloneDocument(item));
    },
    async query(input: VectorQuery) {
      const query = validateQuery(input, dimension);
      return [...documents.values()].filter((item) => accessible(item.metadata, query)).map((item) => ({ id: item.id, score: cosine(item.vector, query.vector), metadata: { ...item.metadata, allowedPrincipals: [...item.metadata.allowedPrincipals] } }))
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, query.limit);
    },
    async delete(ids: readonly string[]) { if (ids.length > 10_000 || ids.some((id) => !ID.test(id))) throw new Error("local vector delete IDs are invalid or exceed 10000 items"); for (const id of ids) documents.delete(id); if (!documents.size) dimension = undefined; },
  });
}

export type PgVectorQuery = (sql: string, parameters: readonly unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
export function createPgVectorStore(options: { query: PgVectorQuery; table?: string; dimension: number }): VectorStoreAdapter {
  const table = options.table ?? "public.ases_vectors";
  if (!/^[a-z_][a-z0-9_]*(?:\.[a-z_][a-z0-9_]*)?$/.test(table)) throw new Error("pgvector table must be a safe lowercase schema.table identifier");
  if (!Number.isSafeInteger(options.dimension) || options.dimension < 1 || options.dimension > 4_096) throw new Error("pgvector dimension must be from 1 to 4096");
  return Object.freeze({
    backend: "pgvector" as const,
    async upsert(documents: readonly VectorDocument[]) {
      if (documents.length > 1_000) throw new Error("pgvector upsert accepts at most 1000 documents");
      for (const document of documents) validateDocument(document, options.dimension);
      if (!documents.length) return;
      const values: unknown[] = [];
      const tuples = documents.map((document, index) => {
        const offset = index * 3;
        values.push(document.id, `[${document.vector.join(",")}]`, JSON.stringify(document.metadata));
        return `($${offset + 1}, $${offset + 2}::vector, $${offset + 3}::jsonb)`;
      });
      await options.query(`INSERT INTO ${table} (id, embedding, metadata) VALUES ${tuples.join(", ")} ON CONFLICT (id) DO UPDATE SET embedding = EXCLUDED.embedding, metadata = EXCLUDED.metadata`, values);
    },
    async query(input: VectorQuery) {
      const query = validateQuery(input, options.dimension);
      const result = await options.query(`SELECT id, 1 - (embedding <=> $1::vector) AS score, metadata FROM ${table} WHERE metadata->>'projectId' = $2 AND (metadata->'allowedPrincipals' = '[]'::jsonb OR metadata->'allowedPrincipals' @> jsonb_build_array($3::text)) AND ($4::text[] IS NULL OR metadata->>'license' = ANY($4)) AND ($5::text[] IS NULL OR metadata->>'version' = ANY($5)) ORDER BY embedding <=> $1::vector LIMIT $6`, [`[${query.vector.join(",")}]`, query.projectId, query.principalId, query.licenses ?? null, query.versions ?? null, query.limit]);
      return result.rows.map((row) => ({ id: String(row.id), score: Number(row.score), metadata: row.metadata as VectorDocumentMetadata })).filter((match) => Number.isFinite(match.score));
    },
    async delete(ids: readonly string[]) { if (ids.length > 10_000 || ids.some((id) => !ID.test(id))) throw new Error("pgvector delete IDs are invalid or exceed 10000 items"); if (ids.length) await options.query(`DELETE FROM ${table} WHERE id = ANY($1::text[])`, [ids]); },
  });
}

export interface QdrantOptions { enabled: true; baseUrl: string; collection: string; dimension: number; token?: string; fetcher?: typeof fetch }
export function createQdrantVectorStore(options: QdrantOptions): VectorStoreAdapter {
  if (options.enabled !== true) throw new Error("Qdrant access requires explicit enabled: true");
  let base: URL;
  try { base = new URL(options.baseUrl); } catch { throw new Error("Qdrant base URL is invalid"); }
  if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash) throw new Error("Qdrant endpoint must use HTTPS without embedded credentials, query, or fragment");
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(options.collection) || !Number.isSafeInteger(options.dimension) || options.dimension < 1 || options.dimension > 4_096) throw new Error("Qdrant collection or dimension is invalid");
  if (options.token !== undefined && (!options.token.trim() || options.token.length > 2_000 || /[\r\n\0]/.test(options.token))) throw new Error("Qdrant token is invalid");
  const fetcher = options.fetcher ?? fetch;
  async function request(path: string, method: "PUT" | "POST" | "DELETE", body?: unknown): Promise<unknown> {
    const url = new URL(`/collections/${encodeURIComponent(options.collection)}/points${path}`, base);
    const headers = new Headers({ Accept: "application/json" });
    if (body !== undefined) headers.set("content-type", "application/json");
    if (options.token) headers.set("api-key", options.token);
    let response: Response;
    try { response = await fetcher(url, { method, headers, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10_000) }); }
    catch { throw new Error("Qdrant request failed; network details and credentials omitted"); }
    if (!response.ok) throw new Error(`Qdrant API returned HTTP ${response.status}; response body and credentials omitted`);
    return boundedJson(response);
  }
  return Object.freeze({
    backend: "qdrant" as const,
    async upsert(documents: readonly VectorDocument[]) {
      if (documents.length > 1_000) throw new Error("Qdrant upsert accepts at most 1000 documents");
      for (const document of documents) validateDocument(document, options.dimension);
      if (documents.length) await request("?wait=true", "PUT", { points: documents.map((document) => ({ id: backendUuid(document.id), vector: document.vector, payload: { asesId: document.id, metadata: document.metadata } })) });
    },
    async query(input: VectorQuery) {
      const query = validateQuery(input, options.dimension);
      const must: unknown[] = [{ key: "metadata.projectId", match: { value: query.projectId } }];
      if (query.licenses) must.push({ key: "metadata.license", match: { any: query.licenses } });
      if (query.versions) must.push({ key: "metadata.version", match: { any: query.versions } });
      const response = await request("/query", "POST", { query: query.vector, limit: query.limit, with_payload: true, filter: { must, should: [{ key: "metadata.allowedPrincipals", is_empty: true }, { key: "metadata.allowedPrincipals", match: { value: query.principalId } }] } }) as { result?: { points?: unknown } };
      if (!Array.isArray(response?.result?.points)) throw new Error("Qdrant response had an invalid result shape");
      return response.result.points.map((raw) => raw as Record<string, unknown>).filter((row) => (typeof row.id === "string" || typeof row.id === "number") && typeof row.score === "number" && row.payload && typeof row.payload === "object")
        .map((row) => { const payload = row.payload as { asesId?: unknown; metadata?: unknown }; return { id: String(payload.asesId ?? row.id), score: row.score as number, metadata: payload.metadata as VectorDocumentMetadata }; }).filter((match) => accessible(match.metadata, query));
    },
    async delete(ids: readonly string[]) { if (ids.length > 1_000 || ids.some((id) => !ID.test(id))) throw new Error("Qdrant delete IDs are invalid or exceed 1000 items"); if (ids.length) await request("/delete?wait=true", "POST", { points: ids.map(backendUuid) }); },
  });
}

export interface VectorizeBinding {
  upsert(vectors: Array<{ id: string; values: number[]; metadata: Record<string, string | number | boolean | string[] | null> }>): Promise<unknown>;
  query(vector: number[], options: { topK: number; returnMetadata: "all"; filter?: Record<string, unknown> }): Promise<{ matches?: Array<{ id: string; score?: number; metadata?: Record<string, unknown> }> }>;
  deleteByIds(ids: string[]): Promise<unknown>;
}
export function createCloudflareVectorizeStore(binding: VectorizeBinding, dimension: number): VectorStoreAdapter {
  if (!binding || typeof binding.upsert !== "function" || typeof binding.query !== "function" || typeof binding.deleteByIds !== "function" || !Number.isSafeInteger(dimension) || dimension < 1 || dimension > 4_096) throw new Error("Cloudflare Vectorize binding or dimension is invalid");
  return Object.freeze({
    backend: "cloudflare-vectorize" as const,
    async upsert(documents: readonly VectorDocument[]) {
      if (documents.length > 1_000) throw new Error("Vectorize upsert accepts at most 1000 documents");
      for (const document of documents) validateDocument(document, dimension);
      for (const document of documents) if (new TextEncoder().encode(JSON.stringify(document.metadata)).byteLength > 9 * 1024) throw new Error("Vectorize metadata must be under 9 KiB to stay below the service per-vector limit");
      await binding.upsert(documents.map((document) => ({ id: backendUuid(document.id), values: document.vector, metadata: { ...document.metadata, asesId: document.id } })));
    },
    async query(input: VectorQuery) {
      const query = validateQuery(input, dimension);
      if (query.limit > 50) throw new Error("Cloudflare Vectorize returns all metadata with a maximum query limit of 50");
      const filter: Record<string, unknown> = { projectId: query.projectId };
      if (query.licenses) filter.license = { "$in": query.licenses };
      if (query.versions) filter.version = { "$in": query.versions };
      const response = await binding.query(query.vector, { topK: Math.min(50, query.limit * 4), returnMetadata: "all", filter });
      return (response.matches ?? []).filter((match) => match.metadata && typeof match.score === "number")
        .map((match) => ({ id: String(match.metadata!.asesId ?? match.id), score: match.score!, metadata: match.metadata as unknown as VectorDocumentMetadata })).filter((match) => accessible(match.metadata, query))
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, query.limit);
    },
    async delete(ids: readonly string[]) { if (ids.length > 1_000 || ids.some((id) => !ID.test(id))) throw new Error("Vectorize delete IDs are invalid or exceed 1000 items"); if (ids.length) await binding.deleteByIds(ids.map(backendUuid)); },
  });
}
