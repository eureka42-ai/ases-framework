import { createHash } from "node:crypto";
import type { CatalogFile } from "./catalog.js";

function nodeId(prefix: string, value: string): string {
  const digest = createHash("sha256").update(value).digest("hex").slice(0, 16);
  return `${prefix}_${digest}`;
}

function label(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/`/g, "&#96;");
}

export function renderTraceabilityGraph(catalog: CatalogFile): string {
  const lines = ["flowchart LR"];
  const edges = new Set<string>();
  const allowedStatuses = new Set(["PENDING", "READY", "IN_PROGRESS", "IMPLEMENTED", "VERIFIED", "FAILED", "BLOCKED", "N_A"]);
  for (const requirement of [...catalog.requirements].sort((a, b) => a.id.localeCompare(b.id))) {
    const reqId = nodeId("req", requirement.id);
    const status = allowedStatuses.has(requirement.status) ? requirement.status : "PENDING";
    lines.push(`  ${reqId}["${label(requirement.id)} · ${label(requirement.title)}<br/>${status}"]`);
    for (const reference of requirement.traceability?.decisionRefs ?? []) {
      const id = nodeId("decision", reference);
      lines.push(`  ${id}["Decision · ${label(reference)}"]`);
      edges.add(`  ${id} --> ${reqId}`);
    }
    for (const reference of requirement.traceability?.testRefs ?? []) {
      const id = nodeId("test", reference);
      lines.push(`  ${id}["Test · ${label(reference)}"]`);
      edges.add(`  ${id} --> ${reqId}`);
    }
    for (const evidence of requirement.evidence ?? []) {
      const reference = evidence.description || evidence.id;
      const id = nodeId("evidence", `${evidence.id}\0${reference}`);
      const integrity = evidence.integrity ?? "UNVERIFIABLE";
      lines.push(`  ${id}["Evidence · ${label(reference)}<br/>${label(integrity)}"]`);
      edges.add(`  ${id} --> ${reqId}`);
    }
    if (requirement.blocker) {
      const reference = `${requirement.blocker.dependency}: ${requirement.blocker.reason}`;
      const id = nodeId("blocker", reference);
      lines.push(`  ${id}["Blocker · ${label(reference)}"]`);
      edges.add(`  ${id} -.-> ${reqId}`);
    }
  }
  lines.push(...[...edges].sort());
  return `${lines.join("\n")}\n`;
}
