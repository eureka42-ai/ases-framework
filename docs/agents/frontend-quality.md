# Frontend quality review agent

`reviewFrontendQuality` is a deterministic, local reviewer for structured performance and accessibility evidence. It does not open the supplied page, run Lighthouse or axe, install a browser, call a model, or edit source files. A workflow may collect those artifacts through separately authorized tools, then pass their bounded summaries to this reviewer.

## Input

Provide the page URL, an ISO timestamp, mobile and desktop Web Vitals, and accessibility evidence:

```ts
const report = reviewFrontendQuality({
  pageUrl: "https://example.test/catalog?token=removed",
  measuredAt: "2026-11-15T12:00:00.000Z",
  performance: {
    mobile: {
      lcpMs: { value: 2300, source: "field", percentile: 75, sampleCount: 500 },
      inpMs: { value: 160, source: "field", percentile: 75, sampleCount: 500 },
      cls: { value: 0.04, source: "field", percentile: 75, sampleCount: 500 },
    },
    desktop: {
      lcpMs: { value: 1900, source: "field", percentile: 75, sampleCount: 900 },
      inpMs: { value: 120, source: "field", percentile: 75, sampleCount: 900 },
      cls: { value: 0.02, source: "field", percentile: 75, sampleCount: 900 },
    },
  },
  accessibility: {
    axeAuditComplete: true,
    manualReviewComplete: true,
    violations: [{ id: "color-contrast", impact: "serious", nodeCount: 2 }],
  },
});
```

Field metrics are classified against the current Core Web Vitals “good” and “poor” thresholds: LCP ≤2,500 ms / >4,000 ms; INP ≤200 ms / >500 ms; CLS ≤0.1 / >0.25. The report evaluates each device separately. It only classifies field data when the caller identifies the 75th percentile. Lab observations remain `lab-only` context and never count as field coverage or a pass. Thresholds are based on [web.dev Core Web Vitals](https://web.dev/articles/vitals) and [threshold definitions](https://web.dev/articles/defining-core-web-vitals-thresholds).

Accessibility summaries use axe rule IDs, impact, and affected-node counts. Critical/serious/moderate/minor map to critical/high/medium/low recommendations. An empty violation list is not treated as an audit unless `axeAuditComplete` is true. `clear` requires all six field metrics, `axeAuditComplete: true`, and `manualReviewComplete: true`; otherwise the result is `insufficient-evidence` or `needs-attention`. Automated axe checks do not replace manual keyboard, focus, zoom/reflow, or assistive-technology review. See [Lighthouse accessibility scoring](https://developer.chrome.com/docs/lighthouse/accessibility/scoring).

The URL must be HTTP(S) and contain no user information. Query parameters and fragments are stripped before the report is returned. Violation details are reduced to bounded IDs, impact, and node counts. Findings are sorted deterministically and contain generic remediation guidance.

## Agent declaration

`createFrontendQualityAgent()` returns this review function with no workspace, network, or command permissions, a zero-cost budget, and no context paths. The one-token declaration ceiling is structural; the evaluator itself is deterministic and does not call a model.
