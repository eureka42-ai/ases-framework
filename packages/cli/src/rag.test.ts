import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { indexRagSources, RagAccessError, refreshRagIndex, retrieveRequirement, searchRag } from "./rag.js";

test("offline RAG indexes Markdown/text, retrieves requirement citations and preserves provenance", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-rag-"));
  await mkdir(join(workspace, "docs"));
  const markdown = "# Security\n\n### REQ-301 — Keep secrets private\n\nThe application must redact secrets before writing diagnostic logs.\n";
  await writeFile(join(workspace, "docs", "security.md"), markdown);
  await writeFile(join(workspace, "notes.txt"), "Offline lexical retrieval does not require a vector model.\n");

  const index = await indexRagSources(workspace, ["docs/security.md", "notes.txt"]);
  assert.equal(index.mode, "offline-lexical");
  assert.equal(index.embeddings, "optional-not-configured");
  const results = retrieveRequirement(index, "REQ-301");
  assert.equal(results.length, 1);
  assert.equal(results[0]!.citation.path, "docs/security.md");
  assert.equal(results[0]!.citation.startLine, 1);
  assert.equal(results[0]!.citation.endLine, 5);
  assert.match(results[0]!.text, /redact secrets/);
  assert.match(results[0]!.citation.sha256, /^[a-f0-9]{64}$/);
  assert.match(results[0]!.citation.chunkSha256, /^[a-f0-9]{64}$/);
  assert.equal(searchRag(index, "redact secrets diagnostics")[0]!.citation.path, "docs/security.md");
});

test("offline RAG returns no invented answer when no indexed source matches", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-rag-empty-"));
  const index = await indexRagSources(workspace, []);
  assert.deepEqual(retrieveRequirement(index, "REQ-301"), []);
  assert.deepEqual(searchRag(index, "what is an unindexed feature?"), []);
});

test("offline RAG rejects symlinked and unsupported sources", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-rag-safe-"));
  const outside = await mkdtemp(join(tmpdir(), "ases-rag-outside-"));
  await writeFile(join(outside, "private.md"), "private");
  await symlink(join(outside, "private.md"), join(workspace, "escape.md"));
  await writeFile(join(workspace, "image.png"), "binary placeholder");
  await assert.rejects(indexRagSources(workspace, ["escape.md"]), /regular, non-symlink/);
  await assert.rejects(indexRagSources(workspace, ["image.png"]), /unsupported RAG source type/);
});

test("offline RAG enforces license, version and source ACL filters", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-rag-filters-"));
  await writeFile(join(workspace, "restricted.md"), "### REQ-311 — Private retention\n\nRetain confidential records safely.\n");
  await writeFile(join(workspace, "public.md"), "### REQ-312 — Public retention\n\nRetain public records safely.\n");
  const index = await indexRagSources(workspace, ["restricted.md", "public.md"], {
    projectId: "eureka-demo",
    metadata: {
      "restricted.md": { license: "Proprietary", version: "2", allowedPrincipals: ["reviewer-7"] },
      "public.md": { license: "CC-BY-4.0", version: "1", allowedPrincipals: [] },
    },
  });
  assert.deepEqual(retrieveRequirement(index, "REQ-311", { access: { projectId: "eureka-demo", principalId: "guest" } }), []);
  assert.equal(retrieveRequirement(index, "REQ-311", { access: { projectId: "eureka-demo", principalId: "reviewer-7" }, filters: { licenses: ["Proprietary"], versions: ["2"] } }).length, 1);
  assert.deepEqual(retrieveRequirement(index, "REQ-311", { access: { projectId: "eureka-demo", principalId: "reviewer-7" }, filters: { licenses: ["CC-BY-4.0"] } }), []);
  assert.equal(retrieveRequirement(index, "REQ-311", { access: { projectId: "eureka-demo", principalId: "guest", permissions: ["rag:acl:bypass"] } }).length, 1);
});

test("offline RAG denies cross-project reads unless explicit permission is present", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-rag-project-"));
  await writeFile(join(workspace, "policy.md"), "### REQ-320 — Project policy\n\nProject alpha must isolate private records.\n");
  const index = await indexRagSources(workspace, ["policy.md"], { projectId: "project-alpha" });
  assert.throws(() => searchRag(index, "isolate private records", { access: { projectId: "project-beta", principalId: "agent-beta" } }), RagAccessError);
  assert.equal(searchRag(index, "isolate private records", { access: { projectId: "project-beta", principalId: "agent-beta", permissions: ["rag:cross-project"] } }).length, 1);
});

test("offline RAG refresh reindexes changed sources and invalidates removed sources", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-rag-refresh-"));
  await writeFile(join(workspace, "changed.md"), "### REQ-330 — Old behavior\n\nOld wording.\n");
  await writeFile(join(workspace, "removed.txt"), "Removed source content.\n");
  const initial = await indexRagSources(workspace, ["changed.md", "removed.txt"], { projectId: "refresh-project" });
  const originalHash = initial.sources.find((source) => source.path === "changed.md")!.sha256;
  await writeFile(join(workspace, "changed.md"), "### REQ-330 — Updated behavior\n\nNew wording.\n");
  await unlink(join(workspace, "removed.txt"));
  const refreshed = await refreshRagIndex(workspace, initial);
  assert.notEqual(refreshed.sources.find((source) => source.path === "changed.md")!.sha256, originalHash);
  assert.deepEqual(refreshed.sources.map((source) => source.path), ["changed.md"]);
  assert.match(retrieveRequirement(refreshed, "REQ-330")[0]!.text, /New wording/);
});
