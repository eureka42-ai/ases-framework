import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createWorkflowCheckpoint, loadWorkflowCheckpoint, resumeWorkflow, saveWorkflowCheckpoint, validateWorkflow, WorkflowValidationError } from "./workflows.js";

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
  const workflow = { id: "feature-build", steps: [
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
