import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, join, resolve } from "node:path";
import { platform, release } from "node:os";

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

const help = `EUREKA42 ASES Framework ${VERSION}

Uso: ases <comando> [opções]

Comandos disponíveis:
  init [diretório]        Inicializa um workspace local de forma idempotente
  doctor [diretório]      Diagnostica o ambiente sem chamadas remotas
  config validate [path]  Valida a configuração JSON do projeto
  help                    Exibe esta ajuda

Opções:
  --json                  Saída estruturada em JSON
  --dry-run               Mostra o plano sem escrever arquivos
  --version               Exibe a versão
`;

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
  const checks = [
    { id: "node", status: "pass", detail: process.version },
    { id: "platform", status: "pass", detail: `${platform()} ${release()}` },
    { id: "workspace", status: (await exists(root)) ? "pass" : "fail", detail: root },
    { id: "ases-config", status: (await exists(join(root, ".ases", "config.json"))) ? "pass" : "warn", detail: "execute ases init para inicializar" }
  ];
  const exitCode = checks.some((check) => check.status === "fail") ? 2 : 0;
  return { exitCode, output: json ? JSON.stringify({ root, checks }, null, 2) : checks.map((c) => `${c.status.toUpperCase()} ${c.id}: ${c.detail}`).join("\n") };
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

export async function run(argv: string[]): Promise<CommandResult> {
  const json = argv.includes("--json");
  const dryRun = argv.includes("--dry-run");
  const args = argv.filter((arg) => !arg.startsWith("--"));
  if (argv.includes("--version")) return { exitCode: 0, output: VERSION };
  const command = args[0] ?? "help";
  if (command === "help" || command === "--help") return { exitCode: 0, output: help };
  if (command === "init") return initProject(args[1], dryRun, json);
  if (command === "doctor") return doctor(args[1], json);
  if (command === "config" && args[1] === "validate") return validateConfigCommand(args[2], json);
  return { exitCode: 1, output: json ? JSON.stringify({ code: "ASES_COMMAND_UNKNOWN", command }) : `Comando desconhecido: ${command}\n\n${help}` };
}

