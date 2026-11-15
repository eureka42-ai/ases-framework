import assert from "node:assert/strict";
import test from "node:test";
import { SecurityPolicyEngine } from "./policy.js";
import { executeTool, ToolExecutionError, type RuntimeTool } from "./tools.js";

test("runtime tools validate input and output", async () => {
  let calls = 0;
  const tool: RuntimeTool<{ value: string }, { length: number }> = {
    name: "measure",
    sideEffect: false,
    parseInput(value) {
      if (!value || typeof value !== "object" || typeof (value as { value?: unknown }).value !== "string") throw new Error("invalid");
      return value as { value: string };
    },
    async run(input) { calls += 1; return { length: input.value.length }; },
    validateOutput(value): value is { length: number } { return Boolean(value && typeof value === "object" && typeof (value as { length?: unknown }).length === "number"); },
  };
  assert.deepEqual(await executeTool(tool, { value: "hello" }, { authorize: () => true }), { length: 5 });
  await assert.rejects(executeTool(tool, { value: 3 }), (error: unknown) => error instanceof ToolExecutionError && error.code === "INVALID_INPUT");
  assert.equal(calls, 1);
  const invalidOutput = { ...tool, async run() { return { length: "bad" }; } } as unknown as RuntimeTool<{ value: string }, { length: number }>;
  await assert.rejects(executeTool(invalidOutput, { value: "hello" }, { authorize: () => true }), (error: unknown) => error instanceof ToolExecutionError && error.code === "INVALID_OUTPUT");
});

test("every tool requires an explicit policy decision before running", async () => {
  let calls = 0;
  const tool: RuntimeTool<{ path: string }, { ok: boolean }> = {
    name: "write-file",
    sideEffect: true,
    parseInput(value) {
      if (!value || typeof value !== "object" || typeof (value as { path?: unknown }).path !== "string") throw new Error("invalid");
      return value as { path: string };
    },
    async run() { calls += 1; return { ok: true }; },
    validateOutput(value): value is { ok: boolean } { return Boolean(value && typeof value === "object" && (value as { ok?: unknown }).ok === true); },
  };
  await assert.rejects(executeTool(tool, { path: "out.txt" }), (error: unknown) => error instanceof ToolExecutionError && error.code === "POLICY_REQUIRED");
  await assert.rejects(executeTool(tool, { path: "out.txt" }, { policy: new SecurityPolicyEngine(), actorId: "agent-a" }), (error: unknown) => error instanceof ToolExecutionError && error.code === "POLICY_DENIED");
  await assert.rejects(executeTool(tool, { path: "out.txt" }, { authorize: () => false }), (error: unknown) => error instanceof ToolExecutionError && error.code === "POLICY_DENIED");
  assert.equal(calls, 0);
  assert.deepEqual(await executeTool(tool, { path: "out.txt" }, { authorize: async () => true }), { ok: true });
  assert.equal(calls, 1);
  const policy = new SecurityPolicyEngine([{ effect: "allow", action: "tool.execute", actorId: "writer", resource: "write-file" }]);
  assert.deepEqual(await executeTool(tool, { path: "out.txt" }, { policy, actorId: "writer" }), { ok: true });
  assert.equal(calls, 2);
});
