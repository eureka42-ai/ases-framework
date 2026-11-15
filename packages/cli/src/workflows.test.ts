import assert from "node:assert/strict";
import test from "node:test";
import { validateWorkflow, WorkflowValidationError } from "./workflows.js";

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
