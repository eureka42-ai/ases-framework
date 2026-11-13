import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { run, validateConfig, VERSION } from "./index.js";

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
});

test("explains config values with their source", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-explain-"));
  await run(["init", root]);
  const result = await run(["config", "explain", join(root, ".ases", "config.json"), "--json"]);
  const payload = JSON.parse(result.output);
  assert.equal(result.exitCode, 0);
  assert.equal(payload.valid, true);
  assert.equal(payload.resolved.find((item: { key: string }) => item.key === "project.mode").value, "host");
});

test("doctor reports local runtime tools", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-doctor-"));
  const result = await run(["doctor", root, "--json"]);
  const payload = JSON.parse(result.output);
  assert.equal(result.exitCode, 0);
  assert.ok(payload.checks.some((check: { id: string }) => check.id === "git"));
  assert.ok(payload.checks.some((check: { id: string }) => check.id === "pnpm"));
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

test("interview evaluates user choices instead of silently confirming", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-existing-"));
  const answersPath = join(root, "answers.json");
  await writeFile(answersPath, JSON.stringify({ name: "API Existente", applicationType: "api", language: "Go", hosting: "Kubernetes", database: "PostgreSQL", expectedScale: "large", sensitiveData: true }));
  const result = await run(["interview", root, "--answers", answersPath, "--dry-run", "--json"]);
  const payload = JSON.parse(result.output);
  assert.equal(result.exitCode, 0);
  assert.ok(payload.recommendations.some((item: { status: string }) => item.status === "REVIEW_REQUIRED"));
});

test("host list reports adapters without claiming support", async () => {
  const result = await run(["host", "list", "--json"]);
  const payload = JSON.parse(result.output);
  assert.equal(result.exitCode, 0);
  assert.deepEqual(payload.hosts.map((host: { id: string }) => host.id), ["codex", "claude-code", "kimi-code", "gemini-cli"]);
  assert.ok(payload.hosts.every((host: { support: string }) => host.support === "NOT_TESTED"));
});

test("catalog status requires evidence for VERIFIED and rationale for N_A", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-req-state-"));
  const md = join(root, "ases.md");
  const sections = Array.from({ length: 300 }, (_, i) => `### REQ-${String(i + 1).padStart(3, "0")} — Requisito ${i + 1}\n\nCritério de aceite mínimo: comprovar requisito ${i + 1}.`).join("\n\n");
  await writeFile(md, sections);
  assert.equal((await run(["catalog", "import-ases300", md, root, "--json"])).exitCode, 0);
  assert.equal((await run(["requirements", "set-status", root, "REQ-001", "VERIFIED", "--json"])).exitCode, 5);
  assert.equal((await run(["requirements", "set-status", root, "REQ-001", "N_A", "--json"])).exitCode, 5);
  const accepted = await run(["requirements", "set-status", root, "REQ-001", "VERIFIED", "--evidence", "test:unit/req-001", "--json"]);
  assert.equal(accepted.exitCode, 0);
  assert.equal(JSON.parse(accepted.output).status, "VERIFIED");
});

