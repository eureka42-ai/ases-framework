import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, realpath, rename, unlink } from "node:fs/promises";
import { join } from "node:path";

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

export interface WorkflowCheckpoint {
  workflowId: string;
  definitionHash: string;
  order: string[];
  completedStepIds: string[];
  nextStepIndex: number;
  updatedAt: string;
}

function workflowHash(workflow: WorkflowDefinition): string {
  const canonical = JSON.stringify({
    id: workflow.id,
    steps: workflow.steps.map((step) => ({ id: step.id, kind: step.kind, dependsOn: [...step.dependsOn].sort() })),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

function validateCompletedPrefix(order: readonly string[], completedStepIds: readonly string[]): void {
  if (completedStepIds.length > order.length || completedStepIds.some((id, index) => id !== order[index])) {
    throw new WorkflowValidationError("completed workflow steps must be a prefix of the validated order");
  }
}

export function createWorkflowCheckpoint(workflow: WorkflowDefinition, completedStepIds: readonly string[] = []): WorkflowCheckpoint {
  const order = validateWorkflow(workflow);
  validateCompletedPrefix(order, completedStepIds);
  return {
    workflowId: workflow.id,
    definitionHash: workflowHash(workflow),
    order,
    completedStepIds: [...completedStepIds],
    nextStepIndex: completedStepIds.length,
    updatedAt: new Date().toISOString(),
  };
}

export function resumeWorkflow(workflow: WorkflowDefinition, checkpoint: WorkflowCheckpoint): WorkflowCheckpoint {
  const fresh = createWorkflowCheckpoint(workflow, checkpoint.completedStepIds);
  if (checkpoint.workflowId !== workflow.id || checkpoint.definitionHash !== fresh.definitionHash || JSON.stringify(checkpoint.order) !== JSON.stringify(fresh.order) || checkpoint.nextStepIndex !== fresh.nextStepIndex) {
    throw new WorkflowValidationError("checkpoint does not match the current workflow definition");
  }
  return { ...fresh, updatedAt: checkpoint.updatedAt };
}

async function ensureCheckpointDirectory(workspaceRoot: string): Promise<string> {
  const root = await realpath(workspaceRoot);
  let directory = root;
  for (const part of [".ases", "workflows"]) {
    directory = join(directory, part);
    try { await mkdir(directory); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new WorkflowValidationError("checkpoint directory must not be a symlink");
  }
  return directory;
}

export async function saveWorkflowCheckpoint(workspaceRoot: string, checkpoint: WorkflowCheckpoint): Promise<void> {
  if (!/^[a-z][a-z0-9-]{1,62}$/.test(checkpoint.workflowId)) throw new WorkflowValidationError("invalid checkpoint workflow ID");
  const directory = await ensureCheckpointDirectory(workspaceRoot);
  const target = join(directory, `${checkpoint.workflowId}.json`);
  try {
    const info = await lstat(target);
    if (!info.isFile() || info.isSymbolicLink()) throw new WorkflowValidationError("checkpoint target must be a regular file");
  } catch (error) {
    if (error instanceof WorkflowValidationError || (error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const temporary = join(directory, `.${checkpoint.workflowId}.${randomUUID()}.tmp`);
  const file = await open(temporary, "wx", 0o600);
  try {
    await file.writeFile(`${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
    await file.sync();
  } finally {
    await file.close();
  }
  try { await rename(temporary, target); } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

export async function loadWorkflowCheckpoint(workspaceRoot: string, workflowId: string): Promise<WorkflowCheckpoint | undefined> {
  if (!/^[a-z][a-z0-9-]{1,62}$/.test(workflowId)) throw new WorkflowValidationError("invalid checkpoint workflow ID");
  const directory = await ensureCheckpointDirectory(workspaceRoot);
  const target = join(directory, `${workflowId}.json`);
  let info;
  try { info = await lstat(target); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
  if (!info.isFile() || info.isSymbolicLink()) throw new WorkflowValidationError("checkpoint target must be a regular file");
  const parsed: unknown = JSON.parse(await readFile(target, "utf8"));
  if (!parsed || typeof parsed !== "object" || (parsed as WorkflowCheckpoint).workflowId !== workflowId) throw new WorkflowValidationError("invalid workflow checkpoint");
  return parsed as WorkflowCheckpoint;
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
