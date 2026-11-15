import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendLocalTrace, createOtlpTraceExport, createTraceEvent, readLocalTraces, readTelemetryConsent, runEvaluations, sendOtlpTelemetry, sendRemoteTelemetry, setTelemetryConsent, summarizeAgentMetrics, writeEvaluationReport } from "./observability.js";

test("local traces persist errors, parent spans and explicit costs without estimating", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-observe-"));
  const path = join(root, ".ases", "traces.jsonl");
  const event = createTraceEvent({ name: "provider.call", status: "FAIL", errorCode: "TIMEOUT", durationMs: 500, cost: { amount: 0.02, currency: "USD", basis: "reported" }, attributes: { provider: "fixture", apiKey: "sk-test-secret" } });
  await appendLocalTrace(path, event);
  const stored = await readLocalTraces(path);
  assert.equal(stored[0]!.traceId, event.traceId);
  assert.equal(stored[0]!.attributes?.apiKey, "[REDACTED]");
  assert.equal((await readLocalTraces(join(root, "missing.jsonl"))).length, 0);
  assert.throws(() => createTraceEvent({ name: "bad", status: "PASS", durationMs: -1 }), /invalid trace event/);
});

test("remote telemetry is disabled by default and explicit consent is revocable", async () => {
  const path = join(await mkdtemp(join(tmpdir(), "ases-consent-")), ".ases", "telemetry.json");
  assert.equal((await readTelemetryConsent(path)).enabled, false);
  await assert.rejects(setTelemetryConsent(path, { enabled: true, endpoint: "http://example.test" }), /HTTPS/);
  assert.equal((await setTelemetryConsent(path, { enabled: true, endpoint: "https://telemetry.example.test/v1" })).enabled, true);
  let sentBody = "";
  const event = createTraceEvent({ name: "private.operation", status: "PASS", attributes: { email: "user@example.test" } });
  const sent = await sendRemoteTelemetry(path, [event], async (_input, init) => {
    sentBody = String(init?.body);
    return new Response(null, { status: 202 });
  });
  assert.equal(sent.sent, 1);
  assert.doesNotMatch(sentBody, /user@example\.test/);
  await setTelemetryConsent(path, { enabled: false });
  await assert.rejects(sendRemoteTelemetry(path, [event], async () => new Response(null, { status: 202 })), /disabled/);
  const revoked = await readTelemetryConsent(path);
  assert.equal(revoked.enabled, false);
  assert.equal("endpoint" in revoked, false);
  assert.deepEqual(JSON.parse(await readFile(path, "utf8")), revoked);
});

test("OTLP trace export uses standard IDs/timestamps, sanitizes attributes and honors revoked consent", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-otlp-"));
  const consentPath = join(root, "telemetry.json");
  const event = createTraceEvent({ traceId: "0123456789abcdef0123456789abcdef", spanId: "0123456789abcdef", parentSpanId: "fedcba9876543210", name: "build.verify", startedAt: "2026-11-15T12:00:00.000Z", durationMs: 125.5, status: "FAIL", errorCode: "CHECK_FAILED", cost: { amount: 1.5, currency: "USD", basis: "measured" }, attributes: { provider: "local", email: "person@example.test", retry: 2 } });
  const payload = createOtlpTraceExport([event]);
  const span = payload.resourceSpans[0]!.scopeSpans[0]!.spans[0]!;
  assert.equal(span.traceId, "0123456789abcdef0123456789abcdef");
  assert.equal(span.spanId, "0123456789abcdef");
  assert.equal(span.startTimeUnixNano, "1794744000000000000");
  assert.equal(span.endTimeUnixNano, "1794744000125500000");
  assert.deepEqual(span.status, { code: 2, message: "CHECK_FAILED" });
  const body = JSON.stringify(payload);
  assert.doesNotMatch(body, /person@example\.test/);
  assert.match(body, /ases\.cost\.basis/);
  await assert.rejects(sendOtlpTelemetry(consentPath, [event], async () => new Response(null, { status: 200 })), /disabled/);
  await setTelemetryConsent(consentPath, { enabled: true, endpoint: "https://collector.example.test/otlp" });
  let requestUrl = "";
  const sent = await sendOtlpTelemetry(consentPath, [event], async (input, init) => {
    requestUrl = String(input);
    assert.equal((init?.headers as Record<string, string>)["content-type"], "application/json");
    assert.equal(init?.redirect, "error");
    assert.equal(JSON.parse(String(init?.body)).resourceSpans[0].scopeSpans[0].spans.length, 1);
    return new Response(null, { status: 200 });
  });
  assert.equal(requestUrl, "https://collector.example.test/otlp/v1/traces");
  assert.equal(sent.sent, 1);
  await setTelemetryConsent(consentPath, { enabled: false });
  let called = false;
  await assert.rejects(sendOtlpTelemetry(consentPath, [event], async () => { called = true; return new Response(null, { status: 200 }); }), /disabled/);
  assert.equal(called, false);
});

test("agent metrics distinguish measured outcomes from reported outcomes", () => {
  assert.deepEqual(summarizeAgentMetrics([
    { outcome: "success", evidence: "measured", source: "test:1" },
    { outcome: "failure", evidence: "measured", source: "test:2" },
    { outcome: "success", evidence: "reported", source: "agent:self-report" },
  ]), { measured: { count: 2, successRate: 0.5 }, reported: { count: 1, successRate: 1 } });
});

test("versioned RAG and agent fixtures produce auditable PASS/FAIL/BLOCKED/SKIPPED report counts", async () => {
  const fixture = JSON.parse(await readFile(new URL("../../../evals/fixtures/v1.json", import.meta.url), "utf8"));
  const results = runEvaluations(fixture.cases, (query) => query === "cache" ? ["TTL cache"] : [], (query) => query.includes("unauthorized") ? "BLOCKED" : "PASS");
  assert.deepEqual(results.map((result) => result.status), ["PASS", "FAIL", "PASS", "PASS"]);
  const root = await mkdtemp(join(tmpdir(), "ases-eval-"));
  const path = join(root, "reports", "latest.json");
  await writeEvaluationReport(path, [...results.slice(0, 3), { ...results[3]!, status: "BLOCKED" }, { id: "manual-skip", kind: "agent", status: "SKIPPED", fixtureVersion: "1.0.0", evidence: "measured", detail: "host unavailable" }]);
  const report = JSON.parse(await readFile(path, "utf8"));
  assert.deepEqual(report.summary, { PASS: 2, FAIL: 1, BLOCKED: 1, SKIPPED: 1 });
});
