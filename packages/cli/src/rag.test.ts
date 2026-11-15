import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { indexRagSources, retrieveRequirement, searchRag } from "./rag.js";

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
