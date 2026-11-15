# Observability and evaluations

ASES records trace spans locally in JSONL. A span stores IDs, parent linkage, start time, duration, status, a sanitized error code, bounded attributes and a cost only when a caller supplies its amount, currency and basis. No price is estimated from token counts. Trace events pass through the safe logger before persistence. For local dashboard discovery, instrumentation can append to `<workspace>/.ases/observability/traces.jsonl`; `ases dashboard` reads this path only if it is a regular file and never creates or uploads it.

Remote telemetry is disabled when no consent file exists. A caller must explicitly enable it with an HTTPS endpoint. `sendRemoteTelemetry()` re-reads consent for each send, sanitizes each event again, applies a 10-second timeout and rejects revoked consent. Disabling consent removes the stored endpoint. This API does not send telemetry automatically.

`createOtlpTraceExport()` maps local spans to the OpenTelemetry Protocol (OTLP) JSON trace shape (`resourceSpans`/`scopeSpans`/`spans`), including normalized trace/span IDs, nanosecond timestamps, typed bounded attributes and explicit status. Attributes are sanitized again and limited before export. `sendOtlpTelemetry()` posts to the configured HTTPS endpoint plus `/v1/traces` unless that path is already present; endpoint credentials, query and fragment are rejected and redirects are disabled. It reads consent immediately before every request, so revoking consent blocks the next send. Export is caller-triggered and never automatic. Use the mock transport in tests or an explicitly configured collector; no collector is contacted by the framework itself.

```ts
import { createOtlpTraceExport, readLocalTraces, sendOtlpTelemetry } from "@eureka42/ases-cli";

const events = await readLocalTraces(".ases/observability/traces.jsonl");
const otlpJson = createOtlpTraceExport(events); // inspect or serialize for local export
await sendOtlpTelemetry(".ases/observability/telemetry-consent.json", events); // requires current consent
```

Agent metrics label evidence as `measured` or `reported`; the summary keeps counts and rates separate. Evaluation fixtures live in `evals/fixtures/`, carry schema and fixture versions, and cover RAG retrieval plus agent outcome gates. `runEvaluations()` emits measured case results. `writeEvaluationReport()` stores a timestamped JSON report with PASS, FAIL, BLOCKED and SKIPPED counts. A blocked host or unavailable dependency should be recorded as SKIPPED by the caller instead of being counted as a pass.

Run `ases dashboard <workspace>` to emit a self-contained HTML snapshot (or add `--json` for structured data). It also reads the workspace catalog and regular workflow checkpoints from `.ases/workflows/`, reports evidence integrity, and aggregates explicitly recorded costs while keeping measured and provider-reported values separate. It starts no server and makes no network request. Missing records appear as empty states, not inferred results. The dashboard caps workflow snapshots at 100 and trace history at 5,000 events/4 MiB.

Run the fixture-backed checks with `pnpm test`. The observability tests use deterministic local RAG/agent callbacks and a mock telemetry transport; they do not contact external services.
