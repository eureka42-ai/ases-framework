import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFeatureWorkflow, createWorkflowCheckpoint, executeFeatureWorkflow, executeWorkflow, isWorkflowApprovalSatisfied, loadWorkflowCheckpoint, resumeWorkflow, runStepWithRetry, saveWorkflowCheckpoint, validateWorkflow, WorkflowDefinition, WorkflowExecutionError, WorkflowValidationError } from "./workflows.js";

test("feature workflow runs tests, writes verifiable evidence, and requires independent review", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-feature-flow-"));
  const workflow = createFeatureWorkflow();
  const expected = ["analyze", "plan", "implement", "test", "evidence", "review"];
  assert.deepEqual(validateWorkflow(workflow), expected);

  const executed: string[] = [];
  let testOutput = "";
  const handlers = {
    analyze: async () => { executed.push("analyze"); },
    plan: async () => { executed.push("plan"); },
    implement: async () => { executed.push("implement"); },
    test: async () => {
      executed.push("test");
      const fixture = join(workspace, "feature.smoke.test.mjs");
      await writeFile(fixture, 'import assert from "node:assert/strict"; import test from "node:test"; test("feature behavior", () => assert.equal(2 + 2, 4));\n', { flag: "wx" });
      const childEnv = { ...process.env };
      delete childEnv.NODE_TEST_CONTEXT;
      const outcome = spawnSync(process.execPath, ["--test", fixture], { cwd: workspace, encoding: "utf8", timeout: 10_000, env: childEnv });
      assert.equal(outcome.status, 0, outcome.stderr || outcome.stdout);
      testOutput = `${outcome.stdout}${outcome.stderr}`;
      assert.match(testOutput, /pass 1/);
      assert.match(testOutput, /fail 0/);
    },
    evidence: async () => {
      executed.push("evidence");
      assert.match(testOutput, /pass 1/);
      assert.match(testOutput, /fail 0/);
      const evidence = {
        workflowId: workflow.id,
        testCommand: "node --test feature.smoke.test.mjs",
        testOutput,
        testOutputSha256: createHash("sha256").update(testOutput).digest("hex"),
      };
      await writeFile(join(workspace, "feature-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, { flag: "wx" });
    },
    review: async () => {
      executed.push("review");
      const evidence = JSON.parse(await readFile(join(workspace, "feature-evidence.json"), "utf8")) as { testOutput: string; testOutputSha256: string };
      assert.equal(createHash("sha256").update(evidence.testOutput).digest("hex"), evidence.testOutputSha256);
      return { status: "APPROVED" as const, authorId: "implementer", reviewerId: "independent-reviewer" };
    },
  };
  const result = await executeFeatureWorkflow(handlers, { dryRun: false });

  assert.equal(result.status, "COMPLETED");
  assert.deepEqual(executed, expected);
  const evidence = JSON.parse(await readFile(join(workspace, "feature-evidence.json"), "utf8")) as { testOutputSha256: string };
  assert.match(evidence.testOutputSha256, /^[a-f0-9]{64}$/);

  const blockedHandlers = {
    analyze: async () => undefined, plan: async () => undefined, implement: async () => undefined,
    test: async () => undefined, evidence: async () => undefined,
    review: async () => ({ status: "APPROVED" as const, authorId: "implementer", reviewerId: " IMPLEMENTER " }),
  };
  await assert.rejects(executeFeatureWorkflow(blockedHandlers, { dryRun: false }), (error: unknown) => error instanceof WorkflowExecutionError && error.code === "APPROVAL_REQUIRED");
});

test("workflow validator returns a deterministic dependency order", () => {
  assert.deepEqual(validateWorkflow({
    id: "feature-build",
    steps: [
      { id: "implement", kind: "agent", dependsOn: ["spec"] },
      { id: "spec", kind: "agent", dependsOn: [] },
      { id: "verify", kind: "tool", dependsOn: ["implement"] },
    ],
  }), ["spec", "implement", "verify"]);
});

test("workflow validator rejects cycles, unknown dependencies, and duplicate nodes", () => {
  assert.throws(() => validateWorkflow({ id: "workflow-x", steps: [
    { id: "step-a", kind: "agent", dependsOn: ["step-b"] },
    { id: "step-b", kind: "tool", dependsOn: ["step-a"] },
  ] }), /cycle/);
  assert.throws(() => validateWorkflow({ id: "workflow-x", steps: [{ id: "step-a", kind: "agent", dependsOn: ["missing"] }] }), /unknown dependency/);
  assert.throws(() => validateWorkflow({ id: "workflow-x", steps: [
    { id: "step-a", kind: "agent", dependsOn: [] },
    { id: "step-a", kind: "tool", dependsOn: [] },
  ] }), /duplicate/);
});

test("workflow checkpoints persist and resume only against the same definition", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-workflow-"));
  const workflow: WorkflowDefinition = { id: "feature-build", steps: [
    { id: "spec", kind: "agent" as const, dependsOn: [] },
    { id: "implement", kind: "agent" as const, dependsOn: ["spec"] },
  ] };
  const checkpoint = createWorkflowCheckpoint(workflow, ["spec"]);
  await saveWorkflowCheckpoint(workspace, checkpoint);
  const loaded = await loadWorkflowCheckpoint(workspace, workflow.id);
  assert.ok(loaded);
  assert.equal(resumeWorkflow(workflow, loaded).nextStepIndex, 1);
  const changed = { ...workflow, steps: [...workflow.steps, { id: "verify", kind: "tool" as const, dependsOn: ["implement"] }] };
  assert.throws(() => resumeWorkflow(changed, loaded), WorkflowValidationError);
  assert.equal(await loadWorkflowCheckpoint(workspace, "missing-flow"), undefined);
});

test("workflow retry obeys the attempt limit, timeout and cancellation", async () => {
  let attempts = 0;
  const result = await runStepWithRetry(async () => {
    attempts += 1;
    if (attempts < 2) throw new Error("transient");
    return "done";
  }, { maxAttempts: 2, timeoutMs: 100 });
  assert.equal(result, "done");
  assert.equal(attempts, 2);

  await assert.rejects(runStepWithRetry(async () => { throw new Error("always fails"); }, { maxAttempts: 2, timeoutMs: 100 }), (error: unknown) => error instanceof WorkflowExecutionError && error.code === "RETRIES_EXHAUSTED");
  await assert.rejects(runStepWithRetry(() => new Promise(() => {}), { maxAttempts: 1, timeoutMs: 5 }), (error: unknown) => error instanceof WorkflowExecutionError && error.code === "RETRIES_EXHAUSTED");

  const controller = new AbortController();
  controller.abort();
  let cancelledAttempts = 0;
  await assert.rejects(runStepWithRetry(async () => { cancelledAttempts += 1; return "never"; }, { maxAttempts: 3, timeoutMs: 100, signal: controller.signal }), (error: unknown) => error instanceof WorkflowExecutionError && error.code === "CANCELLED");
  assert.equal(cancelledAttempts, 0);
});

test("workflow dry-run does not invoke steps; normal execution follows the graph", async () => {
  const workflow: WorkflowDefinition = { id: "feature-build", steps: [
    { id: "implement", kind: "agent" as const, dependsOn: ["spec"] },
    { id: "spec", kind: "agent" as const, dependsOn: [] },
  ] };
  const executed: string[] = [];
  const handler = async (id: string): Promise<void> => { executed.push(id); };
  const dryRun = await executeWorkflow(workflow, handler, { dryRun: true });
  assert.equal(dryRun.status, "DRY_RUN");
  assert.deepEqual(executed, []);
  const result = await executeWorkflow(workflow, handler, { dryRun: false });
  assert.equal(result.status, "COMPLETED");
  assert.deepEqual(executed, ["spec", "implement"]);
});

test("workflow approvals stay blocked until an independent reviewer explicitly approves", () => {
  assert.equal(isWorkflowApprovalSatisfied({ status: "PENDING", authorId: "agent-a" }), false);
  assert.equal(isWorkflowApprovalSatisfied({ status: "APPROVED", authorId: "agent-a" }), false);
  assert.equal(isWorkflowApprovalSatisfied({ status: "APPROVED", authorId: "agent-a", reviewerId: " AGENT-A " }), false);
  assert.equal(isWorkflowApprovalSatisfied({ status: "REJECTED", authorId: "agent-a", reviewerId: "reviewer-b" }), false);
  assert.equal(isWorkflowApprovalSatisfied({ status: "APPROVED", authorId: "agent-a", reviewerId: "reviewer-b" }), true);
});

test("workflow side effects receive a stable idempotency key", async () => {
  const workflow: WorkflowDefinition = { id: "feature-build", steps: [
    { id: "publish-artifact", kind: "tool", dependsOn: [], sideEffect: { strategy: "idempotent" } },
  ] };
  const keys: string[] = [];
  const execute = async () => executeWorkflow(workflow, async (_stepId, context) => { keys.push(context.idempotencyKey ?? ""); }, { dryRun: false });
  await execute();
  await execute();
  assert.ok(keys[0]);
  assert.equal(keys[0], keys[1]);
  assert.match(keys[0]!, /^feature-build:[a-f0-9]{64}:publish-artifact$/);
});
