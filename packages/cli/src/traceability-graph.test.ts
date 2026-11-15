import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { run } from "./index.js";
import type { CatalogFile } from "./catalog.js";
import { renderTraceabilityGraph } from "./traceability-graph.js";

const catalog: CatalogFile = {
  schemaVersion: "1",
  catalog: "product",
  productId: "demo",
  source: { path: "requirements.md", sha256: "a".repeat(64) },
  status: "IMPORTED_NOT_HOMOLOGATED",
  requirements: [{
    id: "REQ-301",
    title: "Feature <script>alert(1)</script>\nsecond line",
    sourceText: "source",
    source: { path: "requirements.md", sha256: "a".repeat(64) },
    status: "BLOCKED",
    traceability: { decisionRefs: ["ADR-1\"]\nclick req_301"], testRefs: ["tests/feature.test.ts"] },
    evidence: [{ id: "EVD-1", kind: "external", description: "report.md", createdAt: "2026-11-15T00:00:00Z", integrity: "UNVERIFIABLE" }],
    blocker: { dependency: "AUTH", reason: "Waiting on provider", createdAt: "2026-11-15T00:00:00Z" }
  }]
};

test("traceability Mermaid graph connects decisions, tests, evidence and blockers with escaped labels", () => {
  const graph = renderTraceabilityGraph(catalog);
  assert.match(graph, /^flowchart LR\n/);
  assert.match(graph, /Decision · ADR-1/);
  assert.match(graph, /Test · tests\/feature\.test\.ts/);
  assert.match(graph, /Evidence · report\.md<br\/>UNVERIFIABLE/);
  assert.match(graph, /Blocker · AUTH: Waiting on provider/);
  assert.match(graph, /&lt;script&gt;/);
  assert.doesNotMatch(graph, /\nclick req_301/);
  assert.ok(graph.split("\n").every((line) => line === "" || line === "flowchart LR" || /^  (?:req|decision|test|evidence|blocker)_[a-f0-9]{16}(?:\[| -->| -.->)/.test(line)));
});

test("requirements graph CLI exports Mermaid or JSON deterministically", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-graph-"));
  const directory = join(workspace, ".ases", "catalogs", "products");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "demo.json"), `${JSON.stringify(catalog)}\n`);
  const text = await run(["requirements", "graph", workspace, "--product", "demo"]);
  assert.equal(text.exitCode, 0);
  assert.match(text.output, /^flowchart LR\n/);
  const json = await run(["requirements", "graph", workspace, "--product", "demo", "--json"]);
  assert.equal(json.exitCode, 0);
  const payload = JSON.parse(json.output);
  assert.equal(payload.format, "mermaid");
  assert.equal(payload.productId, "demo");
  assert.equal(payload.graph, text.output);
});
