import assert from "node:assert/strict";
import { symlink, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { analyzeCodeImpact } from "./code-impact.js";
import { run } from "./index.js";

test("AST impact analysis finds reverse transitive dependents and candidate tests offline", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-impact-"));
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "tests"), { recursive: true });
  await writeFile(join(root, "src/base.ts"), "export const value = 1;\n");
  await writeFile(join(root, "src/service.ts"), 'import { value } from "./base.js"; export const result = value;\n');
  await writeFile(join(root, "tests/service.test.ts"), 'import { result } from "../src/service"; console.log(result);\n');
  await writeFile(join(root, "src/unrelated.ts"), "export const untouched = true;\n");
  const report = await analyzeCodeImpact(root, ["src/base.ts"]);
  assert.deepEqual(report.changedFiles, ["src/base.ts"]);
  assert.deepEqual(report.impactedFiles, ["src/service.ts", "tests/service.test.ts"]);
  assert.deepEqual(report.impactedTests, ["tests/service.test.ts"]);
  assert.equal(report.analysis, "static-typescript-ast-import-graph");
  assert.equal(report.parseErrors.length, 0);
});

test("AST impact analysis recognizes export, dynamic import, and require dependencies", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-impact-"));
  await writeFile(join(root, "base.js"), "module.exports = {};\n");
  await writeFile(join(root, "reexport.ts"), 'export * from "./base.js";\n');
  await writeFile(join(root, "dynamic.cjs"), 'const loaded = import("./base.js");\n');
  await writeFile(join(root, "required.mjs"), 'const loaded = require("./base.js");\n');
  const report = await analyzeCodeImpact(root, ["base.js"]);
  assert.deepEqual(report.impactedFiles, ["dynamic.cjs", "reexport.ts", "required.mjs"]);
});

test("AST impact report flags syntax errors without exposing source excerpts", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-impact-"));
  await writeFile(join(root, "broken.ts"), "const = secretValue;\n");
  const report = await analyzeCodeImpact(root, ["broken.ts"]);
  assert.deepEqual(report.parseErrors, [{ file: "broken.ts", count: 1 }]);
  assert.equal(JSON.stringify(report).includes("secretValue"), false);
});

test("AST impact analysis enforces workspace, symlink, file-count and source-size boundaries", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-impact-"));
  const external = join(await mkdtemp(join(tmpdir(), "ases-impact-external-")), "outside.ts");
  await writeFile(join(root, "inside.ts"), "export {};\n");
  await writeFile(join(root, "extra.ts"), "export {};\n");
  await writeFile(external, "export {};\n");
  await symlink(external, join(root, "linked.ts"));
  await assert.rejects(analyzeCodeImpact(root, ["../outside.ts"]), /outside the workspace/);
  await assert.rejects(analyzeCodeImpact(root, ["linked.ts"]), /missing, symlinked, or ignored/);
  await assert.rejects(analyzeCodeImpact(root, ["inside.ts"], { maxFiles: 1 }), /source-file analysis limit/);
  await assert.rejects(analyzeCodeImpact(root, ["inside.ts"], { maxFileBytes: 4 }), /byte limit/);
});

test("CLI exposes JSON impact reports and rejects a request without changed paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-impact-"));
  await writeFile(join(root, "entry.ts"), "export {};\n");
  const result = await run(["code", "impact", root, "entry.ts", "--json"]);
  assert.equal(result.exitCode, 0);
  assert.equal(JSON.parse(result.output).changedFiles[0], "entry.ts");
  const missing = await run(["code", "impact", root]);
  assert.equal(missing.exitCode, 2);
});
