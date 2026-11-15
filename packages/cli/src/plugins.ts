import { createHash } from "node:crypto";
import type { RuntimeTool } from "./tools.js";

export interface PluginManifest {
  schemaVersion: "1";
  id: string;
  version: string;
  apiVersion: string;
  entrypoint: string;
  integrity: string;
  source: string;
  permissions: string[];
}
export interface PluginValidationOptions {
  runtimeApiVersion: string;
  trustedSources: readonly string[];
  previouslyGrantedPermissions?: readonly string[];
  approvedAdditionalPermissions?: readonly string[];
}
export interface PluginContract {
  manifest: PluginManifest;
  tools: readonly RuntimeTool<any, any>[];
}

const ID = /^[a-z][a-z0-9-]{1,62}$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;
const PERMISSION = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;

function apiCompatible(pluginApi: string, runtimeApi: string): boolean {
  const plugin = pluginApi.match(SEMVER);
  const runtime = runtimeApi.match(SEMVER);
  if (!plugin || !runtime) return false;
  const [pluginMajor, pluginMinor] = plugin.slice(1).map(Number);
  const [runtimeMajor, runtimeMinor] = runtime.slice(1).map(Number);
  return pluginMajor === runtimeMajor && pluginMinor! <= runtimeMinor!;
}

function isSafeEntrypoint(path: string): boolean {
  return path.length > 0 && !path.startsWith("/") && !path.includes("\\") && path.split("/").every((part) => part && part !== "." && part !== "..") && !/^[A-Za-z]:/.test(path);
}

/** Validates manifest, runtime compatibility, source trust, entrypoint integrity, and permission expansion. */
export function validatePluginManifest(value: unknown, files: Readonly<Record<string, string>>, options: PluginValidationOptions): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["manifest must be an object"];
  const manifest = value as Partial<PluginManifest>;
  if (manifest.schemaVersion !== "1") errors.push("schemaVersion must be 1");
  if (typeof manifest.id !== "string" || !ID.test(manifest.id)) errors.push("id must be a lowercase plugin identifier");
  if (typeof manifest.version !== "string" || !SEMVER.test(manifest.version)) errors.push("version must be semantic versioning");
  if (typeof manifest.apiVersion !== "string" || !apiCompatible(manifest.apiVersion, options.runtimeApiVersion)) errors.push("plugin API version is incompatible with this runtime");
  if (typeof manifest.entrypoint !== "string" || !isSafeEntrypoint(manifest.entrypoint)) errors.push("entrypoint must be a safe relative path");
  if (typeof manifest.source !== "string" || !options.trustedSources.includes(manifest.source)) errors.push("plugin source is not trusted");
  if (!Array.isArray(manifest.permissions) || manifest.permissions.some((permission) => typeof permission !== "string" || !PERMISSION.test(permission)) || new Set(manifest.permissions).size !== manifest.permissions.length) errors.push("permissions must be unique scoped identifiers");
  if (typeof manifest.integrity !== "string" || !/^sha256:[a-f0-9]{64}$/.test(manifest.integrity)) errors.push("integrity must contain a SHA-256 digest");
  if (typeof manifest.entrypoint === "string" && isSafeEntrypoint(manifest.entrypoint)) {
    const source = files[manifest.entrypoint];
    if (typeof source !== "string") errors.push("entrypoint file is missing");
    else if (manifest.integrity !== `sha256:${createHash("sha256").update(source).digest("hex")}`) errors.push("entrypoint integrity check failed");
  }
  const previous = new Set(options.previouslyGrantedPermissions ?? []);
  const approved = new Set(options.approvedAdditionalPermissions ?? []);
  for (const permission of manifest.permissions ?? []) if (!previous.has(permission) && !approved.has(permission)) errors.push(`additional permission requires approval: ${permission}`);
  return errors;
}

/** SDK contract check: stable, unique tool IDs and declared permission coverage. */
export function validatePluginContract(plugin: PluginContract): string[] {
  const errors: string[] = [];
  const permissions = new Set(plugin.manifest.permissions);
  const names = new Set<string>();
  for (const tool of plugin.tools) {
    if (!/^[a-z][a-z0-9_]{1,63}$/.test(tool.name)) errors.push(`invalid tool name: ${tool.name}`);
    if (names.has(tool.name)) errors.push(`duplicate tool name: ${tool.name}`);
    names.add(tool.name);
    if (tool.sideEffect && !permissions.has("workspace:write")) errors.push(`side-effect tool requires workspace:write: ${tool.name}`);
    if (typeof tool.parseInput !== "function" || typeof tool.run !== "function" || typeof tool.validateOutput !== "function") errors.push(`tool contract is incomplete: ${tool.name}`);
  }
  return errors;
}

export interface PluginContractCase { tool: string; input: unknown; expectedOutput?: unknown }
export async function runPluginContractCases(plugin: PluginContract, cases: readonly PluginContractCase[]): Promise<Array<{ tool: string; status: "PASS" | "FAIL"; detail: string }>> {
  const contractErrors = validatePluginContract(plugin);
  if (contractErrors.length) throw new Error(`plugin contract invalid: ${contractErrors.join("; ")}`);
  return Promise.all(cases.map(async (item) => {
    const tool = plugin.tools.find((candidate) => candidate.name === item.tool);
    if (!tool) return { tool: item.tool, status: "FAIL" as const, detail: "tool is not declared" };
    try {
      const input = tool.parseInput(item.input);
      const output = await tool.run(input);
      if (!tool.validateOutput(output)) return { tool: item.tool, status: "FAIL" as const, detail: "output schema rejected handler result" };
      if (item.expectedOutput !== undefined && JSON.stringify(output) !== JSON.stringify(item.expectedOutput)) return { tool: item.tool, status: "FAIL" as const, detail: "output differs from fixture" };
      return { tool: item.tool, status: "PASS" as const, detail: "input/output contract satisfied" };
    } catch {
      return { tool: item.tool, status: "FAIL" as const, detail: "input validation or handler failed" };
    }
  }));
}
