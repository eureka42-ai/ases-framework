import assert from "node:assert/strict";
import test from "node:test";
import { generate, generateForMode, MockProvider, ProviderError, type Provider } from "./providers.js";

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
