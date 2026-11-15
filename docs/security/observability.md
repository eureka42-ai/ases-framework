# Observability and evaluations

ASES records trace spans locally in JSONL. A span stores IDs, parent linkage, start time, duration, status, a sanitized error code, bounded attributes and a cost only when a caller supplies its amount, currency and basis. No price is estimated from token counts. Trace events pass through the safe logger before persistence.

Remote telemetry is disabled when no consent file exists. A caller must explicitly enable it with an HTTPS endpoint. `sendRemoteTelemetry()` re-reads consent for each send, sanitizes each event again, applies a 10-second timeout and rejects revoked consent. Disabling consent removes the stored endpoint. This API does not send telemetry automatically.

Agent metrics label evidence as `measured` or `reported`; the summary keeps counts and rates separate. Evaluation fixtures live in `evals/fixtures/`, carry schema and fixture versions, and cover RAG retrieval plus agent outcome gates. `runEvaluations()` emits measured case results. `writeEvaluationReport()` stores a timestamped JSON report with PASS, FAIL, BLOCKED and SKIPPED counts. A blocked host or unavailable dependency should be recorded as SKIPPED by the caller instead of being counted as a pass.

Run the fixture-backed checks with `pnpm test`. The observability tests use deterministic local RAG/agent callbacks and a mock telemetry transport; they do not contact external services.
