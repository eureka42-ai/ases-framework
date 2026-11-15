import assert from "node:assert/strict";
import test from "node:test";
import { SecurityPolicyEngine } from "./policy.js";
import { executeTool, rankToolsByCapabilities, ToolExecutionError, type RuntimeTool } from "./tools.js";

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

test("tool discovery ranks capability coverage deterministically without executing tools", () => {
  let calls = 0;
  const makeTool = (name: string, capabilities: string[], sideEffect = false): RuntimeTool<null, null> => ({
    name, capabilities, sideEffect,
    parseInput: () => null,
    async run() { calls++; return null; },
    validateOutput(value): value is null { return value === null; },
  });
  const ranked = rankToolsByCapabilities([
    makeTool("z_partial", ["repository.search"]),
    makeTool("b_exact", ["repository.search", "file.read"]),
    makeTool("a_overbroad", ["repository.search", "file.read", "network.request"], true),
    makeTool("a_missing", ["file.read"]),
  ], ["repository.search", "file.read"]);
  assert.deepEqual(ranked.map(({ name, compatible }) => [name, compatible]), [
    ["b_exact", true], ["a_overbroad", true], ["a_missing", false], ["z_partial", false],
  ]);
  assert.deepEqual(ranked[2]?.missingCapabilities, ["repository.search"]);
  assert.equal(ranked[0]?.score, 100);
  assert.equal(ranked[1]?.sideEffect, true);
  assert.equal(calls, 0);
});

test("tool discovery rejects malformed capability declarations and duplicate tools", () => {
  const tool = (name: string, capabilities?: string[]): RuntimeTool<null, null> => ({
    name, ...(capabilities ? { capabilities } : {}), sideEffect: false,
    parseInput: () => null, async run() { return null; }, validateOutput(value): value is null { return value === null; },
  });
  assert.throws(() => rankToolsByCapabilities([tool("one")], []), /non-empty/);
  assert.throws(() => rankToolsByCapabilities([tool("one", ["../escape"])], ["file.read"]), /valid and unique/);
  assert.throws(() => rankToolsByCapabilities([tool("one"), tool("one")], ["file.read"]), /duplicate tool name/);
});
