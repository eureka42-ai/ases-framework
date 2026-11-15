import assert from "node:assert/strict";
import test from "node:test";
import { CallBudget, createCostRecord, createProviderCatalogEntry, generate, generateForMode, getModelControl, MockProvider, probeProvider, ProviderError, selectCapableProvider, selectSafeFallback, type Provider } from "./providers.js";

test("mock provider gives deterministic offline responses", async () => {
  const provider = new MockProvider();
  const first = await generate(provider, { prompt: "  explain ASES  " });
  const second = await generate(provider, { prompt: "explain ASES" });
  assert.deepEqual(first, second);
  assert.equal(first.text, "Mock response: explain ASES");
  assert.equal(first.provider, "mock");
});

test("offline mode never calls a configured remote provider", async () => {
  let calls = 0;
  const remote: Provider = {
    id: "remote-test",
    capabilities: ["text"],
    async generate() {
      calls += 1;
      throw new Error("remote provider must not be called in offline mode");
    },
  };
  const response = await generateForMode("offline", { prompt: "offline only" }, { provider: remote });
  assert.equal(response.provider, "mock");
  assert.equal(response.text, "Mock response: offline only");
  assert.equal(calls, 0);
});

test("non-offline modes require an explicit provider", async () => {
  await assert.rejects(generateForMode("standalone", { prompt: "hello" }), (error: unknown) => error instanceof ProviderError && error.code === "UNAVAILABLE");
});

test("provider capability catalog retains source and observation date", () => {
  const capabilities = ["text"] as const;
  const entry = createProviderCatalogEntry({
    providerId: "local",
    modelId: "deterministic-v1",
    capabilities,
    source: "local adapter declaration",
    observedAt: "2026-11-14",
  });
  assert.deepEqual(entry.capabilities, ["text"]);
  assert.equal(entry.source, "local adapter declaration");
  assert.equal(entry.observedAt, "2026-11-14");
  assert.notEqual(entry.capabilities, capabilities);
  assert.throws(() => createProviderCatalogEntry({ ...entry, observedAt: "2026-02-30" }), (error: unknown) => error instanceof ProviderError && error.code === "INVALID_REQUEST");
});

test("capability router selects a compatible provider and rejects unsupported requirements", () => {
  const textOnly = new MockProvider();
  const withTools: Provider = { id: "tools", capabilities: ["text", "tools"], generate: textOnly.generate.bind(textOnly) };
  assert.equal(selectCapableProvider([textOnly, withTools], ["text", "tools"]).id, "tools");
  assert.throws(() => selectCapableProvider([textOnly], ["text", "vision"]), (error: unknown) => error instanceof ProviderError && error.code === "UNAVAILABLE");
  assert.throws(() => selectCapableProvider([textOnly], []), (error: unknown) => error instanceof ProviderError && error.code === "INVALID_REQUEST");
});

test("host mode reports model selection as host-managed", () => {
  assert.deepEqual(getModelControl("host"), { controller: "host", selection: "host-managed", canSelectModel: false });
  assert.deepEqual(getModelControl("offline"), { controller: "ases-mock", selection: "fixed-mock", canSelectModel: false });
  assert.deepEqual(getModelControl("standalone"), { controller: "ases-provider", selection: "provider-managed", canSelectModel: true });
});

test("fallback preserves the requested data classification and cost ceiling", () => {
  const primary = new MockProvider();
  const restrictedProvider: Provider = { id: "low-clearance", capabilities: ["text"], generate: primary.generate.bind(primary) };
  const expensiveProvider: Provider = { id: "expensive", capabilities: ["text"], generate: primary.generate.bind(primary) };
  const safeProvider: Provider = { id: "safe", capabilities: ["text"], generate: primary.generate.bind(primary) };
  const candidates = [
    { provider: restrictedProvider, maxDataClassification: "internal" as const, maxCostUsd: 0.01 },
    { provider: expensiveProvider, maxDataClassification: "restricted" as const, maxCostUsd: 0.5 },
    { provider: primary, maxDataClassification: "restricted" as const, maxCostUsd: 0.01 },
    { provider: safeProvider, maxDataClassification: "restricted" as const, maxCostUsd: 0.05 },
  ];
  assert.equal(selectSafeFallback(primary.id, candidates, { dataClassification: "sensitive", maxCostUsd: 0.1 }).id, "safe");
  assert.throws(() => selectSafeFallback(primary.id, candidates.slice(0, 2), { dataClassification: "sensitive", maxCostUsd: 0.1 }), (error: unknown) => error instanceof ProviderError && error.code === "UNAVAILABLE");
});

test("cost records distinguish estimated, provider-reported and unknown amounts", () => {
  assert.deepEqual(createCostRecord({ status: "estimated", amountUsd: 0.03, source: "local rate table" }), { status: "estimated", amountUsd: 0.03, source: "local rate table" });
  assert.deepEqual(createCostRecord({ status: "reported", amountUsd: 0.02, source: "provider usage response" }), { status: "reported", amountUsd: 0.02, source: "provider usage response" });
  assert.deepEqual(createCostRecord({ status: "unknown", reason: "provider omitted usage cost" }), { status: "unknown", reason: "provider omitted usage cost" });
  assert.throws(() => createCostRecord({ status: "estimated", amountUsd: -1, source: "rate table" }), (error: unknown) => error instanceof ProviderError && error.code === "INVALID_REQUEST");
  assert.throws(() => createCostRecord({ status: "unknown", reason: " " }), (error: unknown) => error instanceof ProviderError && error.code === "INVALID_REQUEST");
});

test("call budget blocks over-limit and concurrent reservations before provider dispatch", async () => {
  let calls = 0;
  const slow: Provider = {
    id: "metered",
    capabilities: ["text"],
    async generate(request) {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { text: request.prompt, provider: this.id, model: "test", usage: {} };
    },
  };
  const budget = new CallBudget(1);
  const first = budget.generate(slow, { prompt: "first" }, 0.7);
  await assert.rejects(budget.generate(slow, { prompt: "second" }, 0.4), (error: unknown) => error instanceof ProviderError && error.code === "BUDGET_EXCEEDED");
  await first;
  assert.equal(calls, 1);
  assert.equal(budget.reservedUsd, 0.7);
  await assert.rejects(new CallBudget(0).generate(slow, { prompt: "blocked" }, 0.01), (error: unknown) => error instanceof ProviderError && error.code === "BUDGET_EXCEEDED");
  assert.equal(calls, 1);
});

test("provider probe requires explicit opt-in and never returns content or raw errors", async () => {
  let calls = 0;
  const provider: Provider = {
    id: "optional-real-adapter",
    capabilities: ["text"],
    async generate() {
      calls += 1;
      return { text: "sensitive response and sk-secret-value", provider: this.id, model: "remote-model", usage: { inputTokens: 3 } };
    },
  };
  const skipped = await probeProvider(provider);
  assert.equal(skipped.status, "skipped");
  assert.equal(calls, 0);
  const passed = await probeProvider(provider, { enabled: true });
  assert.equal(passed.status, "passed");
  assert.equal(JSON.stringify(passed).includes("sk-secret-value"), false);
  assert.equal(JSON.stringify(passed).includes("sensitive response"), false);

  const broken: Provider = { id: "broken", capabilities: ["text"], async generate() { throw new Error("request failed with sk-secret-value"); } };
  const failed = await probeProvider(broken, { enabled: true });
  assert.equal(failed.status, "failed");
  assert.equal(JSON.stringify(failed).includes("sk-secret-value"), false);
});

test("provider SPI rejects invalid input and normalizes failures", async () => {
  const provider = new MockProvider();
  await assert.rejects(generate(provider, { prompt: " " }), (error: unknown) => error instanceof ProviderError && error.code === "INVALID_REQUEST");
  const broken: Provider = { ...provider, async generate() { throw new Error("private detail"); } };
  await assert.rejects(generate(broken, { prompt: "hello" }), (error: unknown) => error instanceof ProviderError && error.code === "PROVIDER_FAILURE" && !error.message.includes("private detail"));
});

test("provider SPI applies timeout and caller cancellation", async () => {
  const slow: Provider = {
    id: "slow",
    capabilities: ["text"],
    generate: (_request, { signal }) => new Promise((resolve) => {
      signal.addEventListener("abort", () => resolve({ text: "aborted", provider: "slow", model: "test", usage: {} }), { once: true });
    }),
  };
  await assert.rejects(generate(slow, { prompt: "timeout" }, { timeoutMs: 5 }), (error: unknown) => error instanceof ProviderError && error.code === "TIMEOUT");

  const controller = new AbortController();
  const pending = generate(slow, { prompt: "cancel" }, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, (error: unknown) => error instanceof ProviderError && error.code === "CANCELLED");
});
