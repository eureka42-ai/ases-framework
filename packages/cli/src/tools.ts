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
  parseInput(value: unknown): Input;
  run(input: Input): Promise<Output>;
  validateOutput(value: unknown): value is Output;
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
