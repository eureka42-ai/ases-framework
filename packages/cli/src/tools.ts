import { SecurityPolicyEngine } from "./policy.js";

export type ToolErrorCode = "INVALID_INPUT" | "POLICY_REQUIRED" | "POLICY_DENIED" | "INVALID_OUTPUT";

export class ToolExecutionError extends Error {
  constructor(readonly code: ToolErrorCode, message: string) {
    super(message);
    this.name = "ToolExecutionError";
  }
}

export interface RuntimeTool<Input, Output> {
  name: string;
  sideEffect: boolean;
  /** Declared functions the tool can perform, such as `repository.search`. */
  capabilities?: readonly string[];
  parseInput(value: unknown): Input;
  run(input: Input): Promise<Output>;
  validateOutput(value: unknown): value is Output;
}

export interface ToolCapabilityMatch {
  name: string;
  capabilities: string[];
  matchedCapabilities: string[];
  missingCapabilities: string[];
  compatible: boolean;
  score: number;
  sideEffect: boolean;
}

const CAPABILITY = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;

/** Discovers tools by declared capabilities and ranks the closest matches deterministically.
 * Discovery is descriptive only; callers must still pass the selected tool through executeTool.
 */
export function rankToolsByCapabilities(tools: readonly RuntimeTool<any, any>[], requiredCapabilities: readonly string[]): ToolCapabilityMatch[] {
  if (requiredCapabilities.length === 0 || requiredCapabilities.some((item) => typeof item !== "string" || !CAPABILITY.test(item)) || new Set(requiredCapabilities).size !== requiredCapabilities.length) {
    throw new TypeError("required capabilities must be non-empty, valid and unique");
  }
  const required = new Set(requiredCapabilities);
  const names = new Set<string>();
  const matches = tools.map((tool): ToolCapabilityMatch => {
    if (!tool || typeof tool.name !== "string" || !tool.name) throw new TypeError("tool names must be non-empty strings");
    if (names.has(tool.name)) throw new TypeError(`duplicate tool name: ${tool.name}`);
    names.add(tool.name);
    if (typeof tool.sideEffect !== "boolean") throw new TypeError(`tool sideEffect must be declared: ${tool.name}`);
    if (tool.capabilities !== undefined && !Array.isArray(tool.capabilities)) throw new TypeError(`tool capabilities must be an array: ${tool.name}`);
    const declared: string[] = [...(tool.capabilities ?? [])];
    if (declared.some((item) => typeof item !== "string" || !CAPABILITY.test(item)) || new Set(declared).size !== declared.length) {
      throw new TypeError(`tool capabilities must be valid and unique: ${tool.name}`);
    }
    const available = new Set(declared);
    const matchedCapabilities = requiredCapabilities.filter((item) => available.has(item));
    const missingCapabilities = requiredCapabilities.filter((item) => !available.has(item));
    const compatible = missingCapabilities.length === 0;
    const coverage = matchedCapabilities.length / requiredCapabilities.length;
    const extraCount = declared.filter((item) => !required.has(item)).length;
    return {
      name: tool.name,
      capabilities: declared.sort(),
      matchedCapabilities,
      missingCapabilities,
      compatible,
      score: Math.round(Math.max(0, coverage * 100 - extraCount * 0.01) * 100) / 100,
      sideEffect: tool.sideEffect,
    };
  });
  return matches.sort((a, b) => {
    const byName = a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    return b.score - a.score
      || a.missingCapabilities.length - b.missingCapabilities.length
      || a.capabilities.length - b.capabilities.length
      || byName;
  });
}

export interface ToolExecutionOptions {
  policy?: SecurityPolicyEngine;
  actorId?: string;
  authorize?: (toolName: string) => boolean | Promise<boolean>;
}

/** Validates both boundaries and requires an explicit allow decision before every tool runs. */
export async function executeTool<Input, Output>(tool: RuntimeTool<Input, Output>, rawInput: unknown, options: ToolExecutionOptions = {}): Promise<Output> {
  let input: Input;
  try {
    input = tool.parseInput(rawInput);
  } catch {
    throw new ToolExecutionError("INVALID_INPUT", `input validation failed for tool ${tool.name}`);
  }
  if (!options.policy && !options.authorize) throw new ToolExecutionError("POLICY_REQUIRED", `tool ${tool.name} requires an explicit policy decision`);
  const allowed = options.policy
    ? options.policy.evaluate({ actorId: options.actorId ?? "", action: "tool.execute", resource: tool.name }).allowed
    : await options.authorize!(tool.name);
  if (!allowed) throw new ToolExecutionError("POLICY_DENIED", `policy denied tool ${tool.name}`);
  const output = await tool.run(input);
  if (!tool.validateOutput(output)) throw new ToolExecutionError("INVALID_OUTPUT", `output validation failed for tool ${tool.name}`);
  return output;
}
