import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runMutationCampaign } from "./mutation-testing.js";

test("mutation campaign selects impacted tests, verifies baseline, and reports killed mutants", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-mutation-"));
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "tests"), { recursive: true });
  await writeFile(join(root, "src/rules.ts"), "export const allowed = (count: number) => count >= 3 && true;\n");
  await writeFile(join(root, "tests/rules.test.ts"), 'import { allowed } from "../src/rules.js";\nvoid allowed;\n');
  await writeFile(join(root, "tests/other.test.ts"), "void 1;\n");
  const calls: Array<{ tests: readonly string[]; overrides: Readonly<Record<string, string>> }> = [];
  const report = await runMutationCampaign(root, ["src/rules.ts"], async ({ testFiles, sourceOverrides }) => {
    calls.push({ tests: testFiles, overrides: sourceOverrides });
    return { passed: calls.length === 1, executedTests: ["tests/rules.test.ts"] };
  });
  assert.deepEqual(report.impactedTests, ["tests/rules.test.ts"]);
  assert.equal(report.generated, 3);
  assert.equal(report.killed, 3);
  assert.equal(report.survived, 0);
  assert.equal(report.score, 100);
  assert.equal(calls.length, 4);
  assert.ok(calls.every((call) => call.tests.length === 1 && call.tests[0] === "tests/rules.test.ts"));
  assert.ok(calls[0]!.overrides["src/rules.ts"]!.includes("count >= 3"));
});

test("mutation campaign stops when impacted baseline tests fail", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-mutation-baseline-"));
  await mkdir(join(root, "tests"), { recursive: true });
  await writeFile(join(root, "source.ts"), "export const enabled = true;\n");
  await writeFile(join(root, "tests/source.test.ts"), 'import { enabled } from "../source.js";\nvoid enabled;\n');
  await assert.rejects(runMutationCampaign(root, ["source.ts"], async () => ({ passed: false, executedTests: ["tests/source.test.ts"] })), /baseline/);
});

test("mutation campaign requires impacted tests and validates bounded options", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-mutation-empty-"));
  await writeFile(join(root, "source.ts"), "export const enabled = true;\n");
  await assert.rejects(runMutationCampaign(root, ["source.ts"], async () => ({ passed: true, executedTests: ["source.ts"] })), /impacted test/);
  await assert.rejects(runMutationCampaign(root, ["source.ts"], async () => ({ passed: true, executedTests: [] }), { maxMutants: 201 }), /maxMutants/);
});
