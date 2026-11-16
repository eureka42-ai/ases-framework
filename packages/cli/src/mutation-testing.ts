import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import ts from "typescript";
import { analyzeCodeImpact } from "./code-impact.js";

export interface MutationRunnerInput {
  workspace: string;
  testFiles: readonly string[];
  sourceOverrides: Readonly<Record<string, string>>;
}
export interface MutationRunnerResult { passed: boolean; executedTests: readonly string[] }
export type MutationTestRunner = (input: MutationRunnerInput) => Promise<MutationRunnerResult>;
export interface MutationCampaignOptions { maxMutants?: number }
export interface MutationCampaignReport {
  workspace: string;
  changedFiles: string[];
  impactedTests: string[];
  generated: number;
  killed: number;
  survived: number;
  errors: number;
  score: number | null;
  baselineTests: string[];
  mutants: Array<{ id: string; file: string; line: number; operator: string; status: "killed" | "survived" | "error" }>;
  analysis: "static-typescript-ast-impact-and-bounded-mutations";
}

interface Mutation { id: string; file: string; line: number; operator: string; source: string }
const MAX_SOURCE_BYTES = 256 * 1024;
const OPERATOR_MUTATIONS = new Map<ts.SyntaxKind, Array<[ts.SyntaxKind, string]>>([
  [ts.SyntaxKind.EqualsEqualsEqualsToken, [[ts.SyntaxKind.ExclamationEqualsEqualsToken, "=== → !=="]]],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken, [[ts.SyntaxKind.EqualsEqualsEqualsToken, "!== → ==="]]],
  [ts.SyntaxKind.EqualsEqualsToken, [[ts.SyntaxKind.ExclamationEqualsToken, "== → !="]]],
  [ts.SyntaxKind.ExclamationEqualsToken, [[ts.SyntaxKind.EqualsEqualsToken, "!= → =="]]],
  [ts.SyntaxKind.GreaterThanToken, [[ts.SyntaxKind.GreaterThanEqualsToken, "> → >="]]],
  [ts.SyntaxKind.GreaterThanEqualsToken, [[ts.SyntaxKind.GreaterThanToken, ">= → >"]]],
  [ts.SyntaxKind.LessThanToken, [[ts.SyntaxKind.LessThanEqualsToken, "< → <="]]],
  [ts.SyntaxKind.LessThanEqualsToken, [[ts.SyntaxKind.LessThanToken, "<= → <"]]],
]);

async function readBoundedSource(workspace: string, file: string): Promise<string> {
  const path = resolve(workspace, file);
  const rel = relative(workspace, path);
  if (!file || isAbsolute(file) || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("mutation source must be a relative path inside the workspace");
  const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > MAX_SOURCE_BYTES) throw new Error("mutation source must be a regular file at most 256 KiB");
    return await handle.readFile("utf8");
  } finally { await handle.close(); }
}

function mutationCandidates(file: string, sourceText: string): Mutation[] {
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, /\.tsx$/.test(file) ? ts.ScriptKind.TSX : /\.[cm]?jsx?$/.test(file) ? ts.ScriptKind.JSX : ts.ScriptKind.TS);
  const candidates: Mutation[] = [];
  function add(start: number, end: number, replacement: string, operator: string, line: number): void {
    const mutated = sourceText.slice(0, start) + replacement + sourceText.slice(end);
    if (mutated === sourceText) return;
    const digest = createHash("sha256").update(`${file}\0${start}\0${replacement}`).digest("hex").slice(0, 16);
    candidates.push({ id: `mut-${digest}`, file, line, operator, source: mutated });
  }
  function visit(node: ts.Node): void {
    if (ts.isBinaryExpression(node)) {
      const replacements = OPERATOR_MUTATIONS.get(node.operatorToken.kind) ?? [];
      for (const [kind, label] of replacements) {
        const tokenText = ts.tokenToString(kind);
        if (tokenText) add(node.operatorToken.getStart(source), node.operatorToken.end, tokenText, label, source.getLineAndCharacterOfPosition(node.operatorToken.getStart(source)).line + 1);
      }
    }
    if (node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword) {
      add(node.getStart(source), node.end, node.kind === ts.SyntaxKind.TrueKeyword ? "false" : "true", node.kind === ts.SyntaxKind.TrueKeyword ? "true → false" : "false → true", source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1);
    }
    if (ts.isNumericLiteral(node) && /^\d+$/.test(node.text)) {
      add(node.getStart(source), node.end, node.text === "0" ? "1" : "0", "integer boundary → 0/1", source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return candidates;
}

function validateRunnerResult(result: MutationRunnerResult, allowedTests: readonly string[]): void {
  if (!result || typeof result.passed !== "boolean" || !Array.isArray(result.executedTests) || result.executedTests.length < 1 || result.executedTests.some((file) => typeof file !== "string" || !allowedTests.includes(file))) throw new Error("mutation test runner must report at least one selected impacted test");
}

/** Runs a baseline and bounded source-only mutants; the injected runner owns isolated execution and never receives an implicit shell command. */
export async function runMutationCampaign(workspace: string, changedPaths: readonly string[], runner: MutationTestRunner, options: MutationCampaignOptions = {}): Promise<MutationCampaignReport> {
  const maxMutants = options.maxMutants ?? 50;
  if (!Number.isSafeInteger(maxMutants) || maxMutants < 1 || maxMutants > 200) throw new Error("maxMutants must be from 1 to 200");
  if (typeof runner !== "function") throw new Error("an explicit isolated mutation test runner is required");
  const impact = await analyzeCodeImpact(workspace, changedPaths);
  if (impact.parseErrors.length) throw new Error("mutation campaign cannot run when the impact analysis finds source syntax errors");
  if (!impact.impactedTests.length) throw new Error("mutation campaign requires at least one impacted test candidate");
  const sourceFiles = new Map<string, string>();
  for (const file of impact.changedFiles) sourceFiles.set(file, await readBoundedSource(impact.workspace, file));
  const candidates = impact.changedFiles.flatMap((file) => mutationCandidates(file, sourceFiles.get(file)!)).slice(0, maxMutants);
  if (!candidates.length) throw new Error("no supported mutation operators were found in the changed source files");

  const baseline = await runner({ workspace: impact.workspace, testFiles: impact.impactedTests, sourceOverrides: Object.freeze(Object.fromEntries(sourceFiles)) });
  validateRunnerResult(baseline, impact.impactedTests);
  if (!baseline.passed) throw new Error("impacted regression tests failed on the unmodified baseline; mutation campaign stopped");

  const results: MutationCampaignReport["mutants"] = [];
  for (const mutation of candidates) {
    try {
      const testResult = await runner({ workspace: impact.workspace, testFiles: impact.impactedTests, sourceOverrides: Object.freeze({ [mutation.file]: mutation.source }) });
      validateRunnerResult(testResult, impact.impactedTests);
      results.push({ id: mutation.id, file: mutation.file, line: mutation.line, operator: mutation.operator, status: testResult.passed ? "survived" : "killed" });
    } catch {
      results.push({ id: mutation.id, file: mutation.file, line: mutation.line, operator: mutation.operator, status: "error" });
    }
  }
  const killed = results.filter((item) => item.status === "killed").length;
  const survived = results.filter((item) => item.status === "survived").length;
  const errors = results.length - killed - survived;
  return {
    workspace: impact.workspace, changedFiles: impact.changedFiles, impactedTests: impact.impactedTests,
    generated: results.length, killed, survived, errors,
    score: killed + survived ? Math.round((killed / (killed + survived)) * 10_000) / 100 : null,
    baselineTests: [...baseline.executedTests], mutants: results,
    analysis: "static-typescript-ast-impact-and-bounded-mutations",
  };
}
