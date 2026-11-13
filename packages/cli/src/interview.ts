import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { APPLICATION_TYPES, buildRecommendations, parseApplicationType, type InterviewAnswers } from "./recommendations.js";

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

export async function loadAnswers(path: string): Promise<InterviewAnswers> {
  const raw = JSON.parse(await readFile(resolve(path), "utf8")) as Record<string, unknown>;
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

export async function promptAnswers(): Promise<InterviewAnswers> {
  const rl = createInterface({ input, output });
  try {
    const name = (await rl.question("Nome do aplicativo: ")).trim();
    let applicationType = parseApplicationType(await rl.question(`Tipo (${APPLICATION_TYPES.join("/ ")}): `));
    while (!applicationType) applicationType = parseApplicationType(await rl.question(`Escolha um tipo válido (${APPLICATION_TYPES.join("/ ")}): `));
    const language = (await rl.question("Linguagem já escolhida? (Enter para receber sugestão): ")).trim() || undefined;
    const hosting = (await rl.question("Hospedagem já escolhida? (Enter para receber sugestão): ")).trim() || undefined;
    const database = (await rl.question("Banco de dados já escolhido? (Enter para receber sugestão): ")).trim() || undefined;
    const expectedScale = scale(await rl.question("Escala esperada (small/medium/large) [small]: "));
    const sensitiveData = yes(await rl.question("Tratará dados pessoais ou sensíveis? (s/N): "));
    return { name: name || "Novo aplicativo", applicationType, ...(language ? { language } : {}), ...(hosting ? { hosting } : {}), ...(database ? { database } : {}), expectedScale, sensitiveData };
  } finally {
    rl.close();
  }
}

function renderSpec(result: InterviewResult): string {
  const { answers, recommendations } = result;
  return `# ${answers.name}\n\nStatus: PROPOSED\n\n## Perfil\n\n- Tipo: ${answers.applicationType}\n- Escala: ${answers.expectedScale}\n- Dados sensíveis: ${answers.sensitiveData ? "sim — revisão obrigatória" : "não informado"}\n\n## Recomendações\n\n${recommendations.map((item) => `- **${item.field} — ${item.value}** (${item.status}): ${item.rationale}`).join("\n")}\n\n## Próximas decisões\n\n1. Confirmar ou substituir cada recomendação.\n2. Detalhar personas, jornadas, domínio e regras de negócio.\n3. Definir autenticação, autorização, privacidade, integrações e operação.\n4. Transformar decisões confirmadas em requisitos e critérios de aceite.\n`;
}

export async function runInterview(options: { root: string; answersPath?: string; dryRun: boolean }): Promise<InterviewResult> {
  const answers = options.answersPath ? await loadAnswers(options.answersPath) : await promptAnswers();
  const result: InterviewResult = { answers, recommendations: buildRecommendations(answers) };
  const root = resolve(options.root);
  const files = [join(root, ".ases", "interview.json"), join(root, ".ases", "SPEC.md")];
  result.files = files;
  if (!options.dryRun) {
    await mkdir(join(root, ".ases"), { recursive: true });
    await writeFile(files[0]!, `${JSON.stringify({ schemaVersion: "1", status: "PROPOSED", ...result }, null, 2)}\n`);
    await writeFile(files[1]!, renderSpec(result));
  }
  return result;
}

