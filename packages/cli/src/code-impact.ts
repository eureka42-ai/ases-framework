import { lstat, open, readdir, realpath } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import ts from "typescript";

export interface CodeImpactOptions { maxFiles?: number; maxFileBytes?: number }
export interface CodeImpactReport {
  workspace: string;
  changedFiles: string[];
  impactedFiles: string[];
  impactedTests: string[];
  unresolvedImports: number;
  parseErrors: Array<{ file: string; count: number }>;
  scannedFiles: number;
  analysis: "static-typescript-ast-import-graph";
}

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"]);
const RESOLVE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".d.ts"];
const IGNORED_DIRS = new Set([".git", ".ases", "node_modules", "dist", "build", "coverage", ".next", "vendor"]);
const MAX_CHANGED_FILES = 100;
const DEFAULT_MAX_FILES = 5_000;
const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;

function normalizeRelative(value: string): string {
  return value.split(sep).join("/");
}

function supportedSource(path: string): boolean { return SOURCE_EXTENSIONS.has(extname(path)); }
function isTestFile(path: string): boolean { return /(?:^|\/)(?:test|tests|__tests__)(?:\/|$)/.test(path) || /(?:\.|-)(?:test|spec)\.[cm]?[jt]sx?$/.test(path); }

async function readSource(path: string, limit: number): Promise<string> {
  const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const metadata = await handle.stat();
    if (!metadata.isFile() || metadata.size > limit) throw new Error("source file is not regular or exceeds the configured byte limit");
    return await handle.readFile("utf8");
  } finally { await handle.close(); }
}

function resolveLocalImport(fromFile: string, specifier: string, knownFiles: Set<string>): string | undefined {
  if (!specifier.startsWith(".")) return undefined;
  const base = resolve(dirname(fromFile), specifier);
  const substitutions = base.endsWith(".js") ? [base.slice(0, -3) + ".ts", base.slice(0, -3) + ".tsx"] : base.endsWith(".jsx") ? [base.slice(0, -4) + ".tsx"] : base.endsWith(".mjs") ? [base.slice(0, -4) + ".mts"] : base.endsWith(".cjs") ? [base.slice(0, -4) + ".cts"] : [];
  const candidates = [base, ...substitutions, ...RESOLVE_EXTENSIONS.map((extension) => `${base}${extension}`), ...RESOLVE_EXTENSIONS.map((extension) => join(base, `index${extension}`))];
  return candidates.find((candidate) => knownFiles.has(candidate));
}

function localSpecifiers(source: ts.SourceFile): string[] {
  const specifiers: string[] = [];
  const add = (node: ts.Expression | undefined) => { if (node && ts.isStringLiteralLike(node)) specifiers.push(node.text); };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) add(node.moduleSpecifier);
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteralLike(node.argument.literal)) specifiers.push(node.argument.literal.text);
    else if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) add(node.arguments[0]);
      else if (ts.isIdentifier(node.expression) && node.expression.text === "require") add(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return specifiers;
}

/** Builds a bounded, offline reverse dependency graph from JavaScript/TypeScript ASTs. */
export async function analyzeCodeImpact(workspace: string, changedPaths: readonly string[], options: CodeImpactOptions = {}): Promise<CodeImpactReport> {
  if (!Array.isArray(changedPaths) || changedPaths.length < 1 || changedPaths.length > MAX_CHANGED_FILES) throw new Error(`provide 1 to ${MAX_CHANGED_FILES} changed source paths`);
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
  if (!Number.isSafeInteger(maxFiles) || maxFiles < 1 || maxFiles > 20_000 || !Number.isSafeInteger(maxFileBytes) || maxFileBytes < 1 || maxFileBytes > 10 * 1024 * 1024) throw new Error("analysis limits are outside the supported bounds");
  const root = await realpath(resolve(workspace));
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory()) throw new Error("workspace must be a directory");
  const files: string[] = [];
  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) await walk(absolute);
      } else if (entry.isFile() && supportedSource(entry.name)) {
        files.push(absolute);
        if (files.length > maxFiles) throw new Error(`workspace exceeds the ${maxFiles} source-file analysis limit`);
      }
    }
  }
  await walk(root);
  const knownFiles = new Set(files);
  const changed = changedPaths.map((input) => {
    if (typeof input !== "string" || !input || isAbsolute(input) || input.includes("\0")) throw new Error("changed paths must be relative workspace paths");
    const target = resolve(root, input);
    const rel = relative(root, target);
    if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("changed path resolves outside the workspace");
    if (!supportedSource(target)) throw new Error(`changed path is not a supported JS/TS source file: ${input}`);
    if (!knownFiles.has(target)) throw new Error(`changed source file is missing, symlinked, or ignored: ${input}`);
    return target;
  });
  if (new Set(changed).size !== changed.length) throw new Error("changed source paths must be unique");

  const reverse = new Map<string, Set<string>>();
  const parseErrors: Array<{ file: string; count: number }> = [];
  let unresolvedImports = 0;
  for (const file of files) {
    const text = await readSource(file, maxFileBytes);
    const scriptKind = /\.tsx$/.test(file) ? ts.ScriptKind.TSX : /\.[cm]?jsx?$/.test(file) ? ts.ScriptKind.JSX : ts.ScriptKind.TS;
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKind);
    const syntaxDiagnostics = ts.transpileModule(text, { fileName: file, reportDiagnostics: true, compilerOptions: { noEmit: true } }).diagnostics ?? [];
    if (syntaxDiagnostics.length) parseErrors.push({ file: normalizeRelative(relative(root, file)), count: syntaxDiagnostics.length });
    for (const specifier of localSpecifiers(source)) {
      const dependency = resolveLocalImport(file, specifier, knownFiles);
      if (!dependency) { if (specifier.startsWith(".")) unresolvedImports += 1; continue; }
      const dependents = reverse.get(dependency) ?? new Set<string>();
      dependents.add(file);
      reverse.set(dependency, dependents);
    }
  }

  const visited = new Set(changed);
  const queue = [...changed];
  while (queue.length) for (const dependent of reverse.get(queue.shift()!) ?? []) if (!visited.has(dependent)) { visited.add(dependent); queue.push(dependent); }
  const impacted = [...visited].filter((file) => !changed.includes(file)).map((file) => normalizeRelative(relative(root, file))).sort();
  const relativeChanged = changed.map((file) => normalizeRelative(relative(root, file))).sort();
  return {
    workspace: root,
    changedFiles: relativeChanged,
    impactedFiles: impacted,
    impactedTests: impacted.filter(isTestFile),
    unresolvedImports,
    parseErrors: parseErrors.sort((a, b) => a.file.localeCompare(b.file)),
    scannedFiles: files.length,
    analysis: "static-typescript-ast-import-graph",
  };
}
