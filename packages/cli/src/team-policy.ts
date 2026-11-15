import { constants } from "node:fs";
import { lstat, open } from "node:fs/promises";
import type { SecurityAction, SecurityPolicyRule } from "./policy.js";
import { SecurityPolicyEngine } from "./policy.js";

const ACTIONS = ["tool.execute", "workspace.read", "workspace.write", "workspace.delete", "network", "command.execute"] as const satisfies readonly SecurityAction[];
const RULE_ID = /^[a-z][a-z0-9-]{1,63}$/;
const ACTOR_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const MAX_BYTES = 1024 * 1024;

export interface TeamPolicyRule extends SecurityPolicyRule {
  id: string;
  rationale: string;
}

export interface TeamPolicyDocument {
  schemaVersion: "1";
  defaultEffect: "deny";
  rules: TeamPolicyRule[];
}

export interface TeamPolicyValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  policy?: TeamPolicyDocument;
}

export const teamPolicyTemplate: TeamPolicyDocument = {
  schemaVersion: "1",
  defaultEffect: "deny",
  rules: [],
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function isSecurityAction(value: unknown): value is SecurityAction {
  return typeof value === "string" && ACTIONS.includes(value as SecurityAction);
}

function commandResourceIsExact(resource: string): boolean {
  if (!resource.startsWith("command:")) return false;
  try {
    const value: unknown = JSON.parse(resource.slice("command:".length));
    return Array.isArray(value) && value.length > 0 && value.every((part) => typeof part === "string" && part.length > 0);
  } catch { return false; }
}

/** Validates a serializable, team-owned policy with default-deny semantics. */
export function validateTeamPolicy(value: unknown): TeamPolicyValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isObject(value)) return { valid: false, errors: ["policy must be an object"], warnings };
  for (const key of Object.keys(value)) if (!["schemaVersion", "defaultEffect", "rules"].includes(key)) errors.push(`unknown policy property: ${key}`);
  if (value["schemaVersion"] !== "1") errors.push("schemaVersion must be '1'");
  if (value["defaultEffect"] !== "deny") errors.push("defaultEffect must be 'deny'");
  if (!Array.isArray(value["rules"]) || value["rules"].length > 500) return { valid: false, errors: [...errors, "rules must be an array with at most 500 entries"], warnings };

  const ids = new Set<string>();
  const targetEffects = new Map<string, Set<string>>();
  const normalized: TeamPolicyRule[] = [];
  value["rules"].forEach((raw, index) => {
    const label = `rules[${index}]`;
    if (!isObject(raw)) { errors.push(`${label} must be an object`); return; }
    for (const key of Object.keys(raw)) if (!["id", "effect", "action", "actorId", "resource", "rationale"].includes(key)) errors.push(`${label} has unknown property: ${key}`);
    if (typeof raw["id"] !== "string" || !RULE_ID.test(raw["id"]) || ids.has(raw["id"])) errors.push(`${label}.id must be valid and unique`);
    else ids.add(raw["id"]);
    if (raw["effect"] !== "allow" && raw["effect"] !== "deny") errors.push(`${label}.effect must be allow or deny`);
    if (typeof raw["action"] !== "string" || !ACTIONS.includes(raw["action"] as SecurityAction)) errors.push(`${label}.action is unknown`);
    if (raw["actorId"] !== undefined && (typeof raw["actorId"] !== "string" || !ACTOR_ID.test(raw["actorId"]))) errors.push(`${label}.actorId is invalid`);
    if (raw["resource"] !== undefined && (typeof raw["resource"] !== "string" || !raw["resource"].trim() || raw["resource"].length > 512 || raw["resource"] === "*")) errors.push(`${label}.resource must be a non-empty exact resource`);
    if (typeof raw["rationale"] !== "string" || raw["rationale"].trim().length < 10 || raw["rationale"].length > 1024) errors.push(`${label}.rationale must contain 10 to 1024 characters`);
    if (raw["effect"] === "allow" && raw["actorId"] === undefined && raw["resource"] === undefined) errors.push(`${label} allow rules must scope an actor or resource`);
    if (raw["action"] === "command.execute" && (typeof raw["resource"] !== "string" || !commandResourceIsExact(raw["resource"]))) errors.push(`${label} command.execute requires an exact command resource`);

    if ((raw["effect"] === "allow" || raw["effect"] === "deny") && typeof raw["action"] === "string" && ACTIONS.includes(raw["action"] as SecurityAction)) {
      const key = JSON.stringify([raw["action"], raw["actorId"] ?? null, raw["resource"] ?? null]);
      const effects = targetEffects.get(key) ?? new Set<string>();
      effects.add(raw["effect"]);
      targetEffects.set(key, effects);
    }
    if (typeof raw["id"] === "string" && RULE_ID.test(raw["id"]) && (raw["effect"] === "allow" || raw["effect"] === "deny") && typeof raw["action"] === "string" && ACTIONS.includes(raw["action"] as SecurityAction)
      && (raw["actorId"] === undefined || typeof raw["actorId"] === "string") && (raw["resource"] === undefined || typeof raw["resource"] === "string")
      && typeof raw["rationale"] === "string") {
      normalized.push({ id: raw["id"], effect: raw["effect"], action: raw["action"] as SecurityAction, ...(typeof raw["actorId"] === "string" ? { actorId: raw["actorId"] } : {}), ...(typeof raw["resource"] === "string" ? { resource: raw["resource"] } : {}), rationale: raw["rationale"].trim() });
    }
  });
  if ([...targetEffects.values()].some((effects) => effects.has("allow") && effects.has("deny"))) warnings.push("matching allow and deny rules exist; explicit deny always wins");
  const valid = errors.length === 0;
  return valid ? { valid, errors, warnings, policy: { schemaVersion: "1", defaultEffect: "deny", rules: normalized } } : { valid, errors, warnings };
}

export function createTeamPolicyEngine(value: unknown): SecurityPolicyEngine {
  const validation = validateTeamPolicy(value);
  if (!validation.valid || !validation.policy) throw new TypeError(`team policy invalid: ${validation.errors.join("; ")}`);
  return new SecurityPolicyEngine(validation.policy.rules);
}

/** Reads only a bounded, regular local JSON policy file. */
export async function readTeamPolicyFile(path: string): Promise<unknown> {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_BYTES) throw new TypeError("policy file must be a regular file no larger than 1 MiB");
  const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.size > MAX_BYTES) throw new TypeError("policy file must be a regular file no larger than 1 MiB");
    const content = await handle.readFile("utf8");
    if (Buffer.byteLength(content, "utf8") > MAX_BYTES) throw new TypeError("policy file must be a regular file no larger than 1 MiB");
    return JSON.parse(content) as unknown;
  } finally {
    await handle.close();
  }
}
