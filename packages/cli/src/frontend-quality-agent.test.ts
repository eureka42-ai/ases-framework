import assert from "node:assert/strict";
import test from "node:test";
import { createFrontendQualityAgent, reviewFrontendQuality, type FrontendAuditEvidence, type MetricObservation } from "./frontend-quality-agent.js";

const observedAt = "2026-11-15T12:00:00.000Z";
function field(value: number): MetricObservation { return { value, source: "field", sampleCount: 1_000, percentile: 75 }; }
function goodEvidence(): FrontendAuditEvidence {
  return {
    pageUrl: "https://example.com/product?session=secret#overview",
    measuredAt: observedAt,
    performance: {
      mobile: { lcpMs: field(2_400), inpMs: field(180), cls: field(0.08) },
      desktop: { lcpMs: field(2_200), inpMs: field(120), cls: field(0.02) },
    },
    accessibility: { violations: [], axeAuditComplete: true, manualReviewComplete: true },
  };
}

test("frontend quality review clears complete good field metrics and removes URL query data", () => {
  const report = reviewFrontendQuality(goodEvidence());
  assert.equal(report.status, "clear");
  assert.equal(report.page, "https://example.com/product");
  assert.equal(report.coverage.metricsObserved, 6);
  assert.equal(report.coverage.manualReviewComplete, true);
  assert.equal(report.findings.length, 0);
});

test("frontend quality review prioritizes poor and needs-improvement Core Web Vitals by device", () => {
  const evidence = goodEvidence();
  evidence.performance!.mobile!.lcpMs = field(4_100);
  evidence.performance!.mobile!.inpMs = field(350);
  evidence.performance!.desktop!.cls = field(0.2);
  const report = reviewFrontendQuality(evidence);
  assert.equal(report.status, "needs-attention");
  assert.deepEqual(report.findings.map((item) => [item.id, item.severity]), [
    ["mobile-lcpMs", "critical"], ["desktop-cls", "high"], ["mobile-inpMs", "high"],
  ]);
  assert.match(report.findings[0]!.recommendation, /largest above-the-fold/);
});

test("lab metrics are context only and incomplete field coverage never reports a pass", () => {
  const report = reviewFrontendQuality({
    pageUrl: "http://localhost:4173/",
    measuredAt: observedAt,
    performance: { mobile: { lcpMs: { value: 1_100, source: "lab", sampleCount: 1 } } },
    accessibility: { violations: [], axeAuditComplete: true, manualReviewComplete: false },
  });
  assert.equal(report.metrics[0]!.status, "lab-only");
  assert.equal(report.coverage.metricsObserved, 0);
  assert.equal(report.status, "needs-attention");
  assert.equal(report.findings[0]!.id, "a11y-manual-review");
});

test("an empty axe result is insufficient unless the automated audit completed", () => {
  const evidence = goodEvidence();
  evidence.accessibility.axeAuditComplete = false;
  const report = reviewFrontendQuality(evidence);
  assert.equal(report.status, "needs-attention");
  assert.equal(report.coverage.axeAuditComplete, false);
  assert.equal(report.findings[0]!.id, "a11y-automated-audit");
});

test("frontend quality review maps axe impact and orders findings deterministically", () => {
  const evidence = goodEvidence();
  evidence.accessibility.violations = [
    { id: "color-contrast", impact: "serious", nodeCount: 4 },
    { id: "landmark-one-main", impact: "moderate", nodeCount: 1 },
    { id: "image-alt", impact: "critical", nodeCount: 2 },
  ];
  const report = reviewFrontendQuality(evidence);
  assert.deepEqual(report.findings.map((item) => item.id), ["axe-image-alt", "axe-color-contrast", "axe-landmark-one-main"]);
  assert.equal(report.findings[0]!.severity, "critical");
  assert.equal(report.findings[0]!.evidence.nodeCount, 2);
});

test("frontend quality evidence rejects unsafe URLs, invalid field percentiles and duplicate rules", () => {
  const base = goodEvidence();
  assert.throws(() => reviewFrontendQuality({ ...base, pageUrl: "https://user:pass@example.com/" }), /without credentials/);
  const invalidPercentile = goodEvidence();
  invalidPercentile.performance!.mobile!.lcpMs = { value: 2_000, source: "field", sampleCount: 100 };
  assert.throws(() => reviewFrontendQuality(invalidPercentile), /percentile 75/);
  const duplicateRule = goodEvidence();
  duplicateRule.accessibility.violations = [
    { id: "image-alt", impact: "serious", nodeCount: 1 },
    { id: "image-alt", impact: "minor", nodeCount: 2 },
  ];
  assert.throws(() => reviewFrontendQuality(duplicateRule), /unique IDs/);
});

test("frontend quality agent has no project permissions and no billable cost", () => {
  const agent = createFrontendQualityAgent();
  assert.deepEqual(agent.declaration.permissions, []);
  assert.equal(agent.declaration.budget.maxTokens, 1);
  assert.equal(agent.declaration.budget.maxCostUsd, 0);
  assert.equal(agent.review(goodEvidence()).status, "clear");
});
