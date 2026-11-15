import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { generate, ProviderError, type GenerateOptions, type Provider, type ProviderErrorCode } from "./providers.js";

export interface ModelBenchmarkFixture {
  id: string;
  version: string;
  prompt: string;
  system?: string;
  maxOutputTokens?: number;
  expectedAny?: readonly string[];
}

export type ModelBenchmarkStatus = "PASS" | "FAIL" | "ERROR" | "SKIPPED";

export interface ModelBenchmarkSample {
  providerId: string;
  modelId: string | null;
  fixtureId: string;
  fixtureVersion: string;
  repetition: number;
  status: ModelBenchmarkStatus;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  errorCode?: ProviderErrorCode;
}

export interface ModelBenchmarkSummary {
  providerId: string;
  modelId: string | null;
  attempts: number;
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
  successRate: number | null;
  meanLatencyMs: number | null;
  p95LatencyMs: number | null;
  inputTokens: number | null;
  inputTokenObservations: number;
  outputTokens: number | null;
  outputTokenObservations: number;
}

export interface ModelBenchmarkReport {
  schemaVersion: "1";
  benchmarkId: string;
  fixtureSetSha256: string;
  providerIds: string[];
  startedAt: string;
  completedAt: string;
  repetitions: number;
  timeoutMs: number;
  status: "COMPLETED" | "SKIPPED";
  skipReason?: "explicit-opt-in-required";
  summaries: ModelBenchmarkSummary[];
  samples: ModelBenchmarkSample[];
}

export interface ModelBenchmarkOptions extends Pick<GenerateOptions, "signal"> {
  /** Must be true to make provider calls, which may leave the local machine. */
  enabled?: boolean;
  repetitions?: number;
  timeoutMs?: number;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function validateInputs(providers: readonly Provider[], fixtures: readonly ModelBenchmarkFixture[], repetitions: number, timeoutMs: number): void {
  if (!providers.length || providers.length > 100) throw new TypeError("benchmark requires between 1 and 100 providers");
  if (!fixtures.length || fixtures.length > 500) throw new TypeError("benchmark requires between 1 and 500 fixtures");
  if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 25) throw new TypeError("repetitions must be an integer from 1 to 25");
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) throw new TypeError("timeoutMs must be from 1 to 120000");
  if (providers.length * fixtures.length * repetitions > 10_000) throw new TypeError("benchmark exceeds the 10000-call safety limit");
  const providerIds = new Set<string>();
  for (const provider of providers) {
    if (!provider || typeof provider.id !== "string" || !provider.id.trim() || provider.id.length > 128 || typeof provider.generate !== "function") throw new TypeError("providers require a valid id and generate function");
    if (providerIds.has(provider.id)) throw new TypeError(`duplicate provider id: ${provider.id}`);
    providerIds.add(provider.id);
  }
  const fixtureIds = new Set<string>();
  for (const fixture of fixtures) {
    if (!fixture || typeof fixture.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(fixture.id) || fixtureIds.has(fixture.id)) throw new TypeError("fixture ids must be unique and valid");
    fixtureIds.add(fixture.id);
    if (typeof fixture.version !== "string" || !fixture.version.trim() || fixture.version.length > 64) throw new TypeError(`fixture version is invalid: ${fixture.id}`);
    if (typeof fixture.prompt !== "string" || !fixture.prompt.trim() || fixture.prompt.length > 128_000) throw new TypeError(`fixture prompt is invalid: ${fixture.id}`);
    if (fixture.system !== undefined && (typeof fixture.system !== "string" || fixture.system.length > 128_000)) throw new TypeError(`fixture system instruction is invalid: ${fixture.id}`);
    if (fixture.maxOutputTokens !== undefined && (!Number.isInteger(fixture.maxOutputTokens) || fixture.maxOutputTokens < 1 || fixture.maxOutputTokens > 128_000)) throw new TypeError(`fixture maxOutputTokens is invalid: ${fixture.id}`);
    if (fixture.expectedAny !== undefined && (!Array.isArray(fixture.expectedAny) || fixture.expectedAny.length > 50 || fixture.expectedAny.some((expected) => typeof expected !== "string" || !expected.trim() || expected.length > 1_000))) {
      throw new TypeError(`fixture expectedAny must contain up to 50 non-empty strings: ${fixture.id}`);
    }
  }
}

function fixtureSetFingerprint(fixtures: readonly ModelBenchmarkFixture[]): string {
  const canonical = [...fixtures].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map((fixture) => ({
    id: fixture.id,
    version: fixture.version,
    promptSha256: sha256(fixture.prompt),
    systemSha256: fixture.system === undefined ? null : sha256(fixture.system),
    maxOutputTokens: fixture.maxOutputTokens ?? null,
    expectedAny: [...(fixture.expectedAny ?? [])].sort(),
  }));
  return sha256(JSON.stringify(canonical));
}

function percentile(values: readonly number[], fraction: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(fraction * sorted.length) - 1)] ?? null;
}

function summarize(samples: readonly ModelBenchmarkSample[]): ModelBenchmarkSummary[] {
  const groups = new Map<string, ModelBenchmarkSample[]>();
  for (const sample of samples) {
    const key = JSON.stringify([sample.providerId, sample.modelId]);
    const group = groups.get(key) ?? [];
    group.push(sample);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => {
    const first = group[0]!;
    const passed = group.filter((sample) => sample.status === "PASS").length;
    const failed = group.filter((sample) => sample.status === "FAIL").length;
    const errors = group.filter((sample) => sample.status === "ERROR").length;
    const skipped = group.filter((sample) => sample.status === "SKIPPED").length;
    const scorable = passed + failed;
    const latencies = group.map((sample) => sample.latencyMs);
    const inputValues = group.flatMap((sample) => sample.inputTokens === null ? [] : [sample.inputTokens]);
    const outputValues = group.flatMap((sample) => sample.outputTokens === null ? [] : [sample.outputTokens]);
    return {
      providerId: first.providerId,
      modelId: first.modelId,
      attempts: group.length,
      passed,
      failed,
      errors,
      skipped,
      successRate: scorable ? passed / scorable : null,
      meanLatencyMs: latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length * 100) / 100 : null,
      p95LatencyMs: percentile(latencies, 0.95) === null ? null : Math.round(percentile(latencies, 0.95)! * 100) / 100,
      inputTokens: inputValues.length ? inputValues.reduce((sum, value) => sum + value, 0) : null,
      inputTokenObservations: inputValues.length,
      outputTokens: outputValues.length ? outputValues.reduce((sum, value) => sum + value, 0) : null,
      outputTokenObservations: outputValues.length,
    };
  }).sort((a, b) => a.providerId < b.providerId ? -1 : a.providerId > b.providerId ? 1 : (a.modelId ?? "") < (b.modelId ?? "") ? -1 : (a.modelId ?? "") > (b.modelId ?? "") ? 1 : 0);
}

/** Runs a sequential, bounded comparison. Provider calls are opt-in; response text/prompts are never retained in the report. */
export async function runModelBenchmark(
  providers: readonly Provider[],
  fixtures: readonly ModelBenchmarkFixture[],
  options: ModelBenchmarkOptions = {},
): Promise<ModelBenchmarkReport> {
  const repetitions = options.repetitions ?? 1;
  const timeoutMs = options.timeoutMs ?? 30_000;
  validateInputs(providers, fixtures, repetitions, timeoutMs);
  const fixtureSetSha256 = fixtureSetFingerprint(fixtures);
  const providerIds = providers.map((provider) => provider.id).sort();
  const benchmarkId = sha256(JSON.stringify({ fixtureSetSha256, providerIds, repetitions, timeoutMs })).slice(0, 24);
  const startedAt = new Date().toISOString();
  if (options.enabled !== true) {
    return { schemaVersion: "1", benchmarkId, fixtureSetSha256, providerIds, startedAt, completedAt: new Date().toISOString(), repetitions, timeoutMs, status: "SKIPPED", skipReason: "explicit-opt-in-required", summaries: [], samples: [] };
  }

  const samples: ModelBenchmarkSample[] = [];
  const orderedProviders = [...providers].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const orderedFixtures = [...fixtures].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  for (const provider of orderedProviders) {
    for (const fixture of orderedFixtures) {
      for (let repetition = 1; repetition <= repetitions; repetition++) {
        const started = performance.now();
        try {
          const response = await generate(provider, { prompt: fixture.prompt, ...(fixture.system !== undefined ? { system: fixture.system } : {}), ...(fixture.maxOutputTokens !== undefined ? { maxOutputTokens: fixture.maxOutputTokens } : {}) }, { timeoutMs, ...(options.signal ? { signal: options.signal } : {}) });
          if (!response || typeof response.text !== "string" || typeof response.provider !== "string" || typeof response.model !== "string" || !response.model.trim()) throw new ProviderError("PROVIDER_FAILURE", "benchmark adapter returned malformed output");
          const inputTokens = response.usage?.inputTokens;
          const outputTokens = response.usage?.outputTokens;
          if ((inputTokens !== undefined && (!Number.isInteger(inputTokens) || inputTokens < 0)) || (outputTokens !== undefined && (!Number.isInteger(outputTokens) || outputTokens < 0))) throw new ProviderError("PROVIDER_FAILURE", "benchmark adapter returned malformed usage");
          const expected = fixture.expectedAny ?? [];
          samples.push({
            providerId: provider.id,
            modelId: response.model,
            fixtureId: fixture.id,
            fixtureVersion: fixture.version,
            repetition,
            status: expected.length === 0 ? "SKIPPED" : expected.some((item) => response.text.includes(item)) ? "PASS" : "FAIL",
            latencyMs: Math.round((performance.now() - started) * 100) / 100,
            inputTokens: inputTokens ?? null,
            outputTokens: outputTokens ?? null,
          });
        } catch (error) {
          const normalized = error instanceof ProviderError ? error : new ProviderError("PROVIDER_FAILURE", "benchmark provider call failed", { cause: error });
          samples.push({ providerId: provider.id, modelId: null, fixtureId: fixture.id, fixtureVersion: fixture.version, repetition, status: "ERROR", latencyMs: Math.round((performance.now() - started) * 100) / 100, inputTokens: null, outputTokens: null, errorCode: normalized.code });
        }
      }
    }
  }
  return { schemaVersion: "1", benchmarkId, fixtureSetSha256, providerIds, startedAt, completedAt: new Date().toISOString(), repetitions, timeoutMs, status: "COMPLETED", summaries: summarize(samples), samples };
}
