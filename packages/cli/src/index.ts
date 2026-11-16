import { access, lstat, mkdir, readFile, rmdir, unlink, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { platform, release } from "node:os";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { renderLogo } from "./brand.js";
import { VERSION } from "./version.js";
import { runInterview } from "./interview.js";
import { importAses300, importProductRequirements, readCatalog, updateDecision, updateRequirement } from "./catalog.js";
import { resolveConfigLayers } from "./config-resolution.js";
import { createHostPlan, HOSTS, type HostId } from "./host-plan.js";
import { applyHostIntegration, restoreHostBackup, uninstallHostIntegration, updateHostIntegration } from "./host-install.js";
import { removeInstalledPlugin } from "./plugin-lifecycle.js";
import { renderTraceabilityGraph } from "./traceability-graph.js";
import { readDashboardData, renderDashboardHtml } from "./dashboard.js";
import { generateAsesConfigJsonSchema, validateAsesConfig } from "./config-schema.js";
import { checkArchitectureContracts } from "./architecture-contracts.js";
import { createTeamPolicyEngine, isSecurityAction, readTeamPolicyFile, teamPolicyTemplate, validateTeamPolicy } from "./team-policy.js";
import { exportTrackerTasks, importTrackerTasks } from "./tracker-exchange.js";
import { applyProjectTemplate, getProjectTemplate, listProjectTemplates } from "./templates.js";
import { installKnowledgeLibrary, knowledgeLibraryManifest, listKnowledgeLibraries, validateKnowledgeLibrary } from "./knowledge.js";
import { renderHelp, resolveLocale, welcomeTagline } from "./i18n.js";
import { analyzeCodeImpact } from "./code-impact.js";
import { runMutationCampaign } from "./mutation-testing.js";
import { createCloudflareVectorizeStore, createLocalVectorStore, createPgVectorStore, createQdrantVectorStore } from "./vector-store.js";
import { createR2BackupObjectStore, decryptBackup, deleteEncryptedBackup, downloadEncryptedBackup, encryptBackup, uploadEncryptedBackup } from "./encrypted-backup.js";

export { VERSION } from "./version.js";
export { indexRagSources, RagAccessError, refreshRagIndex, retrieveRequirement, searchRag } from "./rag.js";
export type { RagIndex, RagQueryAccess, RagQueryFilters, RagQueryOptions, RagResult, RagSourceMetadata } from "./rag.js";
export { createContextBundle, forgetMemory, inspectMemory, remember, verifyContextBundle } from "./memory.js";
export type { ContextBundle, ContextBundleInput, ContextBundleItem, MemoryEntry, MemoryOrigin, MemoryScope } from "./memory.js";
export { BundleArchiveError, importBundleArchive, previewBundleArchive } from "./bundle-archive.js";
export type { BundleArchivePreview } from "./bundle-archive.js";
export { authorizeCommand, commandPolicyResource, PolicyAccessError, SecurityPolicyEngine } from "./policy.js";
export type { AuthorizedCommandPlan, CommandRequest, PolicyDecision, PolicyEffect, SecurityAction, SecurityPolicyRequest, SecurityPolicyRule } from "./policy.js";
export { AgentAclError, createAgentMessageBus } from "./agent-protocol.js";
export type { A2AMessage, AgentAclRule, AgentMessageType, ReceivedA2AMessage } from "./agent-protocol.js";
export { createFrontendQualityAgent, reviewFrontendQuality } from "./frontend-quality-agent.js";
export type { AuditImpact, AuditSource, AxeViolationSummary, CoreWebVital, FrontendAuditEvidence, FrontendDevice, FrontendMetricResult, FrontendQualityFinding, FrontendQualityReport, MetricObservation } from "./frontend-quality-agent.js";
export { createRepositoryRegistry } from "./multi-repo.js";
export type { AuthorizedRepository, RepositoryDefinition, RepositoryMembership, RepositoryOperation, RepositoryRole } from "./multi-repo.js";
export { createCommunityAgentCatalog } from "./community-agents.js";
export type { CommunityAgentCatalogOptions, CommunityAgentQuery, CommunityAgentRelease, DiscoveredCommunityAgent } from "./community-agents.js";
export { createSupportLedger } from "./support-ledger.js";
export type { IncidentSeverity, IncidentStatus, SlaPolicy, SlaTarget, SupportIncident, SupportIncidentEvent, SupportIncidentView } from "./support-ledger.js";
export { createConsoleAuth, createLocalConsoleApp, hashConsolePassword, startLocalConsole } from "./console-auth.js";
export type { ConsoleAction, ConsoleAuthOptions, ConsoleMembership, ConsoleRole, ConsoleSession, ConsoleUserRecord, LocalConsoleOptions, TrustedConsoleIdentity } from "./console-auth.js";
export { createFeatureWorkflow, createWorkflowCheckpoint, executeFeatureWorkflow, executeWorkflow, isWorkflowApprovalSatisfied, loadWorkflowCheckpoint, resumeWorkflow, runStepWithRetry, saveWorkflowCheckpoint, validateWorkflow } from "./workflows.js";
export type { FeatureWorkflowHandlers, WorkflowApproval, WorkflowDefinition, WorkflowExecutionContext, WorkflowPermission, WorkflowRetryOptions, WorkflowRunResult, WorkflowStep, WorkflowStepKind } from "./workflows.js";
export { createSafeLogRecord, writeSafeLog } from "./logging.js";
export type { SafeLogRecord, SafeLogResult } from "./logging.js";
export { redactSensitiveText } from "./memory.js";
export { appendLocalTrace, createOtlpTraceExport, createTraceEvent, readLocalTraces, readTelemetryConsent, runEvaluations, sendOtlpTelemetry, sendRemoteTelemetry, setTelemetryConsent, summarizeAgentMetrics, writeEvaluationReport } from "./observability.js";
export type { AgentMetric, EvaluationCase, EvaluationResult, EvaluationStatus, OtlpTraceExport, TelemetryConsent, TraceEvent } from "./observability.js";
export { runPluginContractCases, validatePluginContract, validatePluginManifest } from "./plugins.js";
export type { PluginContract, PluginContractCase, PluginManifest, PluginValidationOptions } from "./plugins.js";
export { createPluginInstallManifest, removeInstalledPlugin } from "./plugin-lifecycle.js";
export type { PluginInstallManifest, PluginRemovalResult } from "./plugin-lifecycle.js";
export { restoreHostBackup } from "./host-install.js";
export { renderTraceabilityGraph } from "./traceability-graph.js";
export { readDashboardData, renderDashboardHtml } from "./dashboard.js";
export type { DashboardData, DashboardTrace, DashboardWorkflow } from "./dashboard.js";
export { rankToolsByCapabilities } from "./tools.js";
export type { ToolCapabilityMatch } from "./tools.js";
export { compareModelBenchmarkSummaries, runModelBenchmark } from "./benchmark.js";
export type { ModelBenchmarkComparison, ModelBenchmarkComparisonRow, ModelBenchmarkFixture, ModelBenchmarkOptions, ModelBenchmarkReport, ModelBenchmarkSample, ModelBenchmarkStatus, ModelBenchmarkSummary } from "./benchmark.js";
export { ProviderError } from "./providers.js";
export type { GenerateOptions, Provider, ProviderCapability, ProviderContext, ProviderErrorCode, ProviderRequest, ProviderResponse } from "./providers.js";
export { asesConfigSchema, generateAsesConfigJsonSchema, validateAsesConfig } from "./config-schema.js";
export type { AsesConfig } from "./config-schema.js";
export { checkArchitectureContracts } from "./architecture-contracts.js";
export type { ArchitectureAssertion, ArchitectureAssertionStatus, ArchitectureContractReport, ArchitectureContractResult } from "./architecture-contracts.js";
export { createTeamPolicyEngine, isSecurityAction, readTeamPolicyFile, teamPolicyTemplate, validateTeamPolicy } from "./team-policy.js";
export type { TeamPolicyDocument, TeamPolicyRule, TeamPolicyValidation } from "./team-policy.js";
export { exportTrackerTasks, importTrackerTasks } from "./tracker-exchange.js";
export type { TrackerBundle, TrackerTask } from "./tracker-exchange.js";
export { importGitHubWorkItems, importGitLabWorkItems } from "./tracker-providers.js";
export type { GitHubTrackerOptions, GitLabTrackerOptions, RemoteTrackerImport, RemoteTrackerOptions } from "./tracker-providers.js";
export { renderHelp, resolveLocale } from "./i18n.js";
export { analyzeCodeImpact } from "./code-impact.js";
export type { CodeImpactOptions, CodeImpactReport } from "./code-impact.js";
export { runMutationCampaign } from "./mutation-testing.js";
export type { MutationCampaignOptions, MutationCampaignReport, MutationRunnerInput, MutationRunnerResult, MutationTestRunner } from "./mutation-testing.js";
export { createOidcGroupMapper, createOidcSso, createOidcSsoRouter } from "./oidc-sso.js";
export type { OidcClaims, OidcGroupMapperOptions, OidcGroupPolicy, OidcIdentity, OidcLoginStart, OidcRouterOptions, OidcSessionAuth, OidcSsoOptions } from "./oidc-sso.js";
export { createRemoteExecutionClient } from "./remote-execution.js";
export type { RemoteExecutionFile, RemoteExecutionOptions, RemoteExecutionRequest, RemoteExecutionResult } from "./remote-execution.js";
export { createCloudflareVectorizeStore, createLocalVectorStore, createPgVectorStore, createQdrantVectorStore };
export type { PgVectorQuery, QdrantOptions, VectorDocument, VectorDocumentMetadata, VectorMatch, VectorQuery, VectorStoreAdapter, VectorizeBinding } from "./vector-store.js";
export { createR2BackupObjectStore, decryptBackup, deleteEncryptedBackup, downloadEncryptedBackup, encryptBackup, uploadEncryptedBackup };
export type { BackupSyncOptions, EncryptedBackupEnvelope, EncryptedBackupObjectStore, R2BucketBinding } from "./encrypted-backup.js";
export type { Locale } from "./i18n.js";
export { applyProjectTemplate, getProjectTemplate, listProjectTemplates } from "./templates.js";
export type { ProjectTemplate } from "./templates.js";
export { installKnowledgeLibrary, knowledgeLibraryManifest, listKnowledgeLibraries, validateKnowledgeLibrary } from "./knowledge.js";
export type { KnowledgeLibraryValidation } from "./knowledge.js";

export interface CommandResult {
  exitCode: number;
  output: string;
}

interface ProjectConfig {
  schemaVersion: "1";
  project: {
    id: string;
    name: string;
    locale: "pt-BR" | "en-US" | "es-ES" | "it-IT";
    mode: "host" | "standalone" | "headless" | "offline";
    privacy: "local-only";
  };
}

const execFileAsync = promisify(execFile);

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "ases-project";
}

function optionValues(argv: string[], name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === name) {
      const value = argv[index + 1];
      if (value && !value.startsWith("--")) values.push(value);
    } else if (argv[index]?.startsWith(`${name}=`)) {
      values.push(argv[index]!.slice(name.length + 1));
    }
  }
  return values;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function validateConfig(value: unknown): string[] {
  return validateAsesConfig(value);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

export function checkNodeVersion(version: string): { status: "pass" | "warn"; remediation?: string } {
  const major = Number(version.match(/^(\d+)/)?.[1]);
  return Number.isFinite(major) && major >= 22
    ? { status: "pass" }
    : { status: "warn", remediation: "Instale Node.js 22 ou superior, conforme engines.node do projeto." };
}

async function initProject(rootArg: string | undefined, dryRun: boolean, json: boolean): Promise<CommandResult> {
  const root = resolve(rootArg ?? process.cwd());
  const name = basename(root);
  const asesDir = join(root, ".ases");
  const configPath = join(asesDir, "config.json");
  const statusPath = join(asesDir, "STATUS.md");
  const nextStepsPath = join(root, "NEXT_STEPS.md");
  const manifestPath = join(asesDir, "install-manifest.json");
  const plan = [configPath, statusPath, nextStepsPath, manifestPath];
  const conflicts = [];
  for (const path of plan) if (await exists(path)) conflicts.push(path);

  if (conflicts.length > 0) {
    const payload = { status: "unchanged", code: "ASES_INIT_EXISTS", root, conflicts };
    return { exitCode: 0, output: json ? JSON.stringify(payload, null, 2) : `Workspace já inicializado; nenhum arquivo sobrescrito.\n${conflicts.join("\n")}` };
  }

  if (dryRun) {
    const payload = { status: "planned", root, create: plan };
    return { exitCode: 0, output: json ? JSON.stringify(payload, null, 2) : `Plano de inicialização:\n${plan.map((p) => `CREATE ${p}`).join("\n")}` };
  }

  const config: ProjectConfig = {
    schemaVersion: "1",
    project: { id: slugify(name), name, locale: "pt-BR", mode: "host", privacy: "local-only" }
  };
  const generated = [
    { path: ".ases/config.json", absolute: configPath, content: `${JSON.stringify(config, null, 2)}\n` },
    { path: ".ases/STATUS.md", absolute: statusPath, content: "# Status do projeto ASES\n\nEstado: INITIALIZED\n\nNenhum requisito foi verificado ainda.\n" },
    { path: "NEXT_STEPS.md", absolute: nextStepsPath, content: "# Próximos passos\n\n1. Execute `ases doctor`.\n2. Revise `.ases/config.json`.\n3. Mantenha decisões humanas como `PROPOSED` até confirmação.\n" }
  ];
  await mkdir(asesDir, { recursive: true });
  for (const file of generated) await writeFile(file.absolute, file.content, { flag: "wx" });
  const manifestBase = {
    format: "eureka42-ases-install-manifest",
    schemaVersion: "1",
    files: generated.map((file) => ({ path: file.path, sha256: createHash("sha256").update(file.content).digest("hex") }))
  };
  const manifest = { ...manifestBase, manifestSha256: createHash("sha256").update(JSON.stringify(manifestBase)).digest("hex") };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  const payload = { status: "initialized", root, created: plan };
  return { exitCode: 0, output: json ? JSON.stringify(payload, null, 2) : `Workspace inicializado em ${root}.\n${plan.join("\n")}` };
}

const uninstallableFiles = new Set([".ases/config.json", ".ases/STATUS.md", "NEXT_STEPS.md"]);

interface InstallManifest {
  format: "eureka42-ases-install-manifest";
  schemaVersion: "1";
  files: Array<{ path: string; sha256: string }>;
  manifestSha256: string;
}

async function uninstallProject(rootArg: string | undefined, apply: boolean, json: boolean): Promise<CommandResult> {
  const root = resolve(rootArg ?? process.cwd());
  const asesDir = join(root, ".ases");
  const manifestPath = join(asesDir, "install-manifest.json");
  try {
    const asesInfo = await lstat(asesDir);
    if (!asesInfo.isDirectory() || asesInfo.isSymbolicLink()) {
      return { exitCode: 3, output: json ? JSON.stringify({ code: "ASES_UNINSTALL_UNSAFE_PATH", root, path: asesDir }) : `Remoção interrompida: ${asesDir} não é um diretório regular.` };
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const payload = { status: "not-managed", root, removed: [], preserved: [], reason: "manifesto de propriedade ausente" };
      return { exitCode: 0, output: json ? JSON.stringify(payload, null, 2) : `Nenhuma instalação ASES rastreada em ${root}; nada foi removido.` };
    }
    throw error;
  }

  let manifest: InstallManifest;
  try {
    const info = await lstat(manifestPath);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error("manifesto não é arquivo regular");
    const parsed = JSON.parse(await readFile(manifestPath, "utf8")) as Partial<InstallManifest>;
    if (parsed.format !== "eureka42-ases-install-manifest" || parsed.schemaVersion !== "1" || !Array.isArray(parsed.files) || parsed.files.length !== uninstallableFiles.size || typeof parsed.manifestSha256 !== "string" || !/^[a-f0-9]{64}$/.test(parsed.manifestSha256)) throw new Error("formato ou lista de arquivos não reconhecida");
    const paths = new Set<string>();
    for (const entry of parsed.files) {
      if (!entry || typeof entry.path !== "string" || !uninstallableFiles.has(entry.path) || paths.has(entry.path) || typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error("entrada de propriedade inválida");
      paths.add(entry.path);
    }
    if (paths.size !== uninstallableFiles.size) throw new Error("manifesto não lista os arquivos esperados");
    const manifestBase = { format: parsed.format, schemaVersion: parsed.schemaVersion, files: parsed.files };
    if (createHash("sha256").update(JSON.stringify(manifestBase)).digest("hex") !== parsed.manifestSha256) throw new Error("hash de integridade do manifesto não confere");
    manifest = parsed as InstallManifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const payload = { status: "not-managed", root, removed: [], preserved: [], reason: "manifesto de propriedade ausente" };
      return { exitCode: 0, output: json ? JSON.stringify(payload, null, 2) : `Nenhum manifesto de propriedade em ${root}; nada foi removido.` };
    }
    const message = error instanceof Error ? error.message : String(error);
    const payload = { code: "ASES_UNINSTALL_MANIFEST_INVALID", root, error: message, removed: [], preserved: [manifestPath] };
    return { exitCode: 3, output: json ? JSON.stringify(payload, null, 2) : `Remoção interrompida: manifesto inválido (${message}). Nenhum arquivo foi removido.` };
  }

  const inspected: Array<{ path: string; absolute: string; action: "remove" | "preserve" | "missing"; reason?: string }> = [];
  for (const entry of manifest.files) {
    const absolute = join(root, ...entry.path.split("/"));
    try {
      const info = await lstat(absolute);
      if (!info.isFile() || info.isSymbolicLink()) inspected.push({ path: entry.path, absolute, action: "preserve", reason: "não é arquivo regular" });
      else {
        const hash = createHash("sha256").update(await readFile(absolute)).digest("hex");
        inspected.push(hash === entry.sha256
          ? { path: entry.path, absolute, action: "remove" }
          : { path: entry.path, absolute, action: "preserve", reason: "conteúdo alterado desde a instalação" });
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") inspected.push({ path: entry.path, absolute, action: "missing" });
      else throw error;
    }
  }

  const removed: string[] = [];
  const preserved = inspected.filter((item) => item.action === "preserve").map(({ path, reason }) => ({ path, reason }));
  if (apply) {
    for (const item of inspected) {
      if (item.action !== "remove") continue;
      await unlink(item.absolute);
      removed.push(item.path);
    }
    if (preserved.length === 0) {
      await unlink(manifestPath);
      removed.push(".ases/install-manifest.json");
      try {
        await rmdir(asesDir);
      } catch (error) {
        if (!["ENOTEMPTY", "EEXIST"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
      }
    } else preserved.push({ path: ".ases/install-manifest.json", reason: "mantido para registrar arquivos preservados" });
  }
  const status = !apply ? "planned" : preserved.length > 0 ? "partial" : "uninstalled";
  const payload = { status, root, apply, removed, ...(apply ? {} : { wouldRemove: inspected.filter((item) => item.action === "remove").map((item) => item.path) }), preserved, missing: inspected.filter((item) => item.action === "missing").map((item) => item.path) };
  return { exitCode: 0, output: json ? JSON.stringify(payload, null, 2) : [`${apply ? "Resultado" : "Plano (nenhuma alteração aplicada)"}: ${status}`, ...(apply ? removed.map((path) => `REMOVED ${path}`) : inspected.filter((item) => item.action === "remove").map((item) => `WOULD REMOVE ${item.path}`)), ...preserved.map((item) => `PRESERVED ${item.path}: ${item.reason}`), ...payload.missing.map((path) => `MISSING ${path}`)].join("\n") };
}

async function doctor(rootArg: string | undefined, json: boolean): Promise<CommandResult> {
  const root = resolve(rootArg ?? process.cwd());
  const git = await detectCommand("git", ["--version"]);
  const npm = await detectCommand("npm", ["--version"]);
  const pnpm = await detectCommand("pnpm", ["--version"]);
  const workspaceExists = await exists(root);
  const configExists = await exists(join(root, ".ases", "config.json"));
  const nodeVersion = process.versions.node;
  const nodeSupport = checkNodeVersion(nodeVersion);
  const checks = [
    { id: "node", status: nodeSupport.status, detail: `v${nodeVersion}`, ...(nodeSupport.remediation ? { remediation: nodeSupport.remediation } : {}) },
    { id: "platform", status: "pass", detail: `${platform()} ${release()}` },
    { id: "git", status: git.available ? "pass" : "warn", detail: git.detail, ...(git.available ? {} : { remediation: "Instale o Git ou adicione o executável ao PATH." }) },
    { id: "npm", status: npm.available ? "pass" : "warn", detail: npm.detail, ...(npm.available ? {} : { remediation: "Instale Node.js com npm ou adicione o executável ao PATH." }) },
    { id: "pnpm", status: pnpm.available ? "pass" : "warn", detail: pnpm.detail, ...(pnpm.available ? {} : { remediation: "Ative pnpm pelo Corepack com `corepack pnpm --version` se o projeto exigir esse gerenciador." }) },
    { id: "workspace", status: workspaceExists ? "pass" : "fail", detail: root, ...(!workspaceExists ? { remediation: `Crie ou corrija o diretório do workspace: ${root}` } : {}) },
    { id: "ases-config", status: configExists ? "pass" : "warn", detail: "configuração ASES local", ...(!configExists ? { remediation: `Execute ases init ${root} para criar a configuração inicial.` } : {}) }
  ];
  const exitCode = checks.some((check) => check.status === "fail") ? 2 : 0;
  return { exitCode, output: json ? JSON.stringify({ root, checks }, null, 2) : checks.map((c) => `${c.status.toUpperCase()} ${c.id}: ${c.detail}${"remediation" in c ? `\n  Próxima ação: ${c.remediation}` : ""}`).join("\n") };
}

async function detectCommand(command: string, args: string[]): Promise<{ available: boolean; detail: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, { timeout: 5_000 });
    return { available: true, detail: (stdout || stderr).trim() };
  } catch {
    return { available: false, detail: `${command} não encontrado ou indisponível` };
  }
}

async function validateConfigCommand(pathArg: string | undefined, json: boolean): Promise<CommandResult> {
  const path = resolve(pathArg ?? join(process.cwd(), ".ases", "config.json"));
  try {
    const content = await readFile(path, "utf8");
    const errors = validateConfig(JSON.parse(content) as unknown);
    const payload = { path, valid: errors.length === 0, errors };
    return { exitCode: errors.length === 0 ? 0 : 3, output: json ? JSON.stringify(payload, null, 2) : errors.length === 0 ? `PASS config válida: ${path}` : `FAIL config inválida:\n${errors.join("\n")}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const payload = { path, valid: false, code: "ASES_CONFIG_READ", error: message };
    return { exitCode: 3, output: json ? JSON.stringify(payload, null, 2) : `FAIL não foi possível validar ${path}: ${message}` };
  }
}

async function explainConfigCommand(pathArg: string | undefined, json: boolean, flags: string[] = []): Promise<CommandResult> {
  const path = resolve(pathArg ?? join(process.cwd(), ".ases", "config.json"));
  try {
    let fileConfig: unknown;
    try {
      fileConfig = JSON.parse(await readFile(path, "utf8")) as unknown;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const root = basename(dirname(path)) === ".ases" ? dirname(dirname(path)) : dirname(path);
    const resolution = resolveConfigLayers({ root, fileConfig, fileSource: path, env: process.env, flags });
    if (resolution.errors.length > 0) {
      const payload = { path, valid: false, errors: resolution.errors };
      return { exitCode: 3, output: json ? JSON.stringify(payload, null, 2) : `FAIL config inválida:\n${resolution.errors.join("\n")}` };
    }
    return { exitCode: 0, output: json ? JSON.stringify({ path, valid: true, resolved: resolution.resolved }, null, 2) : resolution.resolved.map((item) => `${item.key}=${item.value}  [${item.source}]`).join("\n") };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { exitCode: 3, output: json ? JSON.stringify({ path, valid: false, code: "ASES_CONFIG_READ", error: message }, null, 2) : `FAIL não foi possível explicar ${path}: ${message}` };
  }
}

export async function run(argv: string[]): Promise<CommandResult> {
  const json = argv.includes("--json");
  const dryRun = argv.includes("--dry-run");
  const localeResult = resolveLocale(argv);
  if (localeResult.error) return { exitCode: 2, output: json ? JSON.stringify({ code: "ASES_LOCALE_UNSUPPORTED", error: localeResult.error, supported: ["pt-BR", "en-US", "es-ES", "it-IT"] }, null, 2) : localeResult.error };
  const args: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (arg === "--locale") { index += 1; continue; }
    if (arg.startsWith("--locale=") || arg.startsWith("--")) continue;
    args.push(arg);
  }
  if (argv.includes("--version")) return { exitCode: 0, output: VERSION };
  const command = args[0] ?? "help";
  if (command === "help" || command === "--help") return { exitCode: 0, output: `${renderLogo(argv.includes("--no-color") ? false : argv.includes("--color") ? true : undefined, welcomeTagline(localeResult.locale))}\n\n${renderHelp(localeResult.locale)}` };
  if (command === "welcome") return { exitCode: 0, output: renderLogo(argv.includes("--no-color") ? false : argv.includes("--color") ? true : undefined, welcomeTagline(localeResult.locale)) };
  if (command === "dashboard") {
    try {
      const productId = optionValues(argv, "--product")[0];
      const workspace = args.slice(1).filter((arg) => arg !== productId)[0] ?? process.cwd();
      const data = await readDashboardData(workspace, productId);
      return { exitCode: 0, output: json ? JSON.stringify(data, null, 2) : renderDashboardHtml(data) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 5, output: json ? JSON.stringify({ code: "ASES_DASHBOARD_FAILED", error: message }, null, 2) : `Não foi possível gerar o dashboard local: ${message}\nConfira se o workspace contém um catálogo importado.` };
    }
  }
  if (command === "init") return initProject(args[1], dryRun, json);
  if (command === "uninstall") {
    try {
      return await uninstallProject(args[1], argv.includes("--apply") && !dryRun, json);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 3, output: json ? JSON.stringify({ code: "ASES_UNINSTALL_FAILED", error: message }, null, 2) : `Falha na desinstalação segura: ${message}` };
    }
  }
  if (command === "plugin" && args[1] === "remove") {
    if (!args[2]) return { exitCode: 2, output: "Uso: ases plugin remove <plugin-id> [workspace] [--apply]" };
    try {
      const result = await removeInstalledPlugin(args[3] ?? process.cwd(), args[2], argv.includes("--apply") && !dryRun);
      return { exitCode: result.status === "partial" ? 3 : 0, output: json ? JSON.stringify(result, null, 2) : `${result.status.toUpperCase()} plugin ${result.pluginId}\n${JSON.stringify(result, null, 2)}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 3, output: json ? JSON.stringify({ code: "ASES_PLUGIN_REMOVE_FAILED", error: message }) : `Falha na remoção segura do plugin: ${message}` };
    }
  }
  if (command === "interview") {
    try {
      const answersIndex = argv.indexOf("--answers");
      const answersPath = answersIndex >= 0 ? argv[answersIndex + 1] : undefined;
      const resume = argv.includes("--resume");
      if (json && !answersPath) return { exitCode: 2, output: JSON.stringify({ code: "ASES_INTERVIEW_JSON_REQUIRES_ANSWERS", error: "Use --answers <arquivo.json> com --json para evitar misturar prompts e JSON na saída." }, null, 2) };
      if (!answersPath && !process.stdin.isTTY) return { exitCode: 2, output: json ? JSON.stringify({ code: "ASES_INTERVIEW_TTY_REQUIRED", error: "Entrevista interativa exige terminal; forneça --answers <arquivo.json> em execução não interativa." }, null, 2) : "Entrevista interativa exige um terminal. Use --answers <arquivo.json> em automação ou redirecionamentos." };
      const result = await runInterview({ root: args[1] ?? process.cwd(), ...(answersPath ? { answersPath } : {}), resume, dryRun });
      const summary = [...(answersPath ? [renderLogo(), ""] : []), `Projeto: ${result.answers.name}`, `Tipo: ${result.answers.applicationType}`, "", ...result.recommendations.map((item) => `${item.status} ${item.field}: ${item.value}\n  ${item.rationale}`), ...(result.findings.length ? ["", "Contradições e riscos:", ...result.findings.map((finding) => `${finding.severity} ${finding.code}: ${finding.message}`)] : []), "", dryRun ? "Dry-run: nenhum arquivo escrito." : `Arquivos: ${result.files?.join(", ")}`].join("\n");
      return { exitCode: 0, output: json ? JSON.stringify(result, null, 2) : summary };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 4, output: json ? JSON.stringify({ code: "ASES_INTERVIEW_INVALID", error: message }, null, 2) : `FAIL entrevista inválida: ${message}` };
    }
  }
  if (command === "doctor") return doctor(args[1], json);
  if (command === "catalog" && args[1] === "import-ases300") {
    try {
      if (!args[2]) return { exitCode: 2, output: "Uso: ases catalog import-ases300 <arquivo.md> [workspace]" };
      const result = await importAses300(args[2], args[3] ?? process.cwd());
      return { exitCode: 0, output: json ? JSON.stringify({ ...result, status: "IMPORTED_NOT_HOMOLOGATED" }, null, 2) : `Importados ${result.count} requisitos; fonte ${result.hash}; status IMPORTED_NOT_HOMOLOGATED; saída ${result.output}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 5, output: json ? JSON.stringify({ code: "ASES_CATALOG_IMPORT", error: message }, null, 2) : `Falha ao importar catálogo: ${message}` };
    }
  }
  if (command === "catalog" && args[1] === "import-product") {
    try {
      if (!args[2] || !args[3]) return { exitCode: 2, output: "Uso: ases catalog import-product <product-id> <arquivo.md> [workspace]" };
      const result = await importProductRequirements(args[3], args[4] ?? process.cwd(), args[2]);
      return { exitCode: 0, output: json ? JSON.stringify({ ...result, catalog: "product", productId: args[2], status: "IMPORTED_NOT_HOMOLOGATED" }, null, 2) : `Importados ${result.count} requisitos do produto ${args[2]}; fonte ${result.hash}; status IMPORTED_NOT_HOMOLOGATED; saída ${result.output}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 5, output: json ? JSON.stringify({ code: "ASES_PRODUCT_CATALOG_IMPORT", error: message }, null, 2) : `Falha ao importar catálogo do produto: ${message}` };
    }
  }
  if (command === "tracker" && args[1] === "export") {
    try {
      const productId = optionValues(argv, "--product")[0];
      const workspace = args.slice(2).filter((arg) => arg !== productId && arg !== "--json")[0] ?? process.cwd();
      const bundle = await exportTrackerTasks(workspace, productId);
      return { exitCode: 0, output: JSON.stringify(bundle, null, 2) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 5, output: json ? JSON.stringify({ code: "ASES_TRACKER_EXPORT", error: message }, null, 2) : `Falha ao exportar tarefas: ${message}` };
    }
  }
  if (command === "tracker" && args[1] === "import") {
    try {
      if (!args[2]) return { exitCode: 2, output: "Uso: ases tracker import <bundle.json> [workspace] [--apply]" };
      const workspace = args.slice(3).filter((arg) => arg !== "--apply" && arg !== "--json")[0] ?? process.cwd();
      const result = await importTrackerTasks(args[2], workspace, argv.includes("--apply"));
      return { exitCode: 0, output: JSON.stringify(result, null, 2) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 5, output: json ? JSON.stringify({ code: "ASES_TRACKER_IMPORT", error: message }, null, 2) : `Falha ao importar tarefas: ${message}` };
    }
  }
  if (command === "template" && args[1] === "list") return { exitCode: 0, output: json ? JSON.stringify(listProjectTemplates(), null, 2) : listProjectTemplates().map((item) => `${item.id} — ${item.name}\n  ${item.stack}\n  Arquivos: ${item.files.join(", ")}`).join("\n") };
  if (command === "template" && args[1] === "show") {
    try {
      const template = getProjectTemplate(args[2] ?? "");
      return { exitCode: 0, output: json ? JSON.stringify({ ...template, files: template.files.map((file) => ({ path: file.path, bytes: Buffer.byteLength(file.content) })) }, null, 2) : `${template.name}\nID: ${template.id}\nStack: ${template.stack}\nArquivos: ${template.files.map((file) => file.path).join(", ")}` };
    } catch (error) { const message = error instanceof Error ? error.message : String(error); return { exitCode: 2, output: json ? JSON.stringify({ code: "ASES_TEMPLATE_UNKNOWN", error: message }) : message }; }
  }
  if (command === "template" && args[1] === "apply") {
    try {
      const templateId = args[2] ?? "";
      const target = args[3] ?? "";
      const projectName = args[4] ?? basename(resolve(target || "ases-project"));
      if (!target) return { exitCode: 2, output: "Uso: ases template apply <template-id> <diretório-novo> [nome] [--apply]" };
      const result = await applyProjectTemplate(templateId, target, projectName, argv.includes("--apply") && !dryRun);
      return { exitCode: 0, output: json ? JSON.stringify(result, null, 2) : `${result.status === "planned" ? "PLANO (nenhum arquivo escrito)" : "CRIADO"}: ${result.template} em ${result.root}\n${result.files.map((path) => `  ${path}`).join("\n")}` };
    } catch (error) { const message = error instanceof Error ? error.message : String(error); return { exitCode: 5, output: json ? JSON.stringify({ code: "ASES_TEMPLATE_APPLY", error: message }) : `Falha ao aplicar template: ${message}` }; }
  }
  if (command === "knowledge" && args[1] === "list") return { exitCode: 0, output: JSON.stringify(listKnowledgeLibraries(), null, 2) };
  if (command === "knowledge" && args[1] === "validate") {
    const result = validateKnowledgeLibrary(args[2] ?? "");
    return { exitCode: result.valid ? 0 : 2, output: json ? JSON.stringify(result, null, 2) : `${result.valid ? "PASS" : "FAIL"} ${result.id} ${result.version} (${result.license})\n${result.errors.join("\n")}` };
  }
  if (command === "knowledge" && args[1] === "install") {
    try {
      const id = args[2] ?? "";
      const workspace = args[3] ?? process.cwd();
      const inferredProjectId = slugify(basename(resolve(workspace)));
      const projectId = optionValues(argv, "--project-id")[0] ?? (inferredProjectId.length >= 2 ? inferredProjectId : `p-${inferredProjectId}`);
      const result = await installKnowledgeLibrary(id, workspace, projectId, argv.includes("--apply") && !dryRun);
      const { index, ...summary } = result;
      return { exitCode: 0, output: json ? JSON.stringify({ ...summary, ...(index ? { indexedSources: index.sources.length, chunks: index.chunks.length } : {}) }, null, 2) : `${result.status.toUpperCase()} ${result.id} ${result.version} (${result.license})\n${result.files.join("\n")}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 5, output: json ? JSON.stringify({ code: "ASES_KNOWLEDGE_INSTALL_FAILED", error: message }) : `Falha ao instalar biblioteca: ${message}` };
    }
  }
  if (command === "requirements" && args[1] === "graph") {
    try {
      const productId = optionValues(argv, "--product")[0];
      const workspace = args.slice(2).filter((arg) => arg !== productId && arg !== "--json")[0] ?? process.cwd();
      const catalog = await readCatalog(workspace, productId);
      const graph = renderTraceabilityGraph(catalog);
      return { exitCode: 0, output: json ? JSON.stringify({ format: "mermaid", catalog: catalog.catalog, ...(catalog.productId ? { productId: catalog.productId } : {}), graph }, null, 2) : graph };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 5, output: json ? JSON.stringify({ code: "ASES_CATALOG_UNAVAILABLE", error: message }, null, 2) : `Não foi possível gerar o grafo: ${message}\nImporte a fonte de requisitos localmente primeiro.` };
    }
  }
  if (command === "requirements" && ["list", "show", "trace"].includes(args[1] ?? "")) {
    try {
      const productId = optionValues(argv, "--product")[0];
      const positional = args.slice(2).filter((arg) => arg !== productId);
      const action = args[1]!;
      const requirementAction = action === "show" || action === "trace";
      const firstIsId = /^REQ-\d{3}$/.test(positional[0] ?? "");
      const workspaceArg = requirementAction && firstIsId ? process.cwd() : positional[0] ?? process.cwd();
      const requirementId = requirementAction ? positional.length > 1 ? positional[1] : firstIsId ? positional[0] : undefined : undefined;
      const catalog = await readCatalog(workspaceArg, productId);
      if (action === "show" && !requirementId) return { exitCode: 2, output: "Uso: ases requirements show [workspace] <REQ-ID> [--product id]" };
      const selected = requirementId ? catalog.requirements.filter((item) => item.id === requirementId) : catalog.requirements;
      if (requirementId && selected.length === 0) return { exitCode: 2, output: json ? JSON.stringify({ code: "ASES_REQUIREMENT_NOT_FOUND", id: requirementId }) : `Requisito não encontrado: ${requirementId}` };
      const requirements = selected.map((item) => {
        if (action === "list") return { id: item.id, title: item.title, status: item.status, verificationEligibility: item.verificationEligibility, evidenceIntegrity: item.evidence?.map((evidence) => evidence.integrity) ?? [] };
        if (action === "trace") return {
          id: item.id,
          status: item.status,
          verificationEligibility: item.verificationEligibility,
          decision: item.decision ?? { status: "UNDECIDED", history: [] },
          decisions: item.traceability?.decisionRefs ?? [],
          tests: item.traceability?.testRefs ?? [],
          blocker: item.blocker ?? null,
          evidence: item.evidence?.map((evidence) => ({ ref: evidence.description, integrity: evidence.integrity ?? "UNVERIFIABLE", sha256: evidence.sha256, ...(evidence.expiresAt ? { expiresAt: evidence.expiresAt } : {}) })) ?? []
        };
        return item;
      });
      const result = { catalog: catalog.catalog, ...(catalog.productId ? { productId: catalog.productId } : {}), status: catalog.status, source: catalog.source, requirements };
      return { exitCode: 0, output: json ? JSON.stringify(result, null, 2) : selected.map((item) => action === "trace"
        ? `${item.id} [implementação: ${item.status}; elegível: ${item.verificationEligibility?.eligible ? "sim" : "não"}; decisão: ${item.decision?.status ?? "UNDECIDED"}]\n  Referências de decisão: ${(item.traceability?.decisionRefs ?? []).join(", ") || "pendente"}\n  Testes: ${(item.traceability?.testRefs ?? []).join(", ") || "pendente"}\n  Bloqueio: ${item.blocker ? `${item.blocker.dependency} — ${item.blocker.reason}` : "nenhum"}\n  Evidências: ${(item.evidence ?? []).map((evidence) => `${evidence.description} (${evidence.integrity ?? "UNVERIFIABLE"})`).join(", ") || "pendente"}`
        : `${item.id} — ${item.title} [${item.status}]${item.verificationEligibility?.eligible === false && item.status === "VERIFIED" ? ` [não apto: ${item.verificationEligibility.reason}]` : ""}${item.evidence?.length ? ` [evidência: ${item.evidence.map((evidence) => evidence.integrity ?? "UNVERIFIABLE").join(", ")}]` : ""}${action === "show" ? `\n${item.acceptanceCriteria ?? item.sourceText}` : ""}`).join("\n") };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 5, output: json ? JSON.stringify({ code: "ASES_CATALOG_UNAVAILABLE", error: message }, null, 2) : `Catálogo não disponível: ${message}\nImporte a fonte ASES-300 localmente primeiro.` };
    }
  }
  if (command === "requirements" && args[1] === "set-status") {
    try {
      const status = args[4] as import("./catalog.js").GeneralRequirement["status"];
      const allowed = ["PENDING", "READY", "IN_PROGRESS", "IMPLEMENTED", "VERIFIED", "FAILED", "BLOCKED", "N_A"];
      if (!allowed.includes(status)) return { exitCode: 2, output: `Status inválido; use: ${allowed.join(", ")}` };
      const evidenceIndex = argv.indexOf("--evidence");
      const executionContext = optionValues(argv, "--execution-context").join(" ");
      const evidenceExpiresAt = optionValues(argv, "--evidence-expires-at")[0];
      const naIndex = argv.indexOf("--na-reason");
      const naReason = naIndex >= 0 ? optionValues(argv, "--na-reason").join(" ") : undefined;
      const blockedBy = optionValues(argv, "--blocked-by")[0];
      const blockedReason = optionValues(argv, "--reason").join(" ");
      const requirement = await updateRequirement(args[2]!, args[3]!, status, {
        ...(evidenceIndex >= 0 ? { evidence: argv[evidenceIndex + 1] } : {}),
        ...(executionContext ? { executionContext } : {}),
        ...(evidenceExpiresAt ? { evidenceExpiresAt } : {}),
        ...(naReason ? { naReason } : {}),
        ...(blockedBy ? { blockedBy } : {}),
        ...(blockedReason ? { blockedReason } : {}),
        ...(optionValues(argv, "--decision").length ? { decisionRefs: optionValues(argv, "--decision") } : {}),
        ...(optionValues(argv, "--test").length ? { testRefs: optionValues(argv, "--test") } : {}),
        ...(optionValues(argv, "--product")[0] ? { productId: optionValues(argv, "--product")[0] } : {})
      });
      return { exitCode: 0, output: json ? JSON.stringify(requirement, null, 2) : `${requirement.id}: ${requirement.status}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 5, output: json ? JSON.stringify({ code: "ASES_REQUIREMENT_UPDATE", error: message }, null, 2) : `Falha ao atualizar requisito: ${message}` };
    }
  }
  if (command === "requirements" && args[1] === "set-decision") {
    try {
      const status = args[4] as NonNullable<import("./catalog.js").GeneralRequirement["decision"]>["status"];
      const allowed = ["UNDECIDED", "PROPOSED", "ACCEPTED", "REJECTED", "SUPERSEDED"];
      if (!allowed.includes(status)) return { exitCode: 2, output: `Estado de decisão inválido; use: ${allowed.join(", ")}` };
      const result = await updateDecision(args[2]!, args[3]!, status, { ...(optionValues(argv, "--ref")[0] ? { reference: optionValues(argv, "--ref")[0] } : {}), ...(optionValues(argv, "--reason").length ? { rationale: optionValues(argv, "--reason").join(" ") } : {}), ...(optionValues(argv, "--product")[0] ? { productId: optionValues(argv, "--product")[0] } : {}) });
      return { exitCode: 0, output: json ? JSON.stringify(result, null, 2) : `${result.id}: decisão ${result.decision?.status}; implementação ${result.status}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 5, output: json ? JSON.stringify({ code: "ASES_DECISION_UPDATE", error: message }, null, 2) : `Falha ao atualizar decisão: ${message}` };
    }
  }
  if (command === "host" && args[1] === "list") {
    const definitions = [
      { id: "codex", command: "codex", integration: "integrations/codex" },
      { id: "claude-code", command: "claude", integration: "integrations/claude-code" },
      { id: "kimi-code", command: "kimi", integration: "integrations/kimi-code" },
      { id: "gemini-cli", command: "gemini", integration: "integrations/gemini-cli" }
    ];
    const hosts = await Promise.all(definitions.map(async (host) => {
      const detected = await detectCommand(host.command, ["--version"]);
      return { ...host, detected: detected.available, version: detected.available ? detected.detail : undefined, support: "NOT_TESTED" };
    }));
    return { exitCode: 0, output: json ? JSON.stringify({ hosts }, null, 2) : hosts.map((host) => `${host.detected ? "DETECTED" : "NOT_FOUND"} ${host.id}${host.version ? `: ${host.version}` : ""} [${host.support}]`).join("\n") };
  }
  if (command === "host" && args[1] === "plan") {
    const host = args[2];
    if (!HOSTS.includes(host as HostId)) return { exitCode: 2, output: json ? JSON.stringify({ code: "ASES_HOST_INVALID", allowed: HOSTS }, null, 2) : `Host inválido; use: ${HOSTS.join(", ")}` };
    try {
      const plan = await createHostPlan(host as HostId, args[3] ?? process.cwd());
      return { exitCode: 0, output: json ? JSON.stringify(plan, null, 2) : [`Plano somente leitura: ${plan.host} → ${plan.workspace}`, "Nenhuma alteração aplicada. Revise os diffs antes de qualquer instalação.", ...plan.files.map((file) => `\n[${file.action}] ${file.target}\n${file.diff}`)].join("\n") };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 5, output: json ? JSON.stringify({ code: "ASES_HOST_PLAN_FAILED", error: message }, null, 2) : `Falha ao gerar plano do host: ${message}` };
    }
  }
  if (command === "host" && args[1] === "restore") {
    const host = args[2];
    if (!HOSTS.includes(host as HostId)) return { exitCode: 2, output: json ? JSON.stringify({ code: "ASES_HOST_INVALID", allowed: HOSTS }, null, 2) : `Host inválido; use: ${HOSTS.join(", ")}` };
    if (!args[3]) return { exitCode: 2, output: "Uso: ases host restore <host> <backup-id> [workspace] [--apply]" };
    try {
      const result = await restoreHostBackup(host as HostId, args[3], args[4] ?? process.cwd(), argv.includes("--apply") && !dryRun);
      return { exitCode: result.status === "conflict" ? 3 : 0, output: json ? JSON.stringify(result, null, 2) : `${result.status.toUpperCase()} backup ${result.backupId}\n${JSON.stringify(result, null, 2)}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 3, output: json ? JSON.stringify({ code: "ASES_HOST_RESTORE_FAILED", error: message }) : `Falha ao restaurar backup: ${message}` };
    }
  }
  if (command === "host" && ["apply", "update", "uninstall"].includes(args[1] ?? "")) {
    const action = args[1];
    const host = args[2];
    if (!HOSTS.includes(host as HostId)) return { exitCode: 2, output: json ? JSON.stringify({ code: "ASES_HOST_INVALID", allowed: HOSTS }, null, 2) : `Host inválido; use: ${HOSTS.join(", ")}` };
    const apply = argv.includes("--apply") && !dryRun;
    try {
      const result = action === "apply"
        ? await applyHostIntegration(host as HostId, args[3] ?? process.cwd(), apply)
        : action === "update"
          ? await updateHostIntegration(host as HostId, args[3] ?? process.cwd(), apply)
          : await uninstallHostIntegration(host as HostId, args[3] ?? process.cwd(), apply);
      return { exitCode: result.status === "conflict" ? 3 : 0, output: json ? JSON.stringify(result, null, 2) : `${result.status.toUpperCase()} ${result.host} → ${result.workspace}${"apply" in result && result.apply ? " (aplicado)" : " (somente plano)"}\n${JSON.stringify(result, null, 2)}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code = action === "apply" ? "ASES_HOST_APPLY_FAILED" : action === "update" ? "ASES_HOST_UPDATE_FAILED" : "ASES_HOST_UNINSTALL_FAILED";
      return { exitCode: 5, output: json ? JSON.stringify({ code, error: message }, null, 2) : `Falha na integração do host: ${message}` };
    }
  }
  if (command === "config" && args[1] === "validate") return validateConfigCommand(args[2], json);
  if (command === "policy" && args[1] === "template") return { exitCode: 0, output: JSON.stringify(teamPolicyTemplate, null, 2) };
  if (command === "policy" && (args[1] === "validate" || args[1] === "evaluate")) {
    const policyPath = args[2];
    if (!policyPath) return { exitCode: 2, output: json ? JSON.stringify({ code: "ASES_POLICY_PATH_REQUIRED", error: "Provide a policy JSON file." }, null, 2) : "Uso: ases policy validate <file> | ases policy evaluate <file> --actor <id> --action <action> --resource <ref>" };
    try {
      const document = await readTeamPolicyFile(policyPath);
      const validation = validateTeamPolicy(document);
      if (!validation.valid || !validation.policy) return { exitCode: 1, output: json ? JSON.stringify({ path: policyPath, valid: false, errors: validation.errors, warnings: validation.warnings }, null, 2) : `FAIL policy inválida:\n${validation.errors.map((error) => `- ${error}`).join("\n")}` };
      if (args[1] === "validate") return { exitCode: 0, output: json ? JSON.stringify({ path: policyPath, valid: true, ruleCount: validation.policy.rules.length, warnings: validation.warnings }, null, 2) : `PASS policy válida (${validation.policy.rules.length} regra(s))${validation.warnings.length ? `\nAvisos: ${validation.warnings.join("; ")}` : ""}` };
      const actorId = optionValues(argv, "--actor")[0];
      const action = optionValues(argv, "--action")[0];
      const resource = optionValues(argv, "--resource")[0];
      if (!actorId || !isSecurityAction(action) || !resource) return { exitCode: 2, output: json ? JSON.stringify({ code: "ASES_POLICY_REQUEST_INVALID", error: "Provide --actor, a known --action and --resource." }, null, 2) : "Uso: ases policy evaluate <file> --actor <id> --action <action> --resource <ref>" };
      const decision = createTeamPolicyEngine(validation.policy).evaluate({ actorId, action, resource });
      return { exitCode: 0, output: json ? JSON.stringify({ allowed: decision.allowed, decision }, null, 2) : `${decision.allowed ? "ALLOW" : "DENY"}: ${decision.reason}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 3, output: json ? JSON.stringify({ code: "ASES_POLICY_READ_FAILED", error: message }, null, 2) : `Não foi possível ler a policy: ${message}` };
    }
  }
  if (command === "config" && args[1] === "schema") {
    const schema = generateAsesConfigJsonSchema();
    if (!argv.includes("--check")) return { exitCode: 0, output: JSON.stringify(schema, null, 2) };
    const schemaPath = args[2] ?? resolve("schemas/ases.config.schema.json");
    try {
      const existing = JSON.parse(await readFile(schemaPath, "utf8")) as unknown;
      const matches = canonicalJson(existing) === canonicalJson(schema);
      if (json) return { exitCode: matches ? 0 : 1, output: JSON.stringify({ path: schemaPath, valid: matches, code: matches ? undefined : "ASES_SCHEMA_DRIFT" }, null, 2) };
      return { exitCode: matches ? 0 : 1, output: matches ? `PASS schema sincronizado: ${schemaPath}` : `FAIL schema divergente: ${schemaPath}\nGere o artefato com: ases config schema > ${schemaPath}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 3, output: json ? JSON.stringify({ path: schemaPath, valid: false, code: "ASES_SCHEMA_READ", error: message }, null, 2) : `FAIL não foi possível verificar o schema ${schemaPath}: ${message}` };
    }
  }
  if (command === "architecture" && args[1] === "check") {
    const contractsPath = optionValues(argv, "--contracts")[0] ?? "docs/architecture/contracts.json";
    const workspace = args.slice(2).filter((arg) => arg !== contractsPath)[0] ?? process.cwd();
    try {
      const report = await checkArchitectureContracts(workspace, contractsPath);
      const exitCode = report.status === "DRIFT" ? 1 : report.status === "UNVERIFIABLE" ? 2 : 0;
      if (json) return { exitCode, output: JSON.stringify(report, null, 2) };
      const lines = [
        `${report.status} architecture contracts · ${report.summary.contracts} contrato(s) · ${report.summary.passed} pass · ${report.summary.drift} drift observado · ${report.summary.unverifiable + report.summary.adrUnverifiable} não verificável`,
        ...report.contracts.flatMap((contract) => [
          `${contract.id} → ${contract.adrId} (${contract.adrStatus ?? "ADR não verificável"}; ${contract.enforcement})`,
          ...contract.assertions.filter((assertion) => assertion.status !== "PASS").map((assertion) => `  ${assertion.status} ${assertion.id}: ${assertion.detail}`),
        ]),
      ];
      return { exitCode, output: lines.join("\n") };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 2, output: json ? JSON.stringify({ code: "ASES_ARCHITECTURE_CHECK_FAILED", error: message }, null, 2) : `Não foi possível verificar os contratos de arquitetura: ${message}` };
    }
  }
  if (command === "code" && args[1] === "impact") {
    const workspace = args[2] ?? process.cwd();
    const changedFiles = args.slice(3);
    try {
      const report = await analyzeCodeImpact(workspace, changedFiles);
      return { exitCode: report.parseErrors.length ? 1 : 0, output: json ? JSON.stringify(report, null, 2) : `Impacto estático · ${report.scannedFiles} arquivos analisados · ${report.impactedFiles.length} dependentes · ${report.impactedTests.length} testes candidatos${report.parseErrors.length ? ` · ${report.parseErrors.length} arquivos com erros de sintaxe` : ""}\n${report.impactedTests.map((file) => `TEST ${file}`).join("\n")}${report.impactedFiles.filter((file) => !report.impactedTests.includes(file)).map((file) => `\nFILE ${file}`).join("")}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 2, output: json ? JSON.stringify({ code: "ASES_CODE_IMPACT_FAILED", error: message }, null, 2) : `Não foi possível analisar o impacto do código: ${message}` };
    }
  }
  if (command === "config" && args[1] === "explain") {
    const flags: string[] = [];
    for (let index = 0; index < argv.length; index += 1) {
      if (argv[index] === "--set") flags.push(argv[index + 1] ?? "");
      else if (argv[index]?.startsWith("--set=")) flags.push(argv[index]!.slice("--set=".length));
    }
    const pathArg = args.slice(2).find((arg) => !flags.includes(arg));
    return explainConfigCommand(pathArg, json, flags);
  }
  return { exitCode: 1, output: json ? JSON.stringify({ code: "ASES_COMMAND_UNKNOWN", command }) : `Comando desconhecido: ${command}\n\n${renderHelp(localeResult.locale)}` };
}

