import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, join, resolve } from "node:path";
import { platform, release } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { renderLogo } from "./brand.js";
import { runInterview } from "./interview.js";

export const VERSION = "0.0.0-dev";

export interface CommandResult {
  exitCode: number;
  output: string;
}

interface ProjectConfig {
  schemaVersion: "1";
  project: {
    id: string;
    name: string;
    locale: "pt-BR" | "en-US";
    mode: "host" | "standalone" | "headless" | "offline";
    privacy: "local-only";
  };
}

const help = `${renderLogo()}\n\nEUREKA42 ASES Framework ${VERSION}

Uso: ases <comando> [opções]

Comandos disponíveis:
  init [diretório]        Inicializa um workspace local de forma idempotente
  interview [diretório]   Entrevista o projeto e propõe stack inicial
  welcome                 Exibe a identidade Eureka42 no terminal
  host list               Detecta CLIs compatíveis sem alterar configurações
  doctor [diretório]      Diagnostica o ambiente sem chamadas remotas
  config validate [path]  Valida a configuração JSON do projeto
  config explain [path]   Explica valores e origens da configuração
  help                    Exibe esta ajuda

Opções:
  --json                  Saída estruturada em JSON
  --dry-run               Mostra o plano sem escrever arquivos
  --answers <arquivo>     Respostas JSON para entrevista não interativa
  --version               Exibe a versão
`;

const execFileAsync = promisify(execFile);

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "ases-project";
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
  const errors: string[] = [];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return ["configuração deve ser um objeto JSON"];
  }
  const config = value as Record<string, unknown>;
  if (config.schemaVersion !== "1") errors.push("schemaVersion deve ser '1'");
  if (typeof config.project !== "object" || config.project === null || Array.isArray(config.project)) {
    errors.push("project deve ser um objeto");
    return errors;
  }
  const project = config.project as Record<string, unknown>;
  if (typeof project.id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(project.id)) {
    errors.push("project.id deve usar letras minúsculas, números e hífens");
  }
  if (typeof project.name !== "string" || project.name.trim() === "") errors.push("project.name é obrigatório");
  if (!new Set(["pt-BR", "en-US"]).has(String(project.locale))) errors.push("project.locale inválido");
  if (!new Set(["host", "standalone", "headless", "offline"]).has(String(project.mode))) errors.push("project.mode inválido");
  if (project.privacy !== "local-only") errors.push("project.privacy deve ser 'local-only' nesta versão");
  return errors;
}

async function initProject(rootArg: string | undefined, dryRun: boolean, json: boolean): Promise<CommandResult> {
  const root = resolve(rootArg ?? process.cwd());
  const name = basename(root);
  const asesDir = join(root, ".ases");
  const configPath = join(asesDir, "config.json");
  const statusPath = join(asesDir, "STATUS.md");
  const nextStepsPath = join(root, "NEXT_STEPS.md");
  const plan = [configPath, statusPath, nextStepsPath];
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
  await mkdir(asesDir, { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: "wx" });
  await writeFile(statusPath, "# Status do projeto ASES\n\nEstado: INITIALIZED\n\nNenhum requisito foi verificado ainda.\n", { flag: "wx" });
  await writeFile(nextStepsPath, "# Próximos passos\n\n1. Execute `ases doctor`.\n2. Revise `.ases/config.json`.\n3. Mantenha decisões humanas como `PROPOSED` até confirmação.\n", { flag: "wx" });
  const payload = { status: "initialized", root, created: plan };
  return { exitCode: 0, output: json ? JSON.stringify(payload, null, 2) : `Workspace inicializado em ${root}.\n${plan.join("\n")}` };
}

async function doctor(rootArg: string | undefined, json: boolean): Promise<CommandResult> {
  const root = resolve(rootArg ?? process.cwd());
  const git = await detectCommand("git", ["--version"]);
  const npm = await detectCommand("npm", ["--version"]);
  const pnpm = await detectCommand("pnpm", ["--version"]);
  const checks = [
    { id: "node", status: "pass", detail: process.version },
    { id: "platform", status: "pass", detail: `${platform()} ${release()}` },
    { id: "git", status: git.available ? "pass" : "warn", detail: git.detail },
    { id: "npm", status: npm.available ? "pass" : "warn", detail: npm.detail },
    { id: "pnpm", status: pnpm.available ? "pass" : "warn", detail: pnpm.detail },
    { id: "workspace", status: (await exists(root)) ? "pass" : "fail", detail: root },
    { id: "ases-config", status: (await exists(join(root, ".ases", "config.json"))) ? "pass" : "warn", detail: "execute ases init para inicializar" }
  ];
  const exitCode = checks.some((check) => check.status === "fail") ? 2 : 0;
  return { exitCode, output: json ? JSON.stringify({ root, checks }, null, 2) : checks.map((c) => `${c.status.toUpperCase()} ${c.id}: ${c.detail}`).join("\n") };
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

async function explainConfigCommand(pathArg: string | undefined, json: boolean): Promise<CommandResult> {
  const path = resolve(pathArg ?? join(process.cwd(), ".ases", "config.json"));
  try {
    const content = await readFile(path, "utf8");
    const value = JSON.parse(content) as unknown;
    const errors = validateConfig(value);
    if (errors.length > 0) {
      const payload = { path, valid: false, errors };
      return { exitCode: 3, output: json ? JSON.stringify(payload, null, 2) : `FAIL config inválida:\n${errors.join("\n")}` };
    }
    const config = value as ProjectConfig;
    const resolved = [
      { key: "schemaVersion", value: config.schemaVersion, source: path },
      { key: "project.id", value: config.project.id, source: path },
      { key: "project.name", value: config.project.name, source: path },
      { key: "project.locale", value: config.project.locale, source: path },
      { key: "project.mode", value: config.project.mode, source: path },
      { key: "project.privacy", value: config.project.privacy, source: path }
    ];
    return { exitCode: 0, output: json ? JSON.stringify({ path, valid: true, resolved }, null, 2) : resolved.map((item) => `${item.key}=${item.value}  [${item.source}]`).join("\n") };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { exitCode: 3, output: json ? JSON.stringify({ path, valid: false, code: "ASES_CONFIG_READ", error: message }, null, 2) : `FAIL não foi possível explicar ${path}: ${message}` };
  }
}

export async function run(argv: string[]): Promise<CommandResult> {
  const json = argv.includes("--json");
  const dryRun = argv.includes("--dry-run");
  const args = argv.filter((arg) => !arg.startsWith("--"));
  if (argv.includes("--version")) return { exitCode: 0, output: VERSION };
  const command = args[0] ?? "help";
  if (command === "help" || command === "--help") return { exitCode: 0, output: help };
  if (command === "welcome") return { exitCode: 0, output: renderLogo() };
  if (command === "init") return initProject(args[1], dryRun, json);
  if (command === "interview") {
    try {
      const answersIndex = argv.indexOf("--answers");
      const answersPath = answersIndex >= 0 ? argv[answersIndex + 1] : undefined;
      const result = await runInterview({ root: args[1] ?? process.cwd(), ...(answersPath ? { answersPath } : {}), dryRun });
      const summary = [renderLogo(), "", `Projeto: ${result.answers.name}`, `Tipo: ${result.answers.applicationType}`, "", ...result.recommendations.map((item) => `${item.status} ${item.field}: ${item.value}\n  ${item.rationale}`), "", dryRun ? "Dry-run: nenhum arquivo escrito." : `Arquivos: ${result.files?.join(", ")}`].join("\n");
      return { exitCode: 0, output: json ? JSON.stringify(result, null, 2) : summary };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { exitCode: 4, output: json ? JSON.stringify({ code: "ASES_INTERVIEW_INVALID", error: message }, null, 2) : `FAIL entrevista inválida: ${message}` };
    }
  }
  if (command === "doctor") return doctor(args[1], json);
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
  if (command === "config" && args[1] === "validate") return validateConfigCommand(args[2], json);
  if (command === "config" && args[1] === "explain") return explainConfigCommand(args[2], json);
  return { exitCode: 1, output: json ? JSON.stringify({ code: "ASES_COMMAND_UNKNOWN", command }) : `Comando desconhecido: ${command}\n\n${help}` };
}

