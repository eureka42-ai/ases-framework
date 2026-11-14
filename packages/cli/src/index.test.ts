import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, symlink, unlink } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { once } from "node:events";
import test from "node:test";
import { checkNodeVersion, run, validateConfig, VERSION } from "./index.js";
import { collectInterviewAnswers, inspectWorkspaceContext, runInterview } from "./interview.js";
import { assessInterview } from "./assessment.js";
import { readCatalog } from "./catalog.js";

test("reports version offline", async () => {
  assert.deepEqual(await run(["--version"]), { exitCode: 0, output: VERSION });
});

test("init dry-run does not write", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-dry-"));
  const result = await run(["init", root, "--dry-run", "--json"]);
  assert.equal(result.exitCode, 0);
  assert.equal(JSON.parse(result.output).status, "planned");
});

test("init is idempotent and preserves files", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-init-"));
  const first = await run(["init", root, "--json"]);
  const configBefore = await readFile(join(root, ".ases", "config.json"), "utf8");
  const second = await run(["init", root, "--json"]);
  const configAfter = await readFile(join(root, ".ases", "config.json"), "utf8");
  assert.equal(JSON.parse(first.output).status, "initialized");
  assert.equal(JSON.parse(second.output).status, "unchanged");
  assert.equal(configAfter, configBefore);
});

test("validates project config", () => {
  assert.deepEqual(validateConfig({ schemaVersion: "1", project: { id: "demo", name: "Demo", locale: "pt-BR", mode: "host", privacy: "local-only" } }), []);
  assert.ok(validateConfig({ schemaVersion: "2", project: {} }).length > 0);
  assert.match(validateConfig({ schemaVersion: "1", unexpected: true, project: { id: "demo", name: "Demo", locale: "pt-BR", mode: "host", privacy: "local-only" } })[0]!, /propriedade não permitida/);
  assert.match(validateConfig({ schemaVersion: "1", project: { id: "demo", name: "Demo", locale: "pt-BR", mode: "host", privacy: "local-only", token: "secret" } })[0]!, /propriedade project não permitida/);
});

test("doctor enforces the declared Node.js engine floor", () => {
  assert.deepEqual(checkNodeVersion("22.0.0"), { status: "pass" });
  assert.match(checkNodeVersion("20.18.1").remediation ?? "", /Node.js 22 ou superior/);
  assert.equal(checkNodeVersion("unknown").status, "warn");
});

test("keeps documented CLI error exit codes stable", async () => {
  const unknown = await run(["unknown-command", "--json"]);
  assert.equal(unknown.exitCode, 1);
  assert.equal(JSON.parse(unknown.output).code, "ASES_COMMAND_UNKNOWN");
  const root = await mkdtemp(join(tmpdir(), "ases-cli-exit-"));
  const invalidPath = join(root, "invalid.json");
  await writeFile(invalidPath, JSON.stringify({ schemaVersion: "2", project: {} }));
  const invalid = await run(["config", "validate", invalidPath, "--json"]);
  assert.equal(invalid.exitCode, 3);
  const invalidInterview = await run(["interview", "--answers", join(root, "missing-answers.json"), "--json"]);
  assert.equal(invalidInterview.exitCode, 4);
  const invalidCatalog = await run(["catalog", "import-ases300", join(root, "missing-source.md"), root, "--json"]);
  assert.equal(invalidCatalog.exitCode, 5);
});

test("explains config values with their source", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-explain-"));
  await run(["init", root]);
  const result = await run(["config", "explain", join(root, ".ases", "config.json"), "--json"]);
  const payload = JSON.parse(result.output);
  assert.equal(result.exitCode, 0);
  assert.equal(payload.valid, true);
  assert.equal(payload.resolved.find((item: { key: string }) => item.key === "project.mode").value, "host");
  assert.equal(payload.resolved.find((item: { key: string }) => item.key === "project.mode").source, join(root, ".ases", "config.json"));
});

test("resolves config defaults, environment and flags without printing unrelated secrets", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-config-layers-"));
  const configPath = join(root, ".ases", "config.json");
  const previousMode = process.env.ASES_PROJECT_MODE;
  const previousSecret = process.env.ASES_DATABASE_URL;
  process.env.ASES_PROJECT_MODE = "offline";
  process.env.ASES_DATABASE_URL = "do-not-print-this-secret";
  try {
    const result = await run(["config", "explain", configPath, "--set", "project.mode=headless", "--json"]);
    const payload = JSON.parse(result.output);
    const mode = payload.resolved.find((item: { key: string }) => item.key === "project.mode");
    const name = payload.resolved.find((item: { key: string }) => item.key === "project.name");
    assert.equal(result.exitCode, 0);
    assert.equal(mode.value, "headless");
    assert.equal(mode.source, "flag:--set");
    assert.equal(name.value, root.split("/").at(-1));
    assert.equal(name.source, "default");
    assert.doesNotMatch(result.output, /do-not-print-this-secret/);
  } finally {
    if (previousMode === undefined) delete process.env.ASES_PROJECT_MODE;
    else process.env.ASES_PROJECT_MODE = previousMode;
    if (previousSecret === undefined) delete process.env.ASES_DATABASE_URL;
    else process.env.ASES_DATABASE_URL = previousSecret;
  }
});

test("config explain rejects unknown keys without echoing their values", async () => {
  const result = await run(["config", "explain", "--set", "project.apiKey=hidden-value", "--json"]);
  assert.equal(result.exitCode, 3);
  assert.match(result.output, /project.apiKey/);
  assert.doesNotMatch(result.output, /hidden-value/);
  const root = await mkdtemp(join(tmpdir(), "ases-config-invalid-"));
  const path = join(root, "config.json");
  await writeFile(path, JSON.stringify({ schemaVersion: "1", project: { name: { password: "hidden-file-secret" } } }));
  const malformed = await run(["config", "explain", path, "--json"]);
  assert.equal(malformed.exitCode, 3);
  assert.match(malformed.output, /project.name é obrigatório/);
  assert.doesNotMatch(malformed.output, /hidden-file-secret/);
});

test("doctor reports local runtime tools", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-doctor-"));
  const result = await run(["doctor", root, "--json"]);
  const payload = JSON.parse(result.output);
  assert.equal(result.exitCode, 0);
  assert.ok(payload.checks.some((check: { id: string }) => check.id === "git"));
  assert.ok(payload.checks.some((check: { id: string }) => check.id === "pnpm"));
  assert.match(payload.checks.find((check: { id: string }) => check.id === "ases-config").remediation, /ases init/);
});

test("doctor provides repair instructions when PATH tools are missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-doctor-no-path-"));
  const previousPath = process.env.PATH;
  process.env.PATH = "";
  try {
    const result = await run(["doctor", root, "--json"]);
    const checks = JSON.parse(result.output).checks;
    for (const id of ["git", "npm", "pnpm"]) {
      const check = checks.find((item: { id: string }) => item.id === id);
      assert.equal(check.status, "warn");
      assert.ok(check.remediation.length > 0);
    }
    const text = await run(["doctor", root]);
    assert.match(text.output, /Próxima ação: Instale o Git/);
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
  }
});

test("renders Eureka42 identity without color when NO_COLOR is set", async () => {
  const previous = process.env.NO_COLOR;
  process.env.NO_COLOR = "1";
  const result = await run(["welcome"]);
  if (previous === undefined) delete process.env.NO_COLOR;
  else process.env.NO_COLOR = previous;
  assert.equal(result.exitCode, 0);
  assert.match(result.output, /EUREKA42 ASES/);
  assert.doesNotMatch(result.output, /\u001b\[/);
});

test("JSON interview requires an answers file", async () => {
  const result = await run(["interview", "--json"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.output).code, "ASES_INTERVIEW_JSON_REQUIRES_ANSWERS");
});

test("interactive interview announces Eureka42 before the first question", async () => {
  const events: string[] = [];
  const responses = ["Portal", "web", "", "", "", "small", "n"];
  const answers = await collectInterviewAnswers(async (question) => {
    events.push(`question:${question}`);
    return responses.shift() ?? "";
  }, () => events.push("logo:EUREKA42 ASES"));
  assert.equal(answers.applicationType, "web");
  assert.match(events[0]!, /^logo:/);
  assert.match(events[1]!, /^question:Nome do aplicativo/);
});

test("interview inspects project manifests before questions without reading .env", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-interview-context-"));
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "portal-existing", dependencies: { next: "1.0.0", pg: "1.0.0", typescript: "1.0.0" } }));
  await writeFile(join(root, "tsconfig.json"), "{}");
  await writeFile(join(root, "Dockerfile"), "FROM node");
  await writeFile(join(root, ".env"), "DATABASE_URL=never-print-this-secret");
  const prismaDir = join(root, "prisma");
  await mkdir(prismaDir);
  await writeFile(join(prismaDir, "schema.prisma"), 'datasource db { provider = "postgresql" url = env("DATABASE_URL") }');
  const context = await inspectWorkspaceContext(root);
  assert.equal(context.applicationType, "web");
  assert.equal(context.language, "TypeScript");
  assert.equal(context.database, "PostgreSQL");
  assert.match(context.hosting ?? "", /Docker/);
  assert.ok(!context.files.includes(".env"));
  assert.doesNotMatch(JSON.stringify(context), /never-print-this-secret/);

  const responses = ["", "", "", "", "", "medium", "s"];
  const questions: string[] = [];
  const answers = await collectInterviewAnswers(async (question) => {
    questions.push(question);
    return responses.shift() ?? "";
  }, () => {}, context);
  assert.equal(answers.name, "portal-existing");
  assert.equal(answers.applicationType, "web");
  assert.equal(answers.language, "TypeScript");
  assert.equal(answers.database, "PostgreSQL");
  assert.equal(answers.hosting, undefined);
  assert.match(questions[1]!, /detectado: web/);
  assert.match(questions[2]!, /detectada: TypeScript/);
  assert.match(questions[3]!, /Docker/);
});

test("interview recommends missing stack and persists proposal", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-interview-"));
  const answersPath = join(root, "answers.json");
  await writeFile(answersPath, JSON.stringify({ name: "Portal Demo", applicationType: "web", expectedScale: "small", sensitiveData: false }));
  const result = await run(["interview", root, "--answers", answersPath, "--json"]);
  const payload = JSON.parse(result.output);
  assert.equal(result.exitCode, 0);
  assert.equal(payload.recommendations.length, 3);
  assert.ok(payload.recommendations.every((item: { status: string }) => item.status === "PROPOSED"));
  assert.match(await readFile(join(root, ".ases", "SPEC.md"), "utf8"), /Portal Demo/);
});

test("interview refuses to replace existing files without explicit resume", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-interview-protected-"));
  const answersPath = join(root, "answers.json");
  const interviewPath = join(root, ".ases", "interview.json");
  const specPath = join(root, ".ases", "SPEC.md");
  await mkdir(join(root, ".ases"), { recursive: true });
  await writeFile(answersPath, JSON.stringify({ name: "New Project", applicationType: "web", expectedScale: "small", sensitiveData: false }));
  await writeFile(interviewPath, "preserve interview\n");
  await writeFile(specPath, "preserve spec\n");

  await assert.rejects(runInterview({ root, answersPath, dryRun: false }), /Arquivo existente; preservado:/);
  assert.equal(await readFile(interviewPath, "utf8"), "preserve interview\n");
  assert.equal(await readFile(specPath, "utf8"), "preserve spec\n");
});

test("interview evaluates user choices instead of silently confirming", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-existing-"));
  const answersPath = join(root, "answers.json");
  await writeFile(answersPath, JSON.stringify({ name: "API Existente", applicationType: "api", language: "Go", hosting: "Kubernetes", database: "PostgreSQL", expectedScale: "large", sensitiveData: true }));
  const result = await run(["interview", root, "--answers", answersPath, "--dry-run", "--json"]);
  const payload = JSON.parse(result.output);
  assert.equal(result.exitCode, 0);
  assert.ok(payload.recommendations.some((item: { status: string }) => item.status === "REVIEW_REQUIRED"));
});

test("interview flags workspace contradictions and blocks confirmation on explicit risks", () => {
  const answers = { name: "Portal", applicationType: "api" as const, language: "Go", database: "SQLite", expectedScale: "large" as const, sensitiveData: true };
  const context = { files: ["package.json", "tsconfig.json", "prisma/schema.prisma"], applicationType: "web" as const, language: "TypeScript", database: "PostgreSQL" };
  const findings = assessInterview(answers, context);
  assert.deepEqual(findings.filter((item) => item.kind === "CONTRADICTION").map((item) => item.field), ["applicationType", "language", "database"]);
  assert.deepEqual(findings.filter((item) => item.severity === "BLOCKS_CONFIRMATION").map((item) => item.code), ["SENSITIVE_DATA_PRIVACY_REVIEW", "LARGE_SCALE_VALIDATION"]);
  assert.ok(findings.every((item) => item.message.length > 0));
  assert.deepEqual(assessInterview({ ...answers, applicationType: "web", language: "TypeScript", database: "PostgreSQL", expectedScale: "small", sensitiveData: false }, context), []);
  assert.deepEqual(assessInterview({ ...answers, applicationType: "web", language: "TS", database: "Postgres", expectedScale: "small", sensitiveData: false }, context), []);
});

test("interview persists findings in JSON and SPEC without claiming confirmation", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-interview-findings-"));
  const answersPath = join(root, "answers.json");
  await writeFile(answersPath, JSON.stringify({ name: "Sensitive API", applicationType: "api", expectedScale: "large", sensitiveData: true }));
  const result = await run(["interview", root, "--answers", answersPath, "--json"]);
  const payload = JSON.parse(result.output);
  assert.equal(result.exitCode, 0);
  assert.ok(payload.recommendations.every((item: { status: string }) => item.status !== "CONFIRMED"));
  assert.deepEqual(payload.findings.map((finding: { severity: string }) => finding.severity), ["BLOCKS_CONFIRMATION", "BLOCKS_CONFIRMATION"]);
  const saved = JSON.parse(await readFile(join(root, ".ases", "interview.json"), "utf8"));
  assert.equal(saved.findings.length, 2);
  const spec = await readFile(join(root, ".ases", "SPEC.md"), "utf8");
  assert.match(spec, /CONFIRMAÇÃO BLOQUEADA/);
  assert.match(spec, /SENSITIVE_DATA_PRIVACY_REVIEW/);
  assert.match(spec, /LARGE_SCALE_VALIDATION/);
});

test("interview resumes persisted decisions and updates only changed answers", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-interview-resume-"));
  const answersPath = join(root, "answers.json");
  await writeFile(answersPath, JSON.stringify({ name: "Portal Retomado", applicationType: "web", language: "TypeScript", hosting: "Vercel", database: "PostgreSQL", expectedScale: "medium", sensitiveData: true }));
  await runInterview({ root, answersPath, dryRun: false });

  const input = new PassThrough();
  const output = new PassThrough();
  const resumed = runInterview({ root, resume: true, dryRun: false, input, output });
  for (const answer of ["", "", "Go", "", "", "", ""]) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    input.write(`${answer}\n`);
  }
  const result = await resumed;
  assert.equal(result.answers.name, "Portal Retomado");
  assert.equal(result.answers.language, "Go");
  assert.equal(result.answers.hosting, "Vercel");
  assert.equal(result.answers.database, "PostgreSQL");
  assert.equal(result.answers.expectedScale, "medium");
  assert.equal(result.answers.sensitiveData, true);
  const saved = JSON.parse(await readFile(join(root, ".ases", "interview.json"), "utf8"));
  assert.equal(saved.answers.language, "Go");
});

test("host list reports adapters without claiming support", async () => {
  const result = await run(["host", "list", "--json"]);
  const payload = JSON.parse(result.output);
  assert.equal(result.exitCode, 0);
  assert.deepEqual(payload.hosts.map((host: { id: string }) => host.id), ["codex", "claude-code", "kimi-code", "gemini-cli"]);
  assert.ok(payload.hosts.every((host: { detected: boolean; support: string; version?: string }) => typeof host.detected === "boolean" && host.support === "NOT_TESTED" && (host.detected ? typeof host.version === "string" : host.version === undefined)));
});

test("host plan renders create and replacement diffs without writing", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-host-plan-"));
  const first = await run(["host", "plan", "codex", root, "--json"]);
  const plan = JSON.parse(first.output);
  assert.equal(first.exitCode, 0);
  assert.equal(plan.mode, "PLAN_ONLY");
  assert.ok(plan.files.every((file: { action: string }) => file.action === "CREATE"));
  assert.ok(plan.files[0].diff.includes("+++ b/AGENTS.md"));
  assert.equal(await readFile(join(root, "AGENTS.md"), "utf8").catch(() => undefined), undefined);

  await writeFile(join(root, "AGENTS.md"), "# Instruções locais do usuário\n");
  const second = JSON.parse((await run(["host", "plan", "codex", root, "--json"])).output);
  const conflicted = second.files.find((file: { target: string }) => file.target === "AGENTS.md");
  assert.equal(conflicted.action, "CONFLICT");
  assert.match(conflicted.diff, /-# Instruções locais do usuário/);
  assert.match(conflicted.diff, /\+# EUREKA42/);
  assert.equal(await readFile(join(root, "AGENTS.md"), "utf8"), "# Instruções locais do usuário\n");
});

test("Kimi project plan targets its auto-discovered shared Skill without copying the plugin manifest to the project root", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-kimi-plan-"));
  const plan = JSON.parse((await run(["host", "plan", "kimi-code", root, "--json"])).output);
  assert.equal(plan.exitCode, undefined);
  assert.equal(plan.mode, "PLAN_ONLY");
  assert.equal(plan.files.length, 1);
  assert.equal(plan.files[0].target, ".agents/skills/ases-project-start/SKILL.md");
  assert.equal(plan.files[0].source, "kimi-code/skills/ases-project-start/SKILL.md");
  assert.equal(await readFile(join(root, "kimi.plugin.json"), "utf8").catch(() => undefined), undefined);
  assert.equal(await readFile(join(root, ".agents/skills/ases-project-start/SKILL.md"), "utf8").catch(() => undefined), undefined);
});

test("host plan refuses workspace symlink escapes", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-host-plan-link-"));
  const outside = await mkdtemp(join(tmpdir(), "ases-host-plan-outside-"));
  await symlink(outside, join(root, ".agents"));
  const plan = JSON.parse((await run(["host", "plan", "codex", root, "--json"])).output);
  const skill = plan.files.find((file: { target: string }) => file.target === ".agents/skills/ases-project-start/SKILL.md");
  assert.equal(skill.action, "CONFLICT");
  assert.match(skill.diff, /symlink/);
  assert.deepEqual(await readdir(outside), []);
});

test("MCP stdio negotiates modern protocol, lists real tools and reads only its workspace", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-mcp-workspace-"));
  const catalogDir = join(root, ".ases", "catalogs");
  await mkdir(catalogDir, { recursive: true });
  const catalogPath = join(catalogDir, "ases-300.json");
  const originalCatalog = JSON.stringify({ schemaVersion: "1", catalog: "ases-300", source: { path: "source.md", sha256: "a".repeat(64) }, status: "IMPORTED_NOT_HOMOLOGATED", requirements: [{ id: "REQ-001", title: "Test requirement", sourceText: "Source text", source: { path: "source.md", sha256: "a".repeat(64) }, status: "PENDING" }] });
  await writeFile(catalogPath, originalCatalog);
  const secretMarker = "MCP_PRIVATE_SECRET_SENTINEL";
  await writeFile(join(root, ".env"), `TOKEN=${secretMarker}\n`);
  const productDir = join(catalogDir, "products");
  await mkdir(productDir);
  const outsideCatalog = join(await mkdtemp(join(tmpdir(), "ases-mcp-outside-")), "private-catalog.json");
  await writeFile(outsideCatalog, JSON.stringify({ secret: secretMarker }));
  await symlink(outsideCatalog, join(productDir, "private-catalog.json"));

  const child = spawn(process.execPath, [join(process.cwd(), "packages/cli/dist/bin.js"), "mcp", root], { stdio: "pipe" });
  const lines = createInterface({ input: child.stdout });
  const messages = lines[Symbol.asyncIterator]();
  let stderrOutput = "";
  child.stderr.on("data", (chunk: Buffer) => { stderrOutput += chunk.toString("utf8"); });
  const send = async (message: Record<string, unknown>) => {
    child.stdin.write(`${JSON.stringify(message)}\n`);
    const next = await messages.next();
    assert.equal(next.done, false);
    return JSON.parse(next.value!);
  };
  const meta = { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} };
  const discovery = await send({ jsonrpc: "2.0", id: 1, method: "server/discover", params: { _meta: meta } });
  assert.ok(discovery.result.supportedVersions.includes("2026-07-28"));
  const listing = await send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: { _meta: meta } });
  assert.deepEqual(listing.result.tools.map((tool: { name: string }) => tool.name), ["requirements_list", "requirements_show", "requirements_trace"]);
  const call = await send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "requirements_show", arguments: { id: "REQ-001" }, _meta: meta } });
  const payload = JSON.parse(call.result.content[0].text);
  assert.equal(payload.requirement.title, "Test requirement");
  const missingCatalog = await send({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "requirements_list", arguments: { productId: "private-catalog" }, _meta: meta } });
  assert.equal(missingCatalog.result.isError, true);
  assert.ok(!missingCatalog.result.content[0].text.includes(root));
  assert.ok(!missingCatalog.result.content[0].text.includes(secretMarker));
  child.stdin.end();
  await once(child, "exit");
  lines.close();
  assert.doesNotMatch(stderrOutput, new RegExp(secretMarker));
  assert.ok(!stderrOutput.includes(root));
  assert.equal(await readFile(catalogPath, "utf8"), originalCatalog);
});

test("catalog reader refuses symlinks that point outside the workspace", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-catalog-link-"));
  const outside = join(await mkdtemp(join(tmpdir(), "ases-catalog-outside-")), "catalog.json");
  const catalogDir = join(root, ".ases", "catalogs");
  await mkdir(catalogDir, { recursive: true });
  await writeFile(outside, JSON.stringify({ schemaVersion: "1", catalog: "ases-300", source: {}, status: "IMPORTED_NOT_HOMOLOGATED", requirements: [] }));
  await symlink(outside, join(catalogDir, "ases-300.json"));
  await assert.rejects(readCatalog(root), /arquivo regular/);
});

test("MCP stdio supports legacy initialize clients", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-mcp-legacy-"));
  const child = spawn(process.execPath, [join(process.cwd(), "packages/cli/dist/bin.js"), "mcp", root], { stdio: "pipe" });
  const lines = createInterface({ input: child.stdout });
  const messages = lines[Symbol.asyncIterator]();
  const send = async (message: Record<string, unknown>) => {
    child.stdin.write(`${JSON.stringify(message)}\n`);
    const next = await messages.next();
    assert.equal(next.done, false);
    return JSON.parse(next.value!);
  };
  const initialized = await send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "test-client", version: "1.0" } } });
  assert.equal(initialized.result.protocolVersion, "2025-11-25");
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  const listing = await send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  assert.deepEqual(listing.result.tools.map((tool: { name: string }) => tool.name), ["requirements_list", "requirements_show", "requirements_trace"]);
  child.stdin.end();
  await once(child, "exit");
  lines.close();
});

test("catalog status requires evidence for VERIFIED and rationale for N_A", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-req-state-"));
  const md = join(root, "ases.md");
  const sections = Array.from({ length: 300 }, (_, i) => `### REQ-${String(i + 1).padStart(3, "0")} — Requisito ${i + 1}\n\nCritério de aceite mínimo: comprovar requisito ${i + 1}.`).join("\n\n");
  await writeFile(md, sections);
  assert.equal((await run(["catalog", "import-ases300", md, root, "--json"])).exitCode, 0);
  assert.equal((await run(["requirements", "set-status", root, "REQ-001", "VERIFIED", "--json"])).exitCode, 5);
  assert.equal((await run(["requirements", "set-status", root, "REQ-001", "N_A", "--json"])).exitCode, 5);
  const waived = await run(["requirements", "set-status", root, "REQ-003", "N_A", "--na-reason", "fora do escopo demonstrado", "--json"]);
  assert.equal(waived.exitCode, 0);
  assert.equal(JSON.parse(waived.output).waiver.justification, "fora do escopo demonstrado");
  assert.equal(JSON.parse(waived.output).history[0].to, "N_A");
  assert.equal((await run(["requirements", "set-status", root, "REQ-004", "BLOCKED", "--json"])).exitCode, 5);
  const blocked = await run(["requirements", "set-status", root, "REQ-004", "BLOCKED", "--blocked-by", "AUTH-PROVIDER", "--reason", "credencial ainda indisponível", "--json"]);
  assert.equal(blocked.exitCode, 0);
  assert.equal(JSON.parse(blocked.output).blocker.dependency, "AUTH-PROVIDER");
  assert.equal(JSON.parse(blocked.output).blocker.reason, "credencial ainda indisponível");
  const blockedTrace = await run(["requirements", "trace", root, "REQ-004", "--json"]);
  assert.equal(JSON.parse(blockedTrace.output).requirements[0].blocker.dependency, "AUTH-PROVIDER");
  await writeFile(join(root, "evidence.txt"), "test evidence");
  const accepted = await run(["requirements", "set-status", root, "REQ-001", "VERIFIED", "--evidence", "evidence.txt", "--decision", "ADR-001", "--test", "packages/cli/test/records.test.ts", "--json"]);
  assert.equal(accepted.exitCode, 0);
  assert.equal(JSON.parse(accepted.output).status, "VERIFIED");
  assert.match(JSON.parse(accepted.output).evidence[0].sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(JSON.parse(accepted.output).traceability, { decisionRefs: ["ADR-001"], testRefs: ["packages/cli/test/records.test.ts"] });
  assert.equal(JSON.parse(accepted.output).history.length, 1);
  const current = await run(["requirements", "show", root, "REQ-001", "--json"]);
  assert.equal(JSON.parse(current.output).requirements[0].evidence[0].integrity, "CURRENT");
  assert.equal((await run(["requirements", "set-decision", root, "REQ-002", "ACCEPTED", "--json"])).exitCode, 5);
  const decision = await run(["requirements", "set-decision", root, "REQ-001", "ACCEPTED", "--ref", "ADR-001", "--reason", "arquitetura aprovada", "--json"]);
  assert.equal(decision.exitCode, 0);
  assert.equal(JSON.parse(decision.output).status, "VERIFIED");
  assert.equal(JSON.parse(decision.output).decision.status, "ACCEPTED");
  assert.equal(JSON.parse(decision.output).decision.history[0].to, "ACCEPTED");
  const trace = await run(["requirements", "trace", root, "REQ-001", "--json"]);
  const traced = JSON.parse(trace.output).requirements[0];
  assert.equal(traced.decision.status, "ACCEPTED");
  assert.equal(traced.status, "VERIFIED");
  assert.deepEqual(traced.decisions, ["ADR-001"]);
  assert.deepEqual(traced.tests, ["packages/cli/test/records.test.ts"]);
  assert.equal(traced.evidence[0].integrity, "CURRENT");
  await writeFile(join(root, "evidence.txt"), "changed evidence");
  const stale = await run(["requirements", "show", root, "REQ-001", "--json"]);
  assert.equal(JSON.parse(stale.output).requirements[0].evidence[0].integrity, "STALE");
  await unlink(join(root, "evidence.txt"));
  const missing = await run(["requirements", "show", root, "REQ-001", "--json"]);
  assert.equal(JSON.parse(missing.output).requirements[0].evidence[0].integrity, "MISSING");
  const outside = await run(["requirements", "set-status", root, "REQ-002", "VERIFIED", "--evidence", "../outside.txt", "--json"]);
  assert.equal(outside.exitCode, 5);
  const externalRoot = await mkdtemp(join(tmpdir(), "ases-outside-evidence-"));
  const externalEvidence = join(externalRoot, "evidence.txt");
  await writeFile(externalEvidence, "external evidence");
  await symlink(externalEvidence, join(root, "linked-evidence.txt"));
  await symlink(externalEvidence, join(root, "evidence.txt"));
  const replaced = await run(["requirements", "show", root, "REQ-001", "--json"]);
  assert.equal(JSON.parse(replaced.output).requirements[0].evidence[0].integrity, "OUTSIDE_WORKSPACE");
  const linked = await run(["requirements", "set-status", root, "REQ-002", "VERIFIED", "--evidence", "linked-evidence.txt", "--json"]);
  assert.equal(linked.exitCode, 5);
});

test("imports classification and priority when both share a source line", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-catalog-fields-"));
  const md = join(root, "ases.md");
  const sections = Array.from({ length: 300 }, (_, i) => `### REQ-${String(i + 1).padStart(3, "0")} — Item ${i + 1}\n\nClassificação sugerida: CORE. Prioridade sugerida: HIGH.\n\nCritério de aceite mínimo: aceitar.`).join("\n\n");
  await writeFile(md, sections);
  const imported = await run(["catalog", "import-ases300", md, root, "--json"]);
  assert.equal(imported.exitCode, 0);
  const payload = JSON.parse(await readFile(join(root, ".ases", "catalogs", "ases-300.json"), "utf8"));
  assert.equal(payload.requirements[0].classification, "CORE");
  assert.equal(payload.requirements[0].priority, "HIGH");
});

test("catalog import rejects missing, duplicate and project-specific IDs", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-catalog-completeness-"));
  const makeSections = () => Array.from({ length: 300 }, (_, i) => `### REQ-${String(i + 1).padStart(3, "0")} — Item ${i + 1}\n\nDescrição.`);
  const missingPath = join(root, "missing.md");
  await writeFile(missingPath, makeSections().slice(1).join("\n\n"));
  assert.equal((await run(["catalog", "import-ases300", missingPath, join(root, "missing-workspace"), "--json"])).exitCode, 5);

  const duplicateSections = makeSections();
  duplicateSections[299] = duplicateSections[299]!.replace("REQ-300", "REQ-299");
  const duplicatePath = join(root, "duplicate.md");
  await writeFile(duplicatePath, duplicateSections.join("\n\n"));
  assert.equal((await run(["catalog", "import-ases300", duplicatePath, join(root, "duplicate-workspace"), "--json"])).exitCode, 5);

  const extendedPath = join(root, "extended.md");
  await writeFile(extendedPath, [...makeSections(), "### REQ-301 — Requisito de domínio\n\nEspecífico do produto."].join("\n\n"));
  assert.equal((await run(["catalog", "import-ases300", extendedPath, join(root, "extended-workspace"), "--json"])).exitCode, 5);
});

test("imports product requirements into a catalog isolated from ASES-300", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-product-catalog-"));
  const generalPath = join(root, "general.md");
  const productPath = join(root, "product.md");
  const general = Array.from({ length: 300 }, (_, i) => `### REQ-${String(i + 1).padStart(3, "0")} — General ${i + 1}\n\nGeral.`).join("\n\n");
  const product = Array.from({ length: 200 }, (_, i) => `### REQ-${String(i + 301).padStart(3, "0")} — Produto ${i + 301}\n\nEspecífico.`).join("\n\n");
  await writeFile(generalPath, general);
  await writeFile(productPath, `${general}\n\n${product}`);
  assert.equal((await run(["catalog", "import-ases300", generalPath, root, "--json"])).exitCode, 0);
  const productImport = await run(["catalog", "import-product", "eureka42", productPath, root, "--json"]);
  assert.equal(productImport.exitCode, 0);
  assert.equal(JSON.parse(productImport.output).count, 200);
  const generalList = await run(["requirements", "list", root, "--json"]);
  const productList = await run(["requirements", "list", root, "--product", "eureka42", "--json"]);
  assert.equal(JSON.parse(generalList.output).requirements.length, 300);
  assert.equal(JSON.parse(productList.output).catalog, "product");
  assert.equal(JSON.parse(productList.output).productId, "eureka42");
  assert.equal(JSON.parse(productList.output).requirements.length, 200);
  assert.equal(JSON.parse(productList.output).requirements[0].id, "REQ-301");
  const updated = await run(["requirements", "set-status", root, "REQ-301", "IMPLEMENTED", "--product", "eureka42", "--json"]);
  assert.equal(updated.exitCode, 0);
  const generalCatalog = JSON.parse(await readFile(join(root, ".ases", "catalogs", "ases-300.json"), "utf8"));
  const productCatalog = JSON.parse(await readFile(join(root, ".ases", "catalogs", "products", "eureka42.json"), "utf8"));
  assert.equal(generalCatalog.requirements[0].status, "PENDING");
  assert.equal(productCatalog.requirements[0].status, "IMPLEMENTED");
  const previousCwd = process.cwd();
  process.chdir(root);
  try {
    const implicitWorkspace = await run(["requirements", "list", "--product", "eureka42", "--json"]);
    assert.equal(JSON.parse(implicitWorkspace.output).requirements.length, 200);
    const implicitShow = await run(["requirements", "show", "REQ-301", "--product", "eureka42", "--json"]);
    assert.equal(JSON.parse(implicitShow.output).requirements[0].id, "REQ-301");
  } finally {
    process.chdir(previousCwd);
  }
});

