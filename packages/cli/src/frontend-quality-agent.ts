import { createAgentDeclaration, type AgentDeclaration } from "./agents.js";

export type FrontendDevice = "mobile" | "desktop";
export type CoreWebVital = "lcpMs" | "inpMs" | "cls";
export type AuditSource = "field" | "lab";
export type AuditImpact = "critical" | "serious" | "moderate" | "minor";

export interface MetricObservation {
  value: number;
  source: AuditSource;
  sampleCount: number;
  /** Field data is classified only when it is the 75th percentile. */
  percentile?: 75;
}

export interface AxeViolationSummary {
  id: string;
  impact: AuditImpact;
  nodeCount: number;
}

export interface FrontendAuditEvidence {
  pageUrl: string;
  measuredAt: string;
  performance?: Partial<Record<FrontendDevice, Partial<Record<CoreWebVital, MetricObservation>>>>;
  accessibility: {
    axeAuditComplete: boolean;
    violations: readonly AxeViolationSummary[];
    manualReviewComplete: boolean;
  };
}

export interface FrontendQualityFinding {
  id: string;
  category: "performance" | "accessibility";
  severity: "critical" | "high" | "medium" | "low";
  summary: string;
  recommendation: string;
  evidence: Record<string, string | number | boolean>;
}

export interface FrontendMetricResult {
  device: FrontendDevice;
  metric: CoreWebVital;
  value: number;
  source: AuditSource;
  sampleCount: number;
  status: "good" | "needs-improvement" | "poor" | "lab-only";
}

export interface FrontendQualityReport {
  schemaVersion: "1";
  page: string;
  measuredAt: string;
  status: "clear" | "needs-attention" | "insufficient-evidence";
  coverage: { metricsObserved: number; metricsExpected: 6; axeAuditComplete: boolean; manualReviewComplete: boolean };
  metrics: FrontendMetricResult[];
  findings: FrontendQualityFinding[];
}

const metricDefinition: Record<CoreWebVital, { label: string; good: number; poor: number; unit: "ms" | "score"; recommendation: string }> = {
  lcpMs: { label: "LCP", good: 2_500, poor: 4_000, unit: "ms", recommendation: "Inspect server response time, render-blocking resources, and the largest above-the-fold image or text block." },
  inpMs: { label: "INP", good: 200, poor: 500, unit: "ms", recommendation: "Break up long main-thread tasks, reduce work during input handlers, and defer nonessential JavaScript." },
  cls: { label: "CLS", good: 0.1, poor: 0.25, unit: "score", recommendation: "Reserve space for images, embeds, and async content; avoid inserting content above what the user is reading." },
};
const devices: readonly FrontendDevice[] = ["mobile", "desktop"];
const metrics: readonly CoreWebVital[] = ["lcpMs", "inpMs", "cls"];
const impacts: readonly AuditImpact[] = ["critical", "serious", "moderate", "minor"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safePageUrl(input: string): string {
  let url: URL;
  try { url = new URL(input); } catch { throw new Error("pageUrl must be an absolute HTTP(S) URL"); }
  if (!(url.protocol === "http:" || url.protocol === "https:") || url.username || url.password) throw new Error("pageUrl must be an HTTP(S) URL without credentials");
  url.search = "";
  url.hash = "";
  return `${url.origin}${url.pathname}`;
}

function validateEvidence(input: unknown): FrontendAuditEvidence {
  if (!isRecord(input) || typeof input.pageUrl !== "string" || typeof input.measuredAt !== "string" || !isRecord(input.accessibility)) throw new Error("frontend audit evidence has an invalid shape");
  const measured = Date.parse(input.measuredAt);
  if (!Number.isFinite(measured) || new Date(measured).toISOString() !== input.measuredAt) throw new Error("measuredAt must be an ISO timestamp");
  const pageUrl = safePageUrl(input.pageUrl);
  const access = input.accessibility;
  if (!Array.isArray(access.violations) || access.violations.length > 500 || typeof access.axeAuditComplete !== "boolean" || typeof access.manualReviewComplete !== "boolean") throw new Error("accessibility evidence is invalid or exceeds 500 violations");
  const ids = new Set<string>();
  for (const item of access.violations) {
    if (!isRecord(item) || typeof item.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,127}$/.test(item.id) || ids.has(item.id) || !impacts.includes(item.impact as AuditImpact) || !Number.isSafeInteger(item.nodeCount) || (item.nodeCount as number) < 1 || (item.nodeCount as number) > 100_000) throw new Error("axe violation summaries must have unique IDs, valid impact, and bounded node counts");
    ids.add(item.id);
  }
  if (input.performance !== undefined && !isRecord(input.performance)) throw new Error("performance evidence must be a device map");
  const performance = input.performance as FrontendAuditEvidence["performance"] | undefined;
  for (const device of devices) {
    const deviceMetrics = performance?.[device];
    if (deviceMetrics !== undefined && !isRecord(deviceMetrics)) throw new Error(`invalid ${device} metric map`);
    for (const metric of metrics) {
      const item = deviceMetrics?.[metric];
      if (item === undefined) continue;
      if (!isRecord(item) || typeof item.value !== "number" || !Number.isFinite(item.value) || item.value < 0 || item.value > (metric === "cls" ? 10 : 120_000) || !["field", "lab"].includes(String(item.source)) || !Number.isSafeInteger(item.sampleCount) || (item.sampleCount as number) < 1 || (item.sampleCount as number) > 10_000_000) throw new Error(`invalid ${metric} observation for ${device}`);
      if (item.source === "field" && item.percentile !== 75) throw new Error(`field ${metric} data must provide percentile 75`);
      if (item.source === "lab" && item.percentile !== undefined) throw new Error(`lab ${metric} data cannot claim a field percentile`);
    }
  }
  return { pageUrl, measuredAt: input.measuredAt, accessibility: { violations: access.violations as unknown as AxeViolationSummary[], axeAuditComplete: access.axeAuditComplete, manualReviewComplete: access.manualReviewComplete }, ...(performance ? { performance } : {}) };
}

function metricStatus(metric: CoreWebVital, observation: MetricObservation): FrontendMetricResult["status"] {
  if (observation.source === "lab") return "lab-only";
  const { good, poor } = metricDefinition[metric];
  if (observation.value <= good) return "good";
  return observation.value > poor ? "poor" : "needs-improvement";
}

/** Reviews supplied Lighthouse/field and axe summaries without launching scans or network requests. */
export function reviewFrontendQuality(evidence: FrontendAuditEvidence): FrontendQualityReport {
  const input = validateEvidence(evidence);
  const results: FrontendMetricResult[] = [];
  const findings: FrontendQualityFinding[] = [];
  for (const device of devices) for (const metric of metrics) {
    const observation = input.performance?.[device]?.[metric];
    if (!observation) continue;
    const status = metricStatus(metric, observation);
    results.push({ device, metric, value: observation.value, source: observation.source, sampleCount: observation.sampleCount, status });
    if (status === "good" || status === "lab-only") continue;
    const definition = metricDefinition[metric];
    findings.push({
      id: `${device}-${metric}`,
      category: "performance",
      severity: status === "poor" ? "critical" : "high",
      summary: `${device} ${definition.label} is ${status === "poor" ? "above the poor threshold" : "above the good threshold"} (${observation.value}${definition.unit === "ms" ? " ms" : ""}).`,
      recommendation: definition.recommendation,
      evidence: { device, metric: definition.label, value: observation.value, source: observation.source, sampleCount: observation.sampleCount, percentile: 75 },
    });
  }
  const severity: Record<AuditImpact, FrontendQualityFinding["severity"]> = { critical: "critical", serious: "high", moderate: "medium", minor: "low" };
  const guidance: Record<AuditImpact, string> = {
    critical: "Fix this accessibility violation before release, then rerun the automated audit and verify with assistive technology.",
    serious: "Prioritize remediation of this accessibility violation and verify the affected interaction with assistive technology.",
    moderate: "Remediate this accessibility violation and include the affected component in keyboard and screen-reader review.",
    minor: "Review this accessibility violation and confirm whether the affected content needs a corrective change.",
  };
  for (const violation of input.accessibility.violations) findings.push({
    id: `axe-${violation.id}`,
    category: "accessibility",
    severity: severity[violation.impact],
    summary: `Automated accessibility rule ${violation.id} reported ${violation.nodeCount} affected node${violation.nodeCount === 1 ? "" : "s"}.`,
    recommendation: guidance[violation.impact],
    evidence: { ruleId: violation.id, impact: violation.impact, nodeCount: violation.nodeCount },
  });
  if (!input.accessibility.axeAuditComplete) findings.push({
    id: "a11y-automated-audit",
    category: "accessibility",
    severity: "high",
    summary: "Automated accessibility audit evidence is missing.",
    recommendation: "Run an axe-based accessibility audit for this page and include its violation summary; an empty list is meaningful only when the audit completed.",
    evidence: { axeAuditComplete: false },
  });
  if (!input.accessibility.manualReviewComplete) findings.push({
    id: "a11y-manual-review",
    category: "accessibility",
    severity: "high",
    summary: "Manual accessibility review is incomplete.",
    recommendation: "Review keyboard-only operation, focus order, zoom/reflow, screen-reader names and announcements, and non-automatable WCAG criteria.",
    evidence: { manualReviewComplete: false },
  });
  findings.sort((left, right) => ["critical", "high", "medium", "low"].indexOf(left.severity) - ["critical", "high", "medium", "low"].indexOf(right.severity) || left.id.localeCompare(right.id));
  const observedFieldMetrics = results.filter((item) => item.source === "field" && item.status !== "lab-only").length;
  const completeEvidence = observedFieldMetrics === 6 && input.accessibility.axeAuditComplete && input.accessibility.manualReviewComplete;
  return {
    schemaVersion: "1",
    page: input.pageUrl,
    measuredAt: input.measuredAt,
    status: findings.length ? "needs-attention" : completeEvidence ? "clear" : "insufficient-evidence",
    coverage: { metricsObserved: observedFieldMetrics, metricsExpected: 6, axeAuditComplete: input.accessibility.axeAuditComplete, manualReviewComplete: input.accessibility.manualReviewComplete },
    metrics: results,
    findings,
  };
}

/** Exposes the deterministic review as a least-privilege ASES agent capability. */
export function createFrontendQualityAgent(): { declaration: AgentDeclaration; review: typeof reviewFrontendQuality } {
  return {
    declaration: createAgentDeclaration({
      id: "frontend-quality-review",
      permissions: [],
      budget: { maxSteps: 1, maxDurationMs: 1_000, maxTokens: 1, maxCostUsd: 0 },
      contextPaths: [],
    }),
    review: reviewFrontendQuality,
  };
}
