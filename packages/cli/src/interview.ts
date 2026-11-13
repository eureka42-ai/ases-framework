import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { renderLogo } from "./brand.js";
import { APPLICATION_TYPES, buildRecommendations, parseApplicationType, type ApplicationType, type InterviewAnswers } from "./recommendations.js";

export interface WorkspaceContext {
  files: string[];
  name?: string;
  applicationType?: ApplicationType;
  language?: string;
  hosting?: string;
  database?: string;
  previous?: InterviewAnswers;
}

export interface InterviewResult {
  answers: InterviewAnswers;
  recommendations: ReturnType<typeof buildRecommendations>;
  files?: string[];
}

function yes(value: string): boolean {
  return /^(s|sim|y|yes)$/i.test(value.trim());
}

function scale(value: string): InterviewAnswers["expectedScale"] {
  const normalized = value.trim().toLowerCase();
  if (normalized === "large" || normalized === "grande") return "large";
  if (normalized === "medium" || normalized === "médio" || normalized === "medio") return "medium";
  return "small";
}

export async function inspectWorkspaceContext(root: string): Promise<WorkspaceContext> {
  const context: WorkspaceContext = { files: [] };
  const has = async (relativePath: string) => {
    try { await access(join(resolve(root), relativePath), constants.F_OK); return true; } catch { return false; }
  };
  const readOptional = async (relativePath: string) => {
    try { return await readFile(join(resolve(root), relativePath), "utf8"); } catch { return undefined; }
  };
  for (const file of ["package.json", "tsconfig.json", "go.mod", "Cargo.toml", "pyproject.toml", "requirements.txt", "composer.json", "Gemfile", "vercel.json", "netlify.toml", "fly.toml", "render.yaml", "Dockerfile", "docker-compose.yml", "compose.yaml"]) {
    if (await has(file)) context.files.push(file);
  }
  const packageText = await readOptional("package.json");
  let packageJson: Record<string, unknown> = {};
  if (packageText) {
    try { packageJson = JSON.parse(packageText) as Record<string, unknown>; } catch { /* malformed manifests are listed, not interpreted */ }
  }
  if (typeof packageJson.name === "string" && packageJson.name.trim()) context.name = packageJson.name.trim();
  const dependencies = { ...(typeof packageJson.dependencies === "object" && packageJson.dependencies ? packageJson.dependencies as Record<string, unknown> : {}), ...(typeof packageJson.devDependencies === "object" && packageJson.devDependencies ? packageJson.devDependencies as Record<string, unknown> : {}) };
  const packages = new Set(Object.keys(dependencies));
  if (await has("tsconfig.json") || packages.has("typescript")) context.language = "TypeScript";
  else if (packageText) context.language = "JavaScript";
  else if (await has("go.mod")) context.language = "Go";
  else if (await has("Cargo.toml")) context.language = "Rust";
  else if (await has("pyproject.toml") || await has("requirements.txt")) context.language = "Python";
  else if (await has("composer.json")) context.language = "PHP";
  else if (await has("Gemfile")) context.language = "Ruby";

  if (packages.has("expo") || packages.has("react-native")) context.applicationType = "mobile";
  else if (packageJson.bin) context.applicationType = "cli";
  else if (["next", "react", "vue", "svelte", "vite"].some((name) => packages.has(name))) context.applicationType = "web";
  else if (["express", "fastify", "koa", "hono"].some((name) => packages.has(name))) context.applicationType = "api";

  if (await has("vercel.json")) context.hosting = "Vercel (vercel.json detectado)";
  else if (await has("netlify.toml")) context.hosting = "Netlify (netlify.toml detectado)";
  else if (await has("fly.toml")) context.hosting = "Fly.io (fly.toml detectado)";
  else if (await has("render.yaml")) context.hosting = "Render (render.yaml detectado)";
  else if (await has("Dockerfile") || await has("docker-compose.yml") || await has("compose.yaml")) context.hosting = "Docker/container (manifesto detectado; destino de hospedagem não confirmado)";

  const prisma = await readOptional("prisma/schema.prisma");
  const prismaProvider = prisma?.match(/datasource\s+\w+\s*\{[^}]*provider\s*=\s*"([^"]+)"/s)?.[1];
  if (prismaProvider) context.database = ({ postgresql: "PostgreSQL", mysql: "MySQL", sqlite: "SQLite", mongodb: "MongoDB", sqlserver: "SQL Server" } as Record<string, string>)[prismaProvider] ?? prismaProvider;
  else if (packages.has("pg") || packages.has("postgres")) context.database = "PostgreSQL (driver detectado)";
  else if (packages.has("mongoose") || packages.has("mongodb")) context.database = "MongoDB (driver detectado)";
  else if (packages.has("mysql2")) context.database = "MySQL (driver detectado)";
  else if (packages.has("better-sqlite3") || packages.has("sqlite3")) context.database = "SQLite (driver detectado)";
  return context;
}

function parseAnswers(raw: Record<string, unknown>): InterviewAnswers {
  const applicationType = parseApplicationType(String(raw.applicationType ?? ""));
  if (!applicationType) throw new Error(`applicationType inválido; use: ${APPLICATION_TYPES.join(", ")}`);
  if (typeof raw.name !== "string" || raw.name.trim() === "") throw new Error("name é obrigatório");
  const language = typeof raw.language === "string" && raw.language.trim() ? raw.language.trim() : undefined;
  const hosting = typeof raw.hosting === "string" && raw.hosting.trim() ? raw.hosting.trim() : undefined;
  const database = typeof raw.database === "string" && raw.database.trim() ? raw.database.trim() : undefined;
  return {
    name: raw.name.trim(),
    applicationType,
    ...(language ? { language } : {}),
    ...(hosting ? { hosting } : {}),
    ...(database ? { database } : {}),
    expectedScale: scale(String(raw.expectedScale ?? "small")),
    sensitiveData: raw.sensitiveData === true || yes(String(raw.sensitiveData ?? ""))
  };
}

export async function loadAnswers(path: string): Promise<InterviewAnswers> {
  return parseAnswers(JSON.parse(await readFile(resolve(path), "utf8")) as Record<string, unknown>);
}

export async function collectInterviewAnswers(ask: (question: string) => Promise<string>, announce: () => void = () => {}, context: WorkspaceContext = { files: [] }): Promise<InterviewAnswers> {
  announce();
  const previous = context.previous;
  const name = (await ask(`Nome do aplicativo${previous?.name ? ` [atual: ${previous.name}]` : context.name ? ` [detectado: ${context.name}]` : ""}: `)).trim() || previous?.name || context.name;
  let applicationType = parseApplicationType(await ask(`Tipo (${APPLICATION_TYPES.join("/ ")})${previous?.applicationType ? ` [atual: ${previous.applicationType}]` : context.applicationType ? ` [detectado: ${context.applicationType}]` : ""}: `)) ?? previous?.applicationType ?? context.applicationType;
  while (!applicationType) applicationType = parseApplicationType(await ask(`Escolha um tipo válido (${APPLICATION_TYPES.join("/ ")}): `));
  const language = (await ask(`Linguagem já escolhida?${previous?.language ? ` [atual: ${previous.language}]` : context.language ? ` [detectada: ${context.language}; Enter mantém]` : " (Enter para receber sugestão)"}: `)).trim() || previous?.language || context.language;
  const hosting = (await ask(`Hospedagem já escolhida?${previous?.hosting ? ` [atual: ${previous.hosting}]` : context.hosting ? ` [artefato detectado: ${context.hosting}; informe destino ou Enter para sugestão]` : " (Enter para receber sugestão)"}: `)).trim() || previous?.hosting || undefined;
  const database = (await ask(`Banco de dados já escolhido?${previous?.database ? ` [atual: ${previous.database}]` : context.database ? ` [detectado: ${context.database}; Enter mantém]` : " (Enter para receber sugestão)"}: `)).trim() || previous?.database || context.database;
  const expectedScale = scale((await ask(`Escala esperada (small/medium/large) [${previous?.expectedScale ?? "small"}]: `)).trim() || previous?.expectedScale || "small");
  const sensitiveInput = (await ask(`Tratará dados pessoais ou sensíveis? (s/N) [${previous?.sensitiveData ? "s" : "n"}]: `)).trim();
  const sensitiveData = sensitiveInput ? yes(sensitiveInput) : previous?.sensitiveData ?? false;
  return { name: name || "Novo aplicativo", applicationType, ...(language ? { language } : {}), ...(hosting ? { hosting } : {}), ...(database ? { database } : {}), expectedScale, sensitiveData };
}

export async function promptAnswers(streams: { input?: NodeJS.ReadableStream; output?: NodeJS.WritableStream; root?: string; previous?: InterviewAnswers } = {}): Promise<InterviewAnswers> {
  const context = await inspectWorkspaceContext(streams.root ?? process.cwd());
  if (streams.previous) context.previous = streams.previous;
  const inputStream = streams.input ?? input;
  const outputStream = streams.output ?? output;
  const rl = createInterface({ input: inputStream, output: outputStream });
  try {
    return await collectInterviewAnswers((question) => rl.question(question), () => {
      const facts = [context.files.length ? `Arquivos reconhecidos: ${context.files.join(", ")}` : "Nenhum manifesto conhecido detectado."];
      if (context.name) facts.push(`Nome detectado: ${context.name}`);
      if (context.applicationType) facts.push(`Tipo sugerido pelos arquivos: ${context.applicationType}`);
      if (context.language) facts.push(`Linguagem detectada: ${context.language}`);
      if (context.hosting) facts.push(`Infraestrutura detectada: ${context.hosting}`);
      if (context.database) facts.push(`Banco detectado: ${context.database}`);
      facts.push("Detecções são pistas locais; confirme ou corrija nas respostas. Arquivos .env e credenciais não são lidos.");
      outputStream.write(`${renderLogo()}\n\nContexto do workspace:\n${facts.map((fact) => `- ${fact}`).join("\n")}\n\n`);
    }, context);
  } finally {
    rl.close();
  }
}

function renderSpec(result: InterviewResult): string {
  const { answers, recommendations } = result;
  return `# ${answers.name}\n\nStatus: PROPOSED\n\n## Perfil\n\n- Tipo: ${answers.applicationType}\n- Escala: ${answers.expectedScale}\n- Dados sensíveis: ${answers.sensitiveData ? "sim — revisão obrigatória" : "não informado"}\n\n## Recomendações\n\n${recommendations.map((item) => `- **${item.field} — ${item.value}** (${item.status}): ${item.rationale}`).join("\n")}\n\n## Próximas decisões\n\n1. Confirmar ou substituir cada recomendação.\n2. Detalhar personas, jornadas, domínio e regras de negócio.\n3. Definir autenticação, autorização, privacidade, integrações e operação.\n4. Transformar decisões confirmadas em requisitos e critérios de aceite.\n`;
}

export async function runInterview(options: { root: string; answersPath?: string; resume?: boolean; dryRun: boolean; input?: NodeJS.ReadableStream; output?: NodeJS.WritableStream }): Promise<InterviewResult> {
  const root = resolve(options.root);
  let previous: InterviewAnswers | undefined;
  if (options.resume) {
    if (options.answersPath) throw new Error("--resume e --answers não podem ser usados juntos");
    try {
      const saved = JSON.parse(await readFile(join(root, ".ases", "interview.json"), "utf8")) as { answers?: Record<string, unknown> };
      if (!saved.answers) throw new Error("arquivo não contém respostas");
      previous = parseAnswers(saved.answers);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Não foi possível retomar .ases/interview.json: ${reason}`);
    }
  }
  const answers = options.answersPath ? await loadAnswers(options.answersPath) : await promptAnswers({ root, ...(previous ? { previous } : {}), ...(options.input ? { input: options.input } : {}), ...(options.output ? { output: options.output } : {}) });
  const result: InterviewResult = { answers, recommendations: buildRecommendations(answers) };
  const files = [join(root, ".ases", "interview.json"), join(root, ".ases", "SPEC.md")];
  result.files = files;
  if (!options.dryRun) {
    await mkdir(join(root, ".ases"), { recursive: true });
    for (const path of options.resume ? [] : files) {
      try {
        await access(path, constants.F_OK);
        throw new Error(`Arquivo existente; preservado: ${path}`);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("Arquivo existente;")) throw error;
      }
    }
    await writeFile(files[0]!, `${JSON.stringify({ schemaVersion: "1", status: "PROPOSED", ...result }, null, 2)}\n`, { flag: options.resume ? "w" : "wx" });
    await writeFile(files[1]!, renderSpec(result), { flag: options.resume ? "w" : "wx" });
  }
  return result;
}

