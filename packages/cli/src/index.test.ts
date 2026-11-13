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

