import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createSafeLogRecord } from "./logging.js";

export type EvaluationStatus = "PASS" | "FAIL" | "BLOCKED" | "SKIPPED";
export interface TraceEvent {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startedAt: string;
  durationMs: number;
  status: EvaluationStatus;
  errorCode?: string;
  cost?: { amount: number; currency: string; basis: "reported" | "measured" };
  attributes?: Readonly<Record<string, string | number | boolean>>;
}
export interface AgentMetric {
  outcome: "success" | "failure";
  evidence: "measured" | "reported";
  source: string;
}
export interface EvaluationCase {
  id: string;
  kind: "rag" | "agent";
  query: string;
  expectedAny?: string[];
  expectedStatus?: EvaluationStatus;
  fixtureVersion: string;
}
export interface EvaluationResult {
  id: string;
  kind: "rag" | "agent";
  status: EvaluationStatus;
  fixtureVersion: string;
  evidence: "measured";
  detail: string;
}

/** Creates a bounded local trace record. Costs are never inferred from token estimates. */
export function createTraceEvent(input: Omit<TraceEvent, "traceId" | "spanId" | "startedAt" | "durationMs"> & {
  traceId?: string; spanId?: string; startedAt?: string; durationMs?: number;
}): TraceEvent {
  if (!input.name.trim() || !Number.isFinite(input.durationMs ?? 0) || (input.durationMs ?? 0) < 0) throw new Error("invalid trace event");
  if (input.cost && (!Number.isFinite(input.cost.amount) || input.cost.amount < 0 || !/^[A-Z]{3}$/.test(input.cost.currency))) throw new Error("invalid trace cost");
  return {
    ...input,
    traceId: input.traceId ?? randomUUID(),
    spanId: input.spanId ?? randomUUID(),
    startedAt: input.startedAt ?? new Date().toISOString(),
    durationMs: input.durationMs ?? 0,
  };
}

export async function appendLocalTrace(path: string, event: TraceEvent): Promise<void> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const safe = createSafeLogRecord("trace.event", event).record.data;
  await appendFile(path, `${JSON.stringify(safe)}\n`, { encoding: "utf8", mode: 0o600 });
}

export async function readLocalTraces(path: string): Promise<TraceEvent[]> {
  try {
    const content = await readFile(path, "utf8");
    return content.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as TraceEvent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export function summarizeAgentMetrics(metrics: readonly AgentMetric[]) {
  const measured = metrics.filter((metric) => metric.evidence === "measured");
  const reported = metrics.filter((metric) => metric.evidence === "reported");
  const ratio = (items: readonly AgentMetric[]) => items.length ? items.filter((item) => item.outcome === "success").length / items.length : null;
  return { measured: { count: measured.length, successRate: ratio(measured) }, reported: { count: reported.length, successRate: ratio(reported) } };
}

export interface TelemetryConsent { enabled: boolean; endpoint?: string; updatedAt: string }
export async function setTelemetryConsent(path: string, consent: { enabled: boolean; endpoint?: string }): Promise<TelemetryConsent> {
  if (consent.enabled && (!consent.endpoint || !/^https:\/\//.test(consent.endpoint))) throw new Error("remote telemetry requires an explicit HTTPS endpoint");
  const value: TelemetryConsent = { enabled: consent.enabled, ...(consent.enabled ? { endpoint: consent.endpoint } : {}), updatedAt: new Date().toISOString() };
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  return value;
}
export async function readTelemetryConsent(path: string): Promise<TelemetryConsent> {
  try {
    const value = JSON.parse(await readFile(path, "utf8")) as TelemetryConsent;
    if (typeof value.enabled !== "boolean" || typeof value.updatedAt !== "string" || (value.enabled && (!value.endpoint || !/^https:\/\//.test(value.endpoint)))) throw new Error("invalid telemetry consent record");
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { enabled: false, updatedAt: new Date(0).toISOString() };
    throw error;
  }
}

/** Sends only after explicit consent; every event is sanitized again at the network boundary. */
export async function sendRemoteTelemetry(path: string, events: readonly TraceEvent[], transport: typeof fetch = fetch): Promise<{ sent: number }> {
  const consent = await readTelemetryConsent(path);
  if (!consent.enabled || !consent.endpoint) throw new Error("remote telemetry is disabled; explicit consent is required");
  const payload = events.map((event) => createSafeLogRecord("telemetry.trace", event).record);
  const response = await transport(consent.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ schemaVersion: "1", events: payload }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`telemetry endpoint returned HTTP ${response.status}`);
  return { sent: events.length };
}

export interface OtlpTraceExport {
  resourceSpans: Array<{
    resource: { attributes: Array<{ key: string; value: { stringValue: string } }> };
    scopeSpans: Array<{ scope: { name: string; version: string }; spans: Array<Record<string, unknown>> }>;
  }>;
}

function otelId(value: string, length: 32 | 16): string {
  const normalized = value.replaceAll("-", "").toLowerCase();
  if (new RegExp(`^[a-f0-9]{${length}}$`).test(normalized) && !/^0+$/.test(normalized)) return normalized;
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

/** Maps sanitized local spans to the OTLP/HTTP JSON trace export shape. */
export function createOtlpTraceExport(events: readonly TraceEvent[], options: { serviceName?: string; serviceVersion?: string } = {}): OtlpTraceExport {
  const spans = events.map((event) => {
    const startMs = Date.parse(event.startedAt);
    if (!Number.isFinite(startMs) || startMs < 0 || !Number.isFinite(event.durationMs) || event.durationMs < 0 || event.durationMs > 31_536_000_000) throw new Error("invalid trace timestamp or duration for OTLP export");
    const startNano = BigInt(Math.trunc(startMs)) * 1_000_000n;
    const endNano = startNano + BigInt(Math.round(event.durationMs * 1_000_000));
    if (endNano > 9_223_372_036_854_775_807n) throw new Error("trace timestamp exceeds OTLP int64 range");
    const safe = createSafeLogRecord("telemetry.trace", event).record.data as Record<string, unknown>;
    const safeAttributes = safe.attributes && typeof safe.attributes === "object" ? safe.attributes as Record<string, unknown> : {};
    const attributes: Array<{ key: string; value: { stringValue?: string; boolValue?: boolean; intValue?: string; doubleValue?: number } }> = Object.entries(safeAttributes).slice(0, 40).flatMap(([key, value]) => {
      if (!/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(key) || !(typeof value === "string" || (typeof value === "number" && Number.isFinite(value)) || typeof value === "boolean")) return [];
      const typedValue = typeof value === "string" ? { stringValue: value.slice(0, 256) } : typeof value === "boolean" ? { boolValue: value } : { intValue: String(Math.trunc(value)) };
      return [{ key, value: typedValue }];
    });
    if (event.cost) attributes.push(
      { key: "ases.cost.amount", value: { doubleValue: event.cost.amount } },
      { key: "ases.cost.currency", value: { stringValue: event.cost.currency } },
      { key: "ases.cost.basis", value: { stringValue: event.cost.basis } }
    );
    return {
      traceId: otelId(event.traceId, 32), spanId: otelId(event.spanId, 16),
      ...(event.parentSpanId ? { parentSpanId: otelId(event.parentSpanId, 16) } : {}),
      name: String(safe.name ?? "trace").slice(0, 256), kind: 1,
      startTimeUnixNano: String(startNano),
      endTimeUnixNano: String(endNano),
      attributes,
      status: { code: event.status === "PASS" ? 1 : event.status === "FAIL" ? 2 : 0, ...(event.status === "FAIL" && safe.errorCode ? { message: String(safe.errorCode).slice(0, 128) } : {}) }
    };
  });
  return {
    resourceSpans: [{
      resource: { attributes: [
        { key: "service.name", value: { stringValue: options.serviceName ?? "eureka42-ases-framework" } },
        { key: "service.version", value: { stringValue: options.serviceVersion ?? "0.1.0" } }
      ] },
      scopeSpans: [{ scope: { name: "@eureka42/ases-cli", version: options.serviceVersion ?? "0.1.0" }, spans }]
    }]
  };
}

/** Remote OTLP export is an explicit call and re-reads revocable consent immediately before transport. */
export async function sendOtlpTelemetry(path: string, events: readonly TraceEvent[], transport: typeof fetch = fetch): Promise<{ sent: number }> {
  const consent = await readTelemetryConsent(path);
  if (!consent.enabled || !consent.endpoint) throw new Error("remote telemetry is disabled; explicit consent is required");
  const url = new URL(consent.endpoint);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error("OTLP endpoint must be an HTTPS URL without credentials, query, or fragment");
  if (!url.pathname.replace(/\/+$/, "").endsWith("/v1/traces")) url.pathname = `${url.pathname.replace(/\/+$/, "")}/v1/traces`;
  const payload = createOtlpTraceExport(events);
  const response = await transport(url, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(10_000), redirect: "error"
  });
  if (!response.ok) throw new Error(`OTLP endpoint returned HTTP ${response.status}`);
  return { sent: events.length };
}

export function runEvaluations(cases: readonly EvaluationCase[], ragSearch: (query: string) => readonly string[], agentRun: (query: string) => EvaluationStatus): EvaluationResult[] {
  return cases.map((item) => {
    if (!item.id.trim() || !item.fixtureVersion.trim()) throw new Error("evaluation fixture requires id and version");
    if (item.kind === "rag") {
      const result = ragSearch(item.query).join("\n");
      const passed = (item.expectedAny ?? []).some((expected) => result.includes(expected));
      return { id: item.id, kind: item.kind, status: passed ? "PASS" : "FAIL", fixtureVersion: item.fixtureVersion, evidence: "measured", detail: passed ? "expected content retrieved" : "expected content absent" };
    }
    const actual = agentRun(item.query);
    const status = actual === item.expectedStatus ? "PASS" : actual === "BLOCKED" ? "BLOCKED" : "FAIL";
    return { id: item.id, kind: item.kind, status, fixtureVersion: item.fixtureVersion, evidence: "measured", detail: `expected ${item.expectedStatus ?? "unspecified"}; observed ${actual}` };
  });
}

export async function writeEvaluationReport(path: string, results: readonly EvaluationResult[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const report = { schemaVersion: "1", generatedAt: new Date().toISOString(), summary: Object.fromEntries(( ["PASS", "FAIL", "BLOCKED", "SKIPPED"] as const).map((status) => [status, results.filter((result) => result.status === status).length])), results };
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}
