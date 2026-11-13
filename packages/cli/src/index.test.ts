import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
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

