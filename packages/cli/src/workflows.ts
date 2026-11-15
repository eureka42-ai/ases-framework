export type WorkflowStepKind = "agent" | "tool" | "approval" | "condition";

export interface WorkflowStep {
  id: string;
  kind: WorkflowStepKind;
  dependsOn: readonly string[];
}

export interface WorkflowDefinition {
  id: string;
  steps: readonly WorkflowStep[];
}

export class WorkflowValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowValidationError";
  }
}

/** Validates workflow nodes and returns a deterministic topological execution order. */
export function validateWorkflow(workflow: WorkflowDefinition): string[] {
  if (!/^[a-z][a-z0-9-]{1,62}$/.test(workflow.id)) throw new WorkflowValidationError("workflow ID must be a lowercase slug");
  if (workflow.steps.length === 0) throw new WorkflowValidationError("workflow must contain at least one step");
  const byId = new Map<string, WorkflowStep>();
  for (const step of workflow.steps) {
    if (!/^[a-z][a-z0-9-]{0,62}$/.test(step.id) || byId.has(step.id)) throw new WorkflowValidationError(`invalid or duplicate workflow step ID: ${step.id}`);
    if (!["agent", "tool", "approval", "condition"].includes(step.kind)) throw new WorkflowValidationError(`invalid workflow step kind: ${step.kind}`);
    if (new Set(step.dependsOn).size !== step.dependsOn.length || step.dependsOn.includes(step.id)) throw new WorkflowValidationError(`invalid dependencies for step: ${step.id}`);
    byId.set(step.id, step);
  }
  for (const step of workflow.steps) {
    for (const dependency of step.dependsOn) if (!byId.has(dependency)) throw new WorkflowValidationError(`unknown dependency ${dependency} for step ${step.id}`);
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: string[] = [];
  const visit = (id: string): void => {
    if (visiting.has(id)) throw new WorkflowValidationError(`workflow contains a dependency cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)!.dependsOn) visit(dependency);
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  };
  for (const step of workflow.steps) visit(step.id);
  return order;
}
