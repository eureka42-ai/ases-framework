import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { run } from "./index.js";
import { appendLocalTrace, createTraceEvent } from "./observability.js";
import { readDashboardData, renderDashboardHtml } from "./dashboard.js";
import { createFeatureWorkflow, createWorkflowCheckpoint, saveWorkflowCheckpoint } from "./workflows.js";

async function makeWorkspace() {
  const workspace = await mkdtemp(join(tmpdir(), "ases-dashboard-"));
  const catalogDirectory = join(workspace, ".ases", "catalogs");
  await mkdir(catalogDirectory, { recursive: true });
  await writeFile(join(catalogDirectory, "ases-300.json"), `${JSON.stringify({
    schemaVersion: "1",
    catalog: "ases-300",
    source: { path: "ases.md", sha256: "a".repeat(64) },
    status: "IMPORTED_NOT_HOMOLOGATED",
    requirements: [
      { id: "REQ-001", title: "Implemented", sourceText: "source", source: { path: "ases.md", sha256: "a".repeat(64) }, status: "IMPLEMENTED", evidence: [{ id: "EVD-1", kind: "external", description: "local ref", createdAt: "2026-11-15T00:00:00Z" }] },
      { id: "REQ-002", title: "Blocked", sourceText: "source", source: { path: "ases.md", sha256: "a".repeat(64) }, status: "BLOCKED" }
    ]
  })}\n`);
  return workspace;
}

test("local dashboard summarizes requirement/evidence states, workflow checkpoints and explicit costs", async () => {
  const workspace = await makeWorkspace();
  const workflow = createFeatureWorkflow("feature-dashboard");
  await saveWorkflowCheckpoint(workspace, createWorkflowCheckpoint(workflow, ["analyze", "plan"]));
  const tracePath = join(workspace, ".ases", "observability", "traces.jsonl");
  await appendLocalTrace(tracePath, createTraceEvent({ name: "provider.call", status: "PASS", durationMs: 120, cost: { amount: 0.42, currency: "USD", basis: "reported" } }));
  await appendLocalTrace(tracePath, createTraceEvent({ name: "cache.lookup", status: "PASS", durationMs: 4, cost: { amount: 2, currency: "USD", basis: "measured" } }));

  const data = await readDashboardData(workspace);
  assert.equal(data.requirements.total, 2);
  assert.deepEqual(data.requirements.byStatus, { IMPLEMENTED: 1, BLOCKED: 1 });
  assert.deepEqual(data.requirements.evidenceByIntegrity, { UNVERIFIABLE: 1 });
  assert.deepEqual(data.workflows, [{ id: "feature-dashboard", state: "in-progress", completedSteps: 2, totalSteps: 6, updatedAt: data.workflows[0]!.updatedAt }]);
  assert.deepEqual(data.costs, [
    { currency: "USD", basis: "measured", amount: 2, events: 1 },
    { currency: "USD", basis: "reported", amount: 0.42, events: 1 }
  ]);
  assert.equal(data.traces.length, 2);
  assert.deepEqual(data.warnings, []);
});

test("dashboard HTML is self-contained, accessible and escapes untrusted trace labels", async () => {
  const workspace = await makeWorkspace();
  const tracePath = join(workspace, ".ases", "observability", "traces.jsonl");
  await appendLocalTrace(tracePath, createTraceEvent({ name: `</title><script>alert("x")</script>`, status: "FAIL" }));
  const html = renderDashboardHtml(await readDashboardData(workspace), "2026-11-15T10:00:00.000Z");
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /Custos registrados/);
  assert.match(html, /Integridade das evidências/);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script(?:\s|>)/i);
  assert.doesNotMatch(html, /<img\s/i);
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /Nenhum custo foi registrado/);
});

test("dashboard can export structured JSON and keeps missing local activity in an honest empty state", async () => {
  const workspace = await makeWorkspace();
  const data = await readDashboardData(workspace, "");
  assert.deepEqual(data.workflows, []);
  assert.deepEqual(data.traces, []);
  assert.deepEqual(data.costs, []);
  const html = renderDashboardHtml(data);
  assert.match(html, /Nenhum checkpoint de workflow/);
  assert.match(html, /Nenhum trace local disponível/);
  assert.match(html, /O ASES não estima custos ausentes/);
});

test("dashboard CLI returns HTML by default and JSON without creating output files", async () => {
  const workspace = await makeWorkspace();
  const htmlResult = await run(["dashboard", workspace]);
  assert.equal(htmlResult.exitCode, 0);
  assert.match(htmlResult.output, /<!doctype html>/i);

  const jsonResult = await run(["dashboard", workspace, "--json"]);
  assert.equal(jsonResult.exitCode, 0);
  assert.equal(JSON.parse(jsonResult.output).requirements.total, 2);
});
