import { stat } from "node:fs/promises";
import { basename } from "node:path";
import { resolveToolPath, WorkspacePathError } from "./workspace-path.js";

export type SecurityAction = "tool.execute" | "workspace.read" | "workspace.write" | "workspace.delete" | "network" | "command.execute";
export type PolicyEffect = "allow" | "deny";

export interface SecurityPolicyRule {
  effect: PolicyEffect;
  action: SecurityAction;
  actorId?: string;
  resource?: string;
}

export interface SecurityPolicyRequest {
  actorId: string;
  action: SecurityAction;
  resource: string;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
}

export class PolicyAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyAccessError";
  }
}

/** Evaluates explicit allow/deny rules. Missing policy and unmatched actions are denied. */
export class SecurityPolicyEngine {
  private readonly rules: readonly SecurityPolicyRule[];

  constructor(rules: readonly SecurityPolicyRule[] = []) {
    for (const rule of rules) {
      if (!["allow", "deny"].includes(rule.effect) || !["tool.execute", "workspace.read", "workspace.write", "workspace.delete", "network", "command.execute"].includes(rule.action)) {
        throw new PolicyAccessError("policy contains an unknown effect or action");
      }
      if (rule.actorId !== undefined && !rule.actorId.trim()) throw new PolicyAccessError("policy actor IDs must not be empty");
      if (rule.resource !== undefined && !rule.resource.trim()) throw new PolicyAccessError("policy resources must not be empty");
    }
    this.rules = rules.map((rule) => ({ ...rule }));
  }

  evaluate(request: SecurityPolicyRequest): PolicyDecision {
    if (!request.actorId.trim() || !request.resource.trim()) return { allowed: false, reason: "invalid-request" };
    const matches = this.rules.filter((rule) => rule.action === request.action
      && (rule.actorId === undefined || rule.actorId === request.actorId)
      && (request.action !== "command.execute" || rule.resource === request.resource)
      && (rule.resource === undefined || rule.resource === request.resource));
    if (matches.some((rule) => rule.effect === "deny")) return { allowed: false, reason: "explicit-deny" };
    if (matches.some((rule) => rule.effect === "allow")) return { allowed: true, reason: "explicit-allow" };
    return { allowed: false, reason: "default-deny" };
  }
}

export interface CommandRequest {
  actorId: string;
  executable: string;
  args: readonly string[];
  workspaceRoot: string;
  cwd?: string;
}

export interface AuthorizedCommandPlan {
  executable: string;
  args: string[];
  cwd: string;
  resource: string;
}

const forbiddenExecutables = new Set(["sh", "bash", "zsh", "dash", "fish", "ksh", "csh", "tcsh", "cmd", "cmd.exe", "powershell", "powershell.exe", "pwsh", "pwsh.exe", "osascript"]);

function hasDynamicExecutionFlag(executable: string, args: readonly string[]): boolean {
  const name = basename(executable).toLocaleLowerCase("en-US");
  if (["node", "node.exe"].includes(name) && args.some((arg) => arg === "-e" || arg === "--eval")) return true;
  if (/^python(?:\d+(?:\.\d+)?)?(?:\.exe)?$/.test(name) && args.some((arg) => arg === "-c" || arg === "--command")) return true;
  if (["ruby", "perl"].includes(name) && args.some((arg) => arg === "-e")) return true;
  return false;
}

/** Produces an exact policy resource; command execution rules cannot use a broad wildcard. */
export function commandPolicyResource(executable: string, args: readonly string[]): string {
  return `command:${JSON.stringify([executable, ...args])}`;
}

/** Validates a command plan without executing it, requiring an exact allow rule and workspace-contained cwd. */
export async function authorizeCommand(engine: SecurityPolicyEngine, request: CommandRequest): Promise<AuthorizedCommandPlan> {
  if (!request.executable.trim() || request.executable.includes("\0") || request.args.some((arg) => arg.includes("\0") || /[\r\n]/.test(arg))) {
    throw new PolicyAccessError("command contains an invalid executable or argument");
  }
  if (request.args.some((arg) => arg.split(/[\\/]/).includes(".."))) throw new PolicyAccessError("command arguments must not traverse parent paths");
  const executableName = basename(request.executable).toLocaleLowerCase("en-US");
  if (forbiddenExecutables.has(executableName) || hasDynamicExecutionFlag(request.executable, request.args)) throw new PolicyAccessError("shell and dynamic code execution commands are denied");
  const resource = commandPolicyResource(request.executable, request.args);
  const exactAllow = engine.evaluate({ actorId: request.actorId, action: "command.execute", resource });
  if (!exactAllow.allowed) throw new PolicyAccessError(`command denied by policy: ${exactAllow.reason}`);
  try {
    const cwd = await resolveToolPath(request.workspaceRoot, request.cwd ?? ".");
    if (!(await stat(cwd)).isDirectory()) throw new PolicyAccessError("command cwd must be a workspace directory");
    return { executable: request.executable, args: [...request.args], cwd, resource };
  } catch (error) {
    if (error instanceof PolicyAccessError) throw error;
    if (error instanceof WorkspacePathError) throw new PolicyAccessError(error.message);
    throw error;
  }
}
