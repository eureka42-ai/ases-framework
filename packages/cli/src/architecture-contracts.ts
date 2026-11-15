import { lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

export type ArchitectureAssertionStatus = "PASS" | "DRIFT" | "UNVERIFIABLE";
export type ArchitectureAssertion =
  | { id: string; kind: "file-exists"; path: string }
  | { id: string; kind: "file-absent"; path: string }
  | { id: string; kind: "text-contains"; path: string; value: string }
  | { id: string; kind: "json-pointer-equals"; path: string; pointer: string; expected: unknown };

export interface ArchitectureContractResult {
  id: string;
  adrId: string;
  adrStatus: "PROPOSED" | "ACCEPTED" | "SUPERSEDED" | "REJECTED" | null;
  enforcement: "enforced" | "observe-only";
  assertions: Array<{ id: string; kind: ArchitectureAssertion["kind"]; path: string; status: ArchitectureAssertionStatus; detail: string }>;
}

export interface ArchitectureContractReport {
  schemaVersion: "1";
  contractsFile: string;
  status: "CLEAN" | "DRIFT" | "UNVERIFIABLE";
  summary: { contracts: number; assertions: number; passed: number; drift: number; unverifiable: number; adrUnverifiable: number; enforcedDrift: number; enforcedUnverifiable: number };
  contracts: ArchitectureContractResult[];
}

interface ArchitectureContract {
  id: string;
  adrId: string;
  adrPath: string;
  assertions: ArchitectureAssertion[];
}

interface CheckedFile { path: string; status: "regular" | "missing" | "blocked" | "too-large" }
const CONTRACT_ID = /^[a-z][a-z0-9-]{1,63}$/;
const ADR_ID = /^ADR-\d{3}$/;
const MAX_CONTRACT_BYTES = 1024 * 1024;
const MAX_JSON_BYTES = 4 * 1024 * 1024;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function safeRelativePath(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 1024 && !value.includes("\\") && !value.includes("\0") && !isAbsolute(value)
    && value.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

function validateContracts(value: unknown): ArchitectureContract[] {
  if (!isObject(value) || value["schemaVersion"] !== "1" || !Array.isArray(value["contracts"]) || value["contracts"].length < 1 || value["contracts"].length > 100) throw new TypeError("architecture contracts must use schemaVersion 1 and contain 1 to 100 contracts");
  const ids = new Set<string>();
  return value["contracts"].map((raw): ArchitectureContract => {
    if (!isObject(raw) || typeof raw["id"] !== "string" || !CONTRACT_ID.test(raw["id"]) || ids.has(raw["id"])) throw new TypeError("architecture contract IDs must be valid and unique");
    ids.add(raw["id"]);
    if (typeof raw["adrId"] !== "string" || !ADR_ID.test(raw["adrId"]) || !safeRelativePath(raw["adrPath"])) throw new TypeError(`architecture contract has an invalid ADR reference: ${raw["id"]}`);
    if (!Array.isArray(raw["assertions"]) || raw["assertions"].length === 0 || raw["assertions"].length > 100) throw new TypeError(`architecture contract assertions must contain 1 to 100 rules: ${raw["id"]}`);
    const assertionIds = new Set<string>();
    const assertions = raw["assertions"].map((rule): ArchitectureAssertion => {
      if (!isObject(rule) || typeof rule["id"] !== "string" || !CONTRACT_ID.test(rule["id"]) || assertionIds.has(rule["id"]) || !safeRelativePath(rule["path"])) throw new TypeError(`architecture assertion is invalid: ${raw["id"]}`);
      assertionIds.add(rule["id"]);
      if (rule["kind"] === "file-exists" || rule["kind"] === "file-absent") return { id: rule["id"], kind: rule["kind"], path: rule["path"] };
      if (rule["kind"] === "text-contains" && typeof rule["value"] === "string" && rule["value"].length > 0 && rule["value"].length <= 4096) return { id: rule["id"], kind: rule["kind"], path: rule["path"], value: rule["value"] };
      if (rule["kind"] === "json-pointer-equals" && typeof rule["pointer"] === "string" && (rule["pointer"] === "" || rule["pointer"].startsWith("/")) && (!rule["pointer"].includes("~") || !/~(?![01])/.test(rule["pointer"])) && Object.prototype.hasOwnProperty.call(rule, "expected")) {
        return { id: rule["id"], kind: rule["kind"], path: rule["path"], pointer: rule["pointer"], expected: rule["expected"] };
      }
      throw new TypeError(`architecture assertion kind or JSON pointer is invalid: ${raw["id"]}`);
    });
    return { id: raw["id"], adrId: raw["adrId"], adrPath: raw["adrPath"], assertions };
  });
}

async function inspectRegularFile(root: string, relativePath: string, maxBytes?: number): Promise<CheckedFile> {
  const segments = relativePath.split("/");
  let path = root;
  for (let index = 0; index < segments.length; index += 1) {
    path = join(path, segments[index]!);
    let info;
    try { info = await lstat(path); }
    catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return { path, status: "missing" };
      throw error;
    }
    if (info.isSymbolicLink() || (index < segments.length - 1 ? !info.isDirectory() : !info.isFile())) return { path, status: "blocked" };
    if (index === segments.length - 1 && maxBytes !== undefined && info.size > maxBytes) return { path, status: "too-large" };
  }
  const canonical = await realpath(path);
  const rel = relative(root, canonical);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return { path, status: "blocked" };
  return { path: canonical, status: "regular" };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isObject(value)) return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

function readPointer(value: unknown, pointer: string): { found: boolean; value?: unknown } {
  if (pointer === "") return { found: true, value };
  let current: unknown = value;
  for (const token of pointer.slice(1).split("/").map((item) => item.replace(/~1/g, "/").replace(/~0/g, "~"))) {
    if (Array.isArray(current) && /^(0|[1-9]\d*)$/.test(token)) {
      const index = Number(token);
      if (index >= current.length) return { found: false };
      current = current[index];
    } else if (isObject(current) && Object.prototype.hasOwnProperty.call(current, token)) {
      current = current[token];
    } else {
      return { found: false };
    }
  }
  return { found: true, value: current };
}

async function readAdrStatus(root: string, path: string, expectedId: string): Promise<ArchitectureContractResult["adrStatus"]> {
  const file = await inspectRegularFile(root, path, 64 * 1024);
  if (file.status !== "regular") return null;
  const markdown = await readFile(file.path, "utf8");
  const heading = markdown.match(/^#\s+(ADR-\d{3})\s+—/m)?.[1];
  const statuses = [...markdown.matchAll(/^Status:\s*(PROPOSED|ACCEPTED|SUPERSEDED|REJECTED)\s*$/gm)].map((match) => match[1]);
  if (heading !== expectedId || statuses.length !== 1) return null;
  return statuses[0] as NonNullable<ArchitectureContractResult["adrStatus"]>;
}

async function checkAssertion(root: string, assertion: ArchitectureAssertion): Promise<ArchitectureContractResult["assertions"][number]> {
  const maxBytes = assertion.kind === "json-pointer-equals" ? MAX_JSON_BYTES : assertion.kind === "text-contains" ? 256 * 1024 : undefined;
  const file = await inspectRegularFile(root, assertion.path, maxBytes);
  if (assertion.kind === "file-exists") {
    const status = file.status === "regular" ? "PASS" : file.status === "missing" ? "DRIFT" : "UNVERIFIABLE";
    return { id: assertion.id, kind: assertion.kind, path: assertion.path, status, detail: status === "PASS" ? "file exists" : status === "DRIFT" ? "required file is missing" : "file cannot be safely inspected" };
  }
  if (assertion.kind === "file-absent") {
    const status = file.status === "missing" ? "PASS" : file.status === "regular" ? "DRIFT" : "UNVERIFIABLE";
    return { id: assertion.id, kind: assertion.kind, path: assertion.path, status, detail: status === "PASS" ? "file is absent" : status === "DRIFT" ? "file should be absent" : "path cannot be safely inspected" };
  }
  if (assertion.kind === "text-contains") {
    if (file.status !== "regular") return { id: assertion.id, kind: assertion.kind, path: assertion.path, status: file.status === "missing" ? "DRIFT" : "UNVERIFIABLE", detail: file.status === "missing" ? "required source file is missing" : "source file cannot be safely inspected" };
    try {
      const content = await readFile(file.path, "utf8");
      const matches = content.includes(assertion.value);
      return { id: assertion.id, kind: assertion.kind, path: assertion.path, status: matches ? "PASS" : "DRIFT", detail: matches ? "required source marker exists" : "required source marker is missing" };
    } catch {
      return { id: assertion.id, kind: assertion.kind, path: assertion.path, status: "UNVERIFIABLE", detail: "source file could not be read" };
    }
  }
  if (file.status !== "regular") return { id: assertion.id, kind: assertion.kind, path: assertion.path, status: file.status === "missing" ? "DRIFT" : "UNVERIFIABLE", detail: file.status === "missing" ? "required JSON file is missing" : "JSON file cannot be safely inspected" };
  try {
    const document: unknown = JSON.parse(await readFile(file.path, "utf8"));
    const actual = readPointer(document, assertion.pointer);
    const matches = actual.found && canonicalJson(actual.value) === canonicalJson(assertion.expected);
    return { id: assertion.id, kind: assertion.kind, path: assertion.path, status: matches ? "PASS" : "DRIFT", detail: matches ? "contract value matches" : "contract value differs or is missing" };
  } catch {
    return { id: assertion.id, kind: assertion.kind, path: assertion.path, status: "UNVERIFIABLE", detail: "JSON is invalid or could not be read" };
  }
}

/** Checks declarative ADR-linked contracts without executing project code or following symlinks. */
export async function checkArchitectureContracts(workspace: string, contractsPath = "docs/architecture/contracts.json"): Promise<ArchitectureContractReport> {
  if (!safeRelativePath(contractsPath)) throw new TypeError("contracts path must be a safe workspace-relative path");
  const root = await realpath(resolve(workspace));
  const contractFile = await inspectRegularFile(root, contractsPath, MAX_CONTRACT_BYTES);
  if (contractFile.status !== "regular") throw new Error("architecture contract file is missing, oversized, symlinked, or outside the workspace");
  const contractValue: unknown = JSON.parse(await readFile(contractFile.path, "utf8"));
  const contracts = validateContracts(contractValue);
  const results: ArchitectureContractResult[] = [];
  for (const contract of contracts) {
    const adrStatus = await readAdrStatus(root, contract.adrPath, contract.adrId);
    const assertions = [];
    for (const assertion of contract.assertions) assertions.push(await checkAssertion(root, assertion));
    results.push({ id: contract.id, adrId: contract.adrId, adrStatus, enforcement: adrStatus === "ACCEPTED" ? "enforced" : "observe-only", assertions });
  }
  const allAssertions = results.flatMap((result) => result.assertions);
  const drift = allAssertions.filter((assertion) => assertion.status === "DRIFT").length;
  const enforcedDrift = results.filter((result) => result.enforcement === "enforced").flatMap((result) => result.assertions).filter((assertion) => assertion.status === "DRIFT").length;
  const enforcedUnverifiable = results.filter((result) => result.enforcement === "enforced").flatMap((result) => result.assertions).filter((assertion) => assertion.status === "UNVERIFIABLE").length;
  const adrUnverifiable = results.filter((result) => result.adrStatus === null).length;
  const unverifiable = allAssertions.filter((assertion) => assertion.status === "UNVERIFIABLE").length;
  return {
    schemaVersion: "1",
    contractsFile: contractsPath,
    status: enforcedDrift ? "DRIFT" : enforcedUnverifiable || adrUnverifiable ? "UNVERIFIABLE" : "CLEAN",
    summary: {
      contracts: results.length,
      assertions: allAssertions.length,
      passed: allAssertions.filter((assertion) => assertion.status === "PASS").length,
      drift,
      unverifiable,
      adrUnverifiable,
      enforcedDrift,
      enforcedUnverifiable,
    },
    contracts: results,
  };
}
