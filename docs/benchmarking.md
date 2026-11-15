# Reproducible provider benchmarks

The SDK exports `runModelBenchmark()` for comparing explicitly configured `Provider` adapters against a versioned local fixture set. Calls are sequential and stable by provider ID, fixture ID and repetition. Fixtures may pin a system instruction and output-token limit. The report includes a fingerprint of fixture IDs, versions, prompt/system hashes, output-token limits and scoring criteria so later runs can identify the exact benchmark inputs without retaining prompt text.

Provider calls are **disabled by default**. Set `enabled: true` only when the selected adapters and fixtures are suitable for the providers receiving the prompts. A run is bounded to 100 providers, 500 fixtures, 25 repetitions per fixture, a maximum of 10,000 total calls, and a timeout no greater than two minutes per call. One fixture without `expectedAny` is marked `SKIPPED` and is not included in the success rate.

```ts
import { runModelBenchmark, type ModelBenchmarkFixture, type Provider } from "@eureka42/ases-cli";

const fixtures: ModelBenchmarkFixture[] = [
  { id: "requirements-lookup", version: "1", prompt: "Find REQ-001", expectedAny: ["REQ-001"] },
];

const report = await runModelBenchmark(providers, fixtures, {
  enabled: true, // explicit opt-in: this makes provider calls
  repetitions: 3,
  timeoutMs: 20_000,
});
```

The report contains the provider IDs, timeout, repetitions, fixture-set fingerprint, observed model IDs, fixture IDs/versions, PASS/FAIL/ERROR/SKIPPED status, elapsed time, adapter-reported token counts and sanitized error codes. It does not include prompt or response text and does not estimate or compare currency cost. Success rate uses only PASS/FAIL samples; latency summaries include completed and failed requests. Missing token counts remain unknown and their observation counts are reported.

The benchmark implements an exact-substring `expectedAny` check, not semantic quality grading. For meaningful model comparisons, keep prompts and expected criteria versioned, use equivalent provider settings, record the generated report alongside the fixture revision, and do not infer that a faster/cheaper result is safer or more correct beyond the declared checks. No live provider adapter is bundled or called automatically by ASES.
