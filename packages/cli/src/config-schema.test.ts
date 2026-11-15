import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { generateAsesConfigJsonSchema, validateAsesConfig } from "./config-schema.js";
import { run } from "./index.js";

test("generated config JSON Schema matches the checked-in artifact and runtime validator", async () => {
  const artifact = JSON.parse(await readFile(resolve("schemas/ases.config.schema.json"), "utf8"));
  assert.deepEqual(generateAsesConfigJsonSchema(), artifact);
  const valid = { schemaVersion: "1", project: { id: "demo-app", name: "Demo App", locale: "pt-BR", mode: "offline", privacy: "local-only" } };
  assert.deepEqual(validateAsesConfig(valid), []);
  assert.ok(validateAsesConfig({ ...valid, project: { ...valid.project, name: "  " } }).includes("project.name é obrigatório"));
  assert.ok(validateAsesConfig({ ...valid, extra: true }).some((error) => error.includes("propriedade não permitida: extra")));
});

test("config schema CLI emits JSON and detects artifact drift without writing", async () => {
  const generated = await run(["config", "schema"]);
  assert.equal(generated.exitCode, 0);
  assert.deepEqual(JSON.parse(generated.output), generateAsesConfigJsonSchema());
  const checkedIn = await run(["config", "schema", "--check", resolve("schemas/ases.config.schema.json")]);
  assert.equal(checkedIn.exitCode, 0);

  const directory = await mkdtemp(join(tmpdir(), "ases-schema-check-"));
  try {
    const driftedPath = join(directory, "schema.json");
    await writeFile(driftedPath, JSON.stringify({ type: "string" }));
    const drifted = await run(["config", "schema", "--check", driftedPath, "--json"]);
    assert.equal(drifted.exitCode, 1);
    assert.equal(JSON.parse(drifted.output).code, "ASES_SCHEMA_DRIFT");
    assert.equal(await readFile(driftedPath, "utf8"), JSON.stringify({ type: "string" }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
