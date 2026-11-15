import { lstat, readFile, realpath, readdir } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { readCatalog } from "./catalog.js";
import type { EvaluationStatus } from "./observability.js";
import { VERSION } from "./version.js";

export interface DashboardWorkflow {
  id: string;
  state: "pending" | "in-progress" | "complete";
  completedSteps: number;
  totalSteps: number;
  updatedAt: string;
}

export interface DashboardTrace {
  name: string;
  status: EvaluationStatus;
  startedAt: string;
  durationMs: number;
  cost?: { amount: number; currency: string; basis: "reported" | "measured" };
}

export interface DashboardData {
  catalog: string;
  productId?: string;
  requirements: { total: number; byStatus: Record<string, number>; evidenceByIntegrity: Record<string, number> };
  workflows: DashboardWorkflow[];
  costs: Array<{ currency: string; basis: "reported" | "measured"; amount: number; events: number }>;
  traces: DashboardTrace[];
  warnings: string[];
}

function escapeHtml(value: unknown): string {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function formatMoney(amount: number, currency: string): string {
  try { return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(amount); }
  catch { return `${amount.toFixed(2)} ${currency}`; }
}

export function renderDashboardHtml(data: DashboardData, generatedAt = new Date().toISOString()): string {
  const statusRows = Object.entries(data.requirements.byStatus).sort(([a], [b]) => a.localeCompare(b));
  const evidenceRows = Object.entries(data.requirements.evidenceByIntegrity).sort(([a], [b]) => a.localeCompare(b));
  const statusTable = statusRows.length
    ? `<table><thead><tr><th scope="col">Estado</th><th scope="col">Requisitos</th></tr></thead><tbody>${statusRows.map(([status, count]) => `<tr><th scope="row"><span class="state state-${escapeHtml(status.toLowerCase())}">${escapeHtml(status)}</span></th><td>${count}</td></tr>`).join("")}</tbody></table>`
    : `<p class="empty">Nenhum requisito no catálogo selecionado.</p>`;
  const evidenceTable = evidenceRows.length
    ? `<table><thead><tr><th scope="col">Integridade</th><th scope="col">Evidências</th></tr></thead><tbody>${evidenceRows.map(([state, count]) => `<tr><th scope="row"><span class="state state-${escapeHtml(state.toLowerCase())}">${escapeHtml(state)}</span></th><td>${count}</td></tr>`).join("")}</tbody></table>`
    : `<p class="empty">Nenhuma evidência registrada até agora.</p>`;
  const workflowContent = data.workflows.length
    ? `<ul class="workflow-list">${data.workflows.map((workflow) => {
      const progress = workflow.totalSteps ? Math.round(workflow.completedSteps / workflow.totalSteps * 100) : 0;
      return `<li><div class="workflow-heading"><strong>${escapeHtml(workflow.id)}</strong><span class="state state-${escapeHtml(workflow.state)}">${workflow.state === "complete" ? "Concluído" : workflow.state === "in-progress" ? "Em andamento" : "Pendente"}</span></div><progress max="100" value="${progress}" aria-label="${escapeHtml(workflow.id)}: ${workflow.completedSteps} de ${workflow.totalSteps} etapas"></progress><p>${workflow.completedSteps} de ${workflow.totalSteps} etapas · atualizado ${escapeHtml(workflow.updatedAt)}</p></li>`;
    }).join("")}</ul>`
    : `<p class="empty">Nenhum checkpoint de workflow foi salvo neste workspace.</p>`;
  const costTable = data.costs.length
    ? `<table><thead><tr><th scope="col">Base</th><th scope="col">Valor acumulado</th><th scope="col">Registros</th></tr></thead><tbody>${data.costs.map((cost) => `<tr><th scope="row">${cost.basis === "reported" ? "Informado pelo provider" : "Medido"}</th><td class="numeric">${escapeHtml(formatMoney(cost.amount, cost.currency))}</td><td>${cost.events}</td></tr>`).join("")}</tbody></table><p class="note">Valores somados dos traces locais, limitados aos últimos 5.000 eventos. Nenhum valor é estimado.</p>`
    : `<p class="empty">Nenhum custo foi registrado. O ASES não estima custos ausentes.</p>`;
  const traceContent = data.traces.length
    ? `<div class="table-scroll"><table><thead><tr><th scope="col">Evento</th><th scope="col">Estado</th><th scope="col">Início</th><th scope="col">Duração</th><th scope="col">Custo</th></tr></thead><tbody>${data.traces.map((trace) => `<tr><th scope="row">${escapeHtml(trace.name)}</th><td><span class="state state-${escapeHtml(trace.status.toLowerCase())}">${escapeHtml(trace.status)}</span></td><td>${escapeHtml(trace.startedAt)}</td><td class="numeric">${Math.round(trace.durationMs)} ms</td><td class="numeric">${trace.cost ? `${escapeHtml(formatMoney(trace.cost.amount, trace.cost.currency))} · ${trace.cost.basis === "reported" ? "informado" : "medido"}` : "—"}</td></tr>`).join("")}</tbody></table></div>`
    : `<p class="empty">Nenhum trace local disponível. O registro é opt-in pelo código que instrumenta a operação.</p>`;
  const warnings = data.warnings.length ? `<aside class="warnings" aria-labelledby="warnings-title"><h2 id="warnings-title">Avisos de leitura</h2><ul>${data.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul></aside>` : "";
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none';">
  <meta name="color-scheme" content="light">
  <title>Visão do projeto · EUREKA42 ASES</title>
  <style>
    :root{color-scheme:light;--ink:#182522;--muted:#4a5e58;--line:#d7e1dd;--paper:#fff;--canvas:#f4f7f5;--brand:#0e8a77;--brand-deep:#086b5c;--good:#116557;--warn:#715800;--bad:#a03232;--neutral:#53645e;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-synthesis:none;text-rendering:optimizeLegibility}
    *{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--ink);font-size:15px;line-height:1.5}a{color:var(--brand-deep)}::selection{background:#b8e5db;color:#102c26}:focus-visible{outline:3px solid #087565;outline-offset:3px}
    .shell{max-width:1180px;margin:auto;padding:28px clamp(16px,4vw,48px) 48px}.topbar{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-bottom:22px;border-bottom:1px solid var(--line)}.wordmark{font-weight:750;letter-spacing:-.025em;font-size:18px}.wordmark span{color:var(--brand-deep)}.top-meta{color:var(--muted);font-size:13px;text-align:right}.page-heading{padding:30px 0 26px}.page-heading h1{font-size:28px;line-height:1.2;letter-spacing:-.025em;margin:0 0 8px}.page-heading p{margin:0;color:var(--muted)}
    .summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;border:1px solid var(--line);background:var(--paper);margin-bottom:28px}.summary>div{padding:16px 18px;border-right:1px solid var(--line)}.summary>div:last-child{border:0}.summary dt{color:var(--muted);font-size:12px;font-weight:650;letter-spacing:.035em;text-transform:uppercase}.summary dd{font-size:20px;font-weight:700;margin:4px 0 0;font-variant-numeric:tabular-nums}
    .sections{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:34px;row-gap:30px}.section{min-width:0;padding-top:18px;border-top:2px solid #bed4cd}.section.wide{grid-column:1/-1}.section h2,.warnings h2{margin:0 0 14px;font-size:17px;line-height:1.3;letter-spacing:-.01em}.section p{color:var(--muted)}table{width:100%;border-collapse:collapse;text-align:left;font-size:13px;font-variant-numeric:tabular-nums}th,td{padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}thead th{font-size:11px;text-transform:uppercase;letter-spacing:.045em;color:var(--muted);font-weight:650;background:#edf2ef}tbody th{font-weight:600}td.numeric{text-align:right;white-space:nowrap}.table-scroll{overflow-x:auto}.state{display:inline-block;font-size:11px;line-height:1.35;font-weight:700;letter-spacing:.02em;color:var(--neutral)}.state-verified,.state-implemented,.state-complete,.state-current,.state-pass{color:var(--good)}.state-failed,.state-fail,.state-stale,.state-missing,.state-expired,.state-outside_workspace{color:var(--bad)}.state-blocked,.state-in-progress,.state-unverifiable{color:var(--warn)}.workflow-list{list-style:none;padding:0;margin:0}.workflow-list li{padding:12px 0;border-bottom:1px solid var(--line)}.workflow-heading{display:flex;justify-content:space-between;gap:12px;align-items:baseline}.workflow-list progress{display:block;width:100%;height:6px;margin:9px 0 4px;accent-color:var(--brand)}.workflow-list p,.note{font-size:12px;margin:0;color:var(--muted)}.empty{margin:0;padding:16px 0;border-bottom:1px solid var(--line);color:var(--muted);max-width:68ch}.warnings{margin-top:28px;padding:16px 18px;background:#fff8e8;border:1px solid #e3d5a8}.warnings h2{color:#4c3b00}.warnings ul{padding-left:20px;margin:0}.warnings li+li{margin-top:5px}.footer{margin-top:34px;padding-top:14px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
    @media(max-width:760px){.summary{grid-template-columns:repeat(2,minmax(0,1fr))}.summary>div:nth-child(2){border-right:0}.summary>div:nth-child(-n+2){border-bottom:1px solid var(--line)}.sections{grid-template-columns:1fr}.section.wide{grid-column:auto}.topbar{align-items:flex-start;flex-direction:column}.top-meta{text-align:left}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
  </style>
</head>
<body><main class="shell">
  <header class="topbar"><div class="wordmark"><span>EUREKA</span>42 <span>· ASES</span></div><div class="top-meta">Snapshot local · ${escapeHtml(generatedAt)}<br>Sem telemetria ou chamadas de rede</div></header>
  <div class="page-heading"><h1>Visão do projeto</h1><p>Catálogo ${escapeHtml(data.catalog)}${data.productId ? ` · produto ${escapeHtml(data.productId)}` : ""}. Atualize os registros no CLI e gere o snapshot novamente.</p></div>
  <dl class="summary"><div><dt>Requisitos</dt><dd>${data.requirements.total}</dd></div><div><dt>Workflows salvos</dt><dd>${data.workflows.length}</dd></div><div><dt>Evidências</dt><dd>${Object.values(data.requirements.evidenceByIntegrity).reduce((sum, count) => sum + count, 0)}</dd></div><div><dt>Eventos recentes (máx. 25)</dt><dd>${data.traces.length}</dd></div></dl>
  <div class="sections">
    <section class="section" aria-labelledby="requirements-title"><h2 id="requirements-title">Requisitos por estado</h2>${statusTable}</section>
    <section class="section" aria-labelledby="evidence-title"><h2 id="evidence-title">Integridade das evidências</h2>${evidenceTable}</section>
    <section class="section" aria-labelledby="workflows-title"><h2 id="workflows-title">Workflows</h2>${workflowContent}</section>
    <section class="section" aria-labelledby="costs-title"><h2 id="costs-title">Custos registrados</h2>${costTable}</section>
    <section class="section wide" aria-labelledby="activity-title"><h2 id="activity-title">Atividade recente</h2>${traceContent}</section>
  </div>
  ${warnings}
  <footer class="footer">EUREKA42 ASES CLI ${escapeHtml(VERSION)} · gerado somente com dados locais do workspace</footer>
</main></body></html>
`;
}

function errorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : undefined;
}

async function safeDirectory(root: string, parts: string[], warnings: string[]): Promise<string | undefined> {
  let path = root;
  for (const part of parts) {
    path = join(path, part);
    try {
      const info = await lstat(path);
      if (!info.isDirectory() || info.isSymbolicLink()) {
        warnings.push("Dados locais ignorados: diretório de observabilidade/workflows não é um diretório regular.");
        return undefined;
      }
    } catch (error) {
      if (errorCode(error) === "ENOENT") return undefined;
      throw error;
    }
  }
  const canonical = await realpath(path);
  const rel = relative(root, canonical);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    warnings.push("Dados locais ignorados: diretório fora do workspace.");
    return undefined;
  }
  return canonical;
}

function isCheckpoint(value: unknown): value is { workflowId: string; order: string[]; completedStepIds: string[]; nextStepIndex: number; updatedAt: string } {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  const order = item["order"];
  const completed = item["completedStepIds"];
  const workflowId = item["workflowId"];
  return typeof workflowId === "string" && /^[a-z][a-z0-9-]{1,62}$/.test(workflowId)
    && Array.isArray(order) && order.every((step) => typeof step === "string")
    && Array.isArray(completed) && completed.every((step) => typeof step === "string")
    && Number.isInteger(item["nextStepIndex"]) && typeof item["updatedAt"] === "string"
    && completed.length <= order.length
    && completed.every((step, index) => step === order[index])
    && item["nextStepIndex"] === completed.length;
}

async function readWorkflowSnapshots(root: string, warnings: string[]): Promise<DashboardWorkflow[]> {
  const directory = await safeDirectory(root, [".ases", "workflows"], warnings);
  if (!directory) return [];
  const files = (await readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.endsWith(".json")).sort((a, b) => a.name.localeCompare(b.name));
  const workflows: DashboardWorkflow[] = [];
  for (const file of files.slice(0, 100)) {
    const path = join(directory, file.name);
    try {
      const info = await lstat(path);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 64 * 1024) throw new Error("invalid snapshot file");
      const value: unknown = JSON.parse(await readFile(path, "utf8"));
      if (!isCheckpoint(value)) throw new Error("invalid checkpoint");
      const totalSteps = value.order.length;
      const completedSteps = value.completedStepIds.length;
      workflows.push({ id: value.workflowId, state: completedSteps === totalSteps && totalSteps > 0 ? "complete" : completedSteps ? "in-progress" : "pending", completedSteps, totalSteps, updatedAt: value.updatedAt });
    } catch {
      warnings.push("Um snapshot de workflow inválido foi ignorado.");
    }
  }
  if (files.length > 100) warnings.push("A lista de workflows foi limitada a 100 snapshots.");
  return workflows;
}

function isTrace(value: unknown): value is { name: string; status: EvaluationStatus; startedAt: string; durationMs: number; cost?: { amount: number; currency: string; basis: "reported" | "measured" } } {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  if (typeof item["name"] !== "string" || !["PASS", "FAIL", "BLOCKED", "SKIPPED"].includes(String(item["status"])) || typeof item["startedAt"] !== "string" || !Number.isFinite(item["durationMs"]) || Number(item["durationMs"]) < 0) return false;
  const cost = item["cost"];
  if (cost === undefined) return true;
  if (!cost || typeof cost !== "object") return false;
  const valueCost = cost as Record<string, unknown>;
  return typeof valueCost["amount"] === "number" && Number.isFinite(valueCost["amount"]) && valueCost["amount"] >= 0
    && typeof valueCost["currency"] === "string" && /^[A-Z]{3}$/.test(valueCost["currency"])
    && ["reported", "measured"].includes(String(valueCost["basis"]));
}

async function readTraceSnapshots(root: string, warnings: string[]): Promise<DashboardTrace[]> {
  const directory = await safeDirectory(root, [".ases", "observability"], warnings);
  if (!directory) return [];
  const path = join(directory, "traces.jsonl");
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 4 * 1024 * 1024) throw new Error("invalid trace file");
    const content = await readFile(path, "utf8");
    const traces: DashboardTrace[] = [];
    let invalid = 0;
    for (const line of content.split(/\r?\n/).filter(Boolean).slice(-5000)) {
      if (Buffer.byteLength(line, "utf8") > 64 * 1024) { invalid++; continue; }
      try {
        const value: unknown = JSON.parse(line);
        if (!isTrace(value)) { invalid++; continue; }
        traces.push({ name: value.name, status: value.status, startedAt: value.startedAt, durationMs: value.durationMs, ...(value.cost ? { cost: value.cost } : {}) });
      } catch { invalid++; }
    }
    if (invalid) warnings.push(`${invalid} trace(s) inválido(s) foram ignorados.`);
    if (content.split(/\r?\n/).filter(Boolean).length > 5000) warnings.push("A leitura de traces foi limitada aos 5.000 eventos mais recentes.");
    return traces.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  } catch (error) {
    if (errorCode(error) === "ENOENT") return [];
    warnings.push("Arquivo local de traces inválido ou acima do limite; ignorado.");
    return [];
  }
}

export async function readDashboardData(workspace: string, productId?: string): Promise<DashboardData> {
  const root = await realpath(resolve(workspace));
  const catalog = await readCatalog(root, productId);
  const warnings: string[] = [];
  const byStatus: Record<string, number> = {};
  const evidenceByIntegrity: Record<string, number> = {};
  for (const requirement of catalog.requirements) {
    byStatus[requirement.status] = (byStatus[requirement.status] ?? 0) + 1;
    for (const evidence of requirement.evidence ?? []) {
      const integrity = evidence.integrity ?? "UNVERIFIABLE";
      evidenceByIntegrity[integrity] = (evidenceByIntegrity[integrity] ?? 0) + 1;
    }
  }
  const [workflows, traces] = await Promise.all([readWorkflowSnapshots(root, warnings), readTraceSnapshots(root, warnings)]);
  const costs = new Map<string, { currency: string; basis: "reported" | "measured"; amount: number; events: number }>();
  for (const trace of traces) {
    if (!trace.cost) continue;
    const key = `${trace.cost.currency}:${trace.cost.basis}`;
    const total = costs.get(key) ?? { currency: trace.cost.currency, basis: trace.cost.basis, amount: 0, events: 0 };
    total.amount += trace.cost.amount;
    total.events++;
    costs.set(key, total);
  }
  return {
    catalog: catalog.catalog,
    ...(catalog.productId ? { productId: catalog.productId } : {}),
    requirements: { total: catalog.requirements.length, byStatus, evidenceByIntegrity },
    workflows,
    costs: [...costs.values()].sort((a, b) => a.currency.localeCompare(b.currency) || a.basis.localeCompare(b.basis)),
    traces: traces.slice(0, 25),
    warnings
  };
}
