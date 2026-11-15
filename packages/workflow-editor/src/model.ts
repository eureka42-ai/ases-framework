export type StepKind = "agent" | "tool" | "approval" | "condition";
export type WorkflowPermission = "workspace.read" | "workspace.write" | "network" | "command.execute";

export interface EditorStep {
  id: string;
  name: string;
  kind: StepKind;
  agentId: string;
  dependsOn: string[];
  timeoutMinutes: number;
  permissions: WorkflowPermission[];
}

export interface EditorWorkflow { id: string; title: string; steps: EditorStep[] }

export const STORAGE_KEY = "eureka42.ases.workflow-editor.v1";
export const PERMISSIONS: Array<{ id: WorkflowPermission; label: string }> = [
  { id: "workspace.read", label: "Repository" },
  { id: "workspace.write", label: "Artifact storage" },
  { id: "network", label: "Network access" },
  { id: "command.execute", label: "Command execution" },
];

export function createInitialWorkflow(): EditorWorkflow {
  return {
    id: "feature-delivery",
    title: "Feature delivery",
    steps: [
      { id: "analyze", name: "Analyze request", kind: "agent", agentId: "analysis", dependsOn: [], timeoutMinutes: 15, permissions: ["workspace.read"] },
      { id: "plan", name: "Create plan", kind: "agent", agentId: "planning", dependsOn: ["analyze"], timeoutMinutes: 15, permissions: ["workspace.read"] },
      { id: "implement", name: "Implement", kind: "agent", agentId: "development", dependsOn: ["plan"], timeoutMinutes: 30, permissions: ["workspace.read", "workspace.write"] },
      { id: "verify", name: "Verify tests", kind: "tool", agentId: "test-runner", dependsOn: ["implement"], timeoutMinutes: 10, permissions: ["workspace.read"] },
    ],
  };
}

export function topologicalOrder(workflow: EditorWorkflow): string[] {
  if (!/^[a-z][a-z0-9-]{1,62}$/.test(workflow.id)) throw new Error("Workflow ID must use a lowercase slug.");
  if (typeof workflow.title !== "string" || !workflow.title.trim() || workflow.title.length > 120) throw new Error("A workflow needs a title of at most 120 characters.");
  if (!workflow.steps.length || workflow.steps.length > 50) throw new Error("A workflow must have between 1 and 50 steps.");
  const byId = new Map<string, EditorStep>();
  for (const step of workflow.steps) {
    if (!/^[a-z][a-z0-9-]{0,62}$/.test(step.id) || byId.has(step.id)) throw new Error(`Invalid or duplicate step ID: ${step.id}`);
    if (!step.name.trim() || step.name.length > 120) throw new Error(`Step ${step.id} needs a name of at most 120 characters.`);
    if (!["agent", "tool", "approval", "condition"].includes(step.kind)) throw new Error(`Step ${step.id} has an unknown kind.`);
    if (!Number.isInteger(step.timeoutMinutes) || step.timeoutMinutes < 1 || step.timeoutMinutes > 120) throw new Error(`Step ${step.id} timeout must be between 1 and 120 minutes.`);
    if (!Array.isArray(step.dependsOn) || new Set(step.dependsOn).size !== step.dependsOn.length || step.dependsOn.includes(step.id)) throw new Error(`Step ${step.id} has duplicate or self dependencies.`);
    if (!Array.isArray(step.permissions) || new Set(step.permissions).size !== step.permissions.length || step.permissions.some((permission) => !PERMISSIONS.some((item) => item.id === permission))) throw new Error(`Step ${step.id} has invalid permissions.`);
    byId.set(step.id, step);
  }
  for (const step of workflow.steps) for (const dependency of step.dependsOn) if (!byId.has(dependency)) throw new Error(`Step ${step.id} depends on unknown step ${dependency}.`);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const order: string[] = [];
  const visit = (id: string): void => {
    if (visiting.has(id)) throw new Error(`This dependency creates a cycle at ${id}.`);
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

export function serializeWorkflow(workflow: EditorWorkflow): string {
  topologicalOrder(workflow);
  return `${JSON.stringify({ schemaVersion: "1", id: workflow.id, title: workflow.title, steps: workflow.steps.map(({ id, name, kind, agentId, dependsOn, timeoutMinutes, permissions }) => ({ id, name, kind, agentId, dependsOn, timeoutMinutes, permissions })) }, null, 2)}\n`;
}

export function parseWorkflow(json: string): EditorWorkflow {
  const raw: unknown = JSON.parse(json);
  if (!raw || typeof raw !== "object") throw new Error("This file is not an ASES workflow definition.");
  const record = raw as { schemaVersion?: unknown; workflow?: unknown };
  if (record.schemaVersion !== undefined && record.schemaVersion !== "1") throw new Error("Unsupported workflow schema version.");
  const workflow = record.workflow ?? raw;
  if (!workflow || typeof workflow !== "object") throw new Error("Workflow data is missing.");
  const value = workflow as Partial<EditorWorkflow>;
  if (typeof value.id !== "string" || typeof value.title !== "string" || value.title.length > 120 || !Array.isArray(value.steps)) throw new Error("Workflow identity or steps are invalid.");
  const parsed: EditorWorkflow = { id: value.id, title: value.title, steps: value.steps.map((step) => {
    if (!step || typeof step !== "object" || typeof step.id !== "string" || !Array.isArray(step.dependsOn) || typeof step.kind !== "string") throw new Error("A workflow step is malformed.");
    return {
      id: step.id,
      name: typeof step.name === "string" ? step.name : step.id,
      kind: step.kind,
      agentId: typeof step.agentId === "string" ? step.agentId : step.kind === "agent" ? "development" : "test-runner",
      dependsOn: [...step.dependsOn] as string[],
      timeoutMinutes: typeof step.timeoutMinutes === "number" ? step.timeoutMinutes : 15,
      permissions: Array.isArray(step.permissions) ? [...step.permissions] as WorkflowPermission[] : [],
    };
  }) };
  topologicalOrder(parsed);
  return parsed;
}
