import assert from "node:assert/strict";
import test from "node:test";
import { compareModelBenchmarkSummaries, runModelBenchmark, type ModelBenchmarkFixture } from "./benchmark.js";
import { MockProvider, type Provider } from "./providers.js";

const fixtures: ModelBenchmarkFixture[] = [
  { id: "case-b", version: "1", prompt: "return beta", expectedAny: ["beta"] },
  { id: "case-a", version: "1", prompt: "return alpha", expectedAny: ["alpha"] },
];

test("model benchmark is opt-in, fingerprinted and excludes prompts and model output", async () => {
  let calls = 0;
  const provider: Provider = {
    id: "local-fixture", capabilities: ["text"],
    async generate(request) { calls++; return { text: `Answer: ${request.prompt}`, provider: this.id, model: "fixture-v1", usage: { inputTokens: 3, outputTokens: 2 } }; },
  };
  const skipped = await runModelBenchmark([provider], fixtures);
  assert.equal(skipped.status, "SKIPPED");
  assert.equal(skipped.skipReason, "explicit-opt-in-required");
  assert.equal(calls, 0);

  const first = await runModelBenchmark([provider], fixtures, { enabled: true, repetitions: 2 });
  const second = await runModelBenchmark([provider], [...fixtures].reverse(), { enabled: true, repetitions: 2 });
  assert.equal(first.status, "COMPLETED");
  assert.equal(first.benchmarkId, second.benchmarkId);
  assert.equal(first.fixtureSetSha256, second.fixtureSetSha256);
  assert.deepEqual(first.providerIds, ["local-fixture"]);
  assert.equal(first.timeoutMs, 30_000);
  const changedPrompt = await runModelBenchmark([provider], [{ ...fixtures[0]!, prompt: "different prompt" }, fixtures[1]!], { enabled: false, repetitions: 2 });
  assert.notEqual(first.benchmarkId, changedPrompt.benchmarkId);
  assert.deepEqual(first.samples.map(({ fixtureId, repetition }) => [fixtureId, repetition]), [
    ["case-a", 1], ["case-a", 2], ["case-b", 1], ["case-b", 2],
  ]);
  assert.deepEqual(first.summaries[0], {
    providerId: "local-fixture", modelId: "fixture-v1", attempts: 4, passed: 4, failed: 0, errors: 0, skipped: 0,
    successRate: 1, meanLatencyMs: first.summaries[0]!.meanLatencyMs, p95LatencyMs: first.summaries[0]!.p95LatencyMs,
    inputTokens: 12, inputTokenObservations: 4, outputTokens: 8, outputTokenObservations: 4,
    reportedCostUsd: null, reportedCostObservations: 0,
  });
  assert.deepEqual(first.comparison, {
    costComparable: false,
    rows: [{ providerId: "local-fixture", modelId: "fixture-v1", rank: 1, successRate: 1, meanLatencyMs: first.summaries[0]!.meanLatencyMs, reportedCostUsd: null }],
  });
  const reportText = JSON.stringify(first);
  assert.equal(reportText.includes("return alpha"), false);
  assert.equal(reportText.includes("Answer:"), false);
  assert.equal(calls, 8);
});

test("model benchmark compares complete adapter-reported cost without estimating missing values", async () => {
  const cheap: Provider = {
    id: "cheap", capabilities: ["text"],
    async generate(request) { return { text: request.prompt, provider: this.id, model: "model-cheap", usage: { reportedCost: { amountUsd: 0.002, source: "provider usage" } } }; },
  };
  const fast: Provider = {
    id: "fast", capabilities: ["text"],
    async generate(request) { return { text: request.prompt, provider: this.id, model: "model-fast", usage: { reportedCost: { amountUsd: 0.004, source: "provider usage" } } }; },
  };
  const report = await runModelBenchmark([cheap, fast], fixtures, { enabled: true });
  assert.equal(report.comparison.costComparable, true);
  assert.deepEqual(report.comparison.rows.map(({ providerId }) => providerId).sort(), ["cheap", "fast"]);
  assert.ok(report.comparison.rows.every((row) => row.rank !== null));
  assert.equal(report.summaries.find((summary) => summary.providerId === "cheap")?.reportedCostUsd, 0.004);
  assert.equal(report.samples[0]?.reportedCostUsd, 0.002);

  const unknownCost: Provider = {
    id: "unknown", capabilities: ["text"],
    async generate(request) { return { text: request.prompt, provider: this.id, model: "model-unknown", usage: {} }; },
  };
  const incomparable = compareModelBenchmarkSummaries([
    ...report.summaries,
    ...(await runModelBenchmark([unknownCost], fixtures, { enabled: true })).summaries,
  ]);
  assert.equal(incomparable.costComparable, false);
  assert.equal(incomparable.rows.find((row) => row.providerId === "unknown")?.reportedCostUsd, null);

  const malformedCost: Provider = {
    id: "malformed-cost", capabilities: ["text"],
    async generate(request) { return { text: request.prompt, provider: this.id, model: "model-malformed", usage: { reportedCost: { amountUsd: Number.MAX_VALUE, source: "invalid" } } }; },
  };
  const rejected = await runModelBenchmark([malformedCost], fixtures.slice(0, 1), { enabled: true });
  assert.equal(rejected.samples[0]?.status, "ERROR");
  assert.equal(rejected.samples[0]?.errorCode, "PROVIDER_FAILURE");
});

test("model benchmark keeps provider failures sanitized and missing evaluation criteria unscored", async () => {
  const provider: Provider = {
    id: "broken", capabilities: ["text"],
    async generate() { throw new Error("private response sk-secret-value"); },
  };
  const report = await runModelBenchmark([provider], [{ id: "unscored", version: "v2", prompt: "private prompt" }], { enabled: true });
  assert.equal(report.samples[0]?.status, "ERROR");
  assert.equal(report.samples[0]?.errorCode, "PROVIDER_FAILURE");
  assert.equal(report.summaries[0]?.successRate, null);
  assert.equal(JSON.stringify(report).includes("private response"), false);
  assert.equal(JSON.stringify(report).includes("sk-secret-value"), false);

  const unscored = await runModelBenchmark([new MockProvider()], [{ id: "unscored", version: "v2", prompt: "private prompt" }], { enabled: true });
  assert.equal(unscored.samples[0]?.status, "SKIPPED");
  assert.equal(unscored.summaries[0]?.successRate, null);
});

test("model benchmark bounds provider calls and validates fixture identity", async () => {
  const provider = new MockProvider();
  await assert.rejects(runModelBenchmark([provider], fixtures, { enabled: true, repetitions: 26 }), /1 to 25/);
  await assert.rejects(runModelBenchmark([provider, provider], fixtures, { enabled: true }), /duplicate provider id/);
  await assert.rejects(runModelBenchmark([provider], [{ ...fixtures[0]!, id: "bad id" }], { enabled: true }), /fixture ids/);
});
