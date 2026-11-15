import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkflowCheckpoint, executeWorkflow, loadWorkflowCheckpoint, resumeWorkflow, runStepWithRetry, saveWorkflowCheckpoint, validateWorkflow, WorkflowDefinition, WorkflowExecutionError, WorkflowValidationError } from "./workflows.js";

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
