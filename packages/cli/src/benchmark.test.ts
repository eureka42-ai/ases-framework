import assert from "node:assert/strict";
import test from "node:test";
import { runModelBenchmark, type ModelBenchmarkFixture } from "./benchmark.js";
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
  });
  const reportText = JSON.stringify(first);
  assert.equal(reportText.includes("return alpha"), false);
  assert.equal(reportText.includes("Answer:"), false);
  assert.equal(calls, 8);
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
