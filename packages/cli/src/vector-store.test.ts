import assert from "node:assert/strict";
import test from "node:test";
import { createCloudflareVectorizeStore, createLocalVectorStore, createPgVectorStore, createQdrantVectorStore, type VectorDocument, type VectorizeBinding } from "./vector-store.js";

const hash = "a".repeat(64);
const document = (id: string, values: number[], projectId = "project-one", allowedPrincipals: string[] = []): VectorDocument => ({ id, vector: values, metadata: { projectId, sourcePath: "docs/guide.md", contentHash: hash, chunkHash: hash, license: "Apache-2.0", version: "1", allowedPrincipals, text: `content ${id}` } });
const query = { vector: [1, 0], projectId: "project-one", principalId: "alice", limit: 5 };

test("local vector store ranks cosine similarity and enforces project, ACL, license and version", async () => {
  const store = createLocalVectorStore();
  await store.upsert([
    document("best", [1, 0]),
    document("allowed", [0.8, 0.2], "project-one", ["alice"]),
    document("private", [1, 0], "project-one", ["bob"]),
    document("other-project", [1, 0], "project-two"),
  ]);
  assert.deepEqual((await store.query(query)).map((match) => match.id), ["best", "allowed"]);
  assert.deepEqual((await store.query({ ...query, licenses: ["MIT"] })), []);
  await store.delete(["best"]);
  assert.equal((await store.query(query))[0]?.id, "allowed");
});

test("local vector store validates dimensions and batches atomically", async () => {
  const store = createLocalVectorStore();
  await assert.rejects(store.upsert([document("valid", [1, 0]), document("invalid", [1, 0, 0])]), /dimension/);
  await store.upsert([document("after-failure", [0, 1])]);
  await assert.rejects(store.upsert([document("dup", [1, 0]), document("dup", [1, 0])]), /unique/);
  await assert.rejects(store.query({ ...query, vector: [Number.POSITIVE_INFINITY, 0] }), /finite/);
});

test("pgvector adapter uses parameterized SQL and enforces access predicates", async () => {
  const calls: Array<{ sql: string; parameters: readonly unknown[] }> = [];
  const store = createPgVectorStore({ dimension: 2, query: async (sql, parameters) => { calls.push({ sql, parameters }); return { rows: [{ id: "hit", score: 0.9, metadata: document("hit", [1, 0]).metadata }] }; } });
  await store.upsert([document("hit", [1, 0])]);
  const matches = await store.query(query);
  await store.delete(["hit"]);
  assert.equal(matches[0]?.id, "hit");
  assert.match(calls[0]!.sql, /INSERT INTO public\.ases_vectors/);
  assert.match(calls[1]!.sql, /allowedPrincipals/);
  assert.match(calls[1]!.sql, /<=>/);
  assert.deepEqual(calls[1]!.parameters.slice(1, 3), ["project-one", "alice"]);
  assert.throws(() => createPgVectorStore({ dimension: 2, table: "public.x; DROP TABLE users", query: async () => ({ rows: [] }) }), /safe lowercase/);
});

test("Qdrant adapter is opt-in, uses HTTPS, current query route, ACL filter and stable UUID IDs", async () => {
  const calls: Array<{ url: URL; init: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input)); calls.push({ url, init: init! });
    if (url.pathname.endsWith("/query")) return new Response(JSON.stringify({ result: { points: [{ id: "provider-uuid", score: 0.95, payload: { asesId: "doc:one", metadata: document("doc:one", [1, 0]).metadata } }] } }));
    return new Response(JSON.stringify({ result: { status: "ok" } }));
  };
  assert.throws(() => createQdrantVectorStore({ enabled: false, baseUrl: "https://qdrant.example", collection: "docs", dimension: 2 } as never), /enabled: true/);
  assert.throws(() => createQdrantVectorStore({ enabled: true, baseUrl: "http://qdrant.example", collection: "docs", dimension: 2 }), /HTTPS/);
  const store = createQdrantVectorStore({ enabled: true, baseUrl: "https://qdrant.example", collection: "docs", dimension: 2, token: "secret", fetcher });
  assert.equal(calls.length, 0, "constructing the adapter must not make network requests");
  await store.upsert([document("doc:one", [1, 0])]);
  const matches = await store.query(query);
  await store.delete(["doc:one"]);
  assert.equal(matches[0]?.id, "doc:one");
  assert.equal(calls[0]?.url.pathname, "/collections/docs/points");
  assert.equal(calls[0]?.init.method, "PUT");
  const point = JSON.parse(String(calls[0]?.init.body)).points[0];
  assert.match(point.id, /^[0-9a-f]{8}-[0-9a-f-]{27}$/);
  assert.equal(calls[1]?.url.pathname, "/collections/docs/points/query");
  assert.equal((calls[1]?.init.headers as Headers).get("api-key"), "secret");
  const filter = JSON.parse(String(calls[1]?.init.body)).filter;
  assert.equal(filter.must[0].key, "metadata.projectId");
  assert.equal(filter.should.length, 2);
  assert.equal(calls[2]?.url.pathname, "/collections/docs/points/delete");
});

test("Qdrant API errors are sanitized and oversized responses fail closed", async () => {
  const failed = createQdrantVectorStore({ enabled: true, baseUrl: "https://qdrant.example", collection: "docs", dimension: 2, token: "private-token", fetcher: async () => new Response("private-token leaked", { status: 403 }) });
  await assert.rejects(failed.query(query), (error: Error) => error.message.includes("HTTP 403") && !error.message.includes("private-token"));
  const oversized = createQdrantVectorStore({ enabled: true, baseUrl: "https://qdrant.example", collection: "docs", dimension: 2, fetcher: async () => new Response("x".repeat(2 * 1024 * 1024 + 1)) });
  await assert.rejects(oversized.query(query), /2 MiB/);
});

test("Cloudflare Vectorize adapter uses injected binding, project filters, and service bounds", async () => {
  const upserts: Parameters<VectorizeBinding["upsert"]>[0][] = [];
  const queries: Parameters<VectorizeBinding["query"]>[] = [];
  const deletions: string[][] = [];
  const binding: VectorizeBinding = {
    upsert: async (vectors) => { upserts.push(vectors); return {}; },
    query: async (vector, options) => { queries.push([vector, options]); return { matches: [{ id: "backend-id", score: 0.8, metadata: { ...document("cloud-id", [1, 0]).metadata, asesId: "cloud-id" } }] }; },
    deleteByIds: async (ids) => { deletions.push(ids); return {}; },
  };
  const store = createCloudflareVectorizeStore(binding, 2);
  await store.upsert([document("cloud-id", [1, 0])]);
  const matches = await store.query(query);
  await store.delete(["cloud-id"]);
  assert.equal(matches[0]?.id, "cloud-id");
  assert.match(upserts[0]![0]!.id, /^[0-9a-f]{8}-[0-9a-f-]{27}$/);
  assert.equal(queries[0]![1].topK, 20);
  assert.deepEqual(queries[0]![1].filter, { projectId: "project-one" });
  assert.equal(deletions[0]![0], upserts[0]![0]!.id);
  await assert.rejects(store.query({ ...query, limit: 51 }), /maximum query limit of 50/);
  const largeText = document("large", [1, 0]); largeText.metadata.text = "x".repeat(10_000);
  await assert.rejects(store.upsert([largeText]), /9 KiB/);
});
