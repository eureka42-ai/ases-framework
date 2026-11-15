import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, realpath, rename, unlink } from "node:fs/promises";
import { join } from "node:path";

export type WorkflowStepKind = "agent" | "tool" | "approval" | "condition";

export interface WorkflowStep {
  id: string;
  kind: WorkflowStepKind;
  dependsOn: readonly string[];
  sideEffect?: { strategy: "idempotent" };
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

export type WorkflowExecutionErrorCode = "CANCELLED" | "TIMEOUT" | "RETRIES_EXHAUSTED";

export class WorkflowExecutionError extends Error {
  constructor(readonly code: WorkflowExecutionErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "WorkflowExecutionError";
  }
}

export interface WorkflowRetryOptions {
  maxAttempts: number;
  timeoutMs: number;
  signal?: AbortSignal;
}

/** Runs a workflow step with bounded attempts, per-attempt timeout, and caller cancellation. */
export async function runStepWithRetry<T>(handler: (signal: AbortSignal) => Promise<T>, options: WorkflowRetryOptions): Promise<T> {
  if (!Number.isSafeInteger(options.maxAttempts) || options.maxAttempts < 1 || !Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new WorkflowValidationError("retry attempts and timeout must be positive limits");
  }
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    if (options.signal?.aborted) throw new WorkflowExecutionError("CANCELLED", "workflow step was cancelled");
    const controller = new AbortController();
    let abortError: WorkflowExecutionError | undefined;
    let rejectAbort!: (error: WorkflowExecutionError) => void;
    const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
    const cancel = () => {
      abortError = new WorkflowExecutionError("CANCELLED", "workflow step was cancelled");
      controller.abort();
      rejectAbort(abortError);
    };
    options.signal?.addEventListener("abort", cancel, { once: true });
    const timer = setTimeout(() => {
      abortError = new WorkflowExecutionError("TIMEOUT", `workflow step exceeded ${options.timeoutMs}ms`);
      controller.abort();
      rejectAbort(abortError);
    }, options.timeoutMs);
    try {
      return await Promise.race([handler(controller.signal), aborted]);
    } catch (error) {
      if (abortError?.code === "CANCELLED") throw abortError;
      lastError = abortError ?? error;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", cancel);
    }
  }
  throw new WorkflowExecutionError("RETRIES_EXHAUSTED", `workflow step failed after ${options.maxAttempts} attempts`, { cause: lastError });
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
    steps: workflow.steps.map((step) => ({ id: step.id, kind: step.kind, dependsOn: [...step.dependsOn].sort(), sideEffect: step.sideEffect ?? null })),
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
    if (step.sideEffect && step.sideEffect.strategy !== "idempotent") throw new WorkflowValidationError(`side-effect step ${step.id} must declare an idempotent strategy`);
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

export type WorkflowRunResult =
  | { status: "DRY_RUN"; order: string[] }
  | { status: "COMPLETED"; order: string[] };

export interface WorkflowExecutionContext {
  idempotencyKey?: string;
}

export interface WorkflowApproval {
  status: "PENDING" | "APPROVED" | "REJECTED";
  authorId: string;
  reviewerId?: string;
}

/** Approval nodes remain closed until an explicit, independent reviewer decision exists. */
export function isWorkflowApprovalSatisfied(approval: WorkflowApproval): boolean {
  if (approval.status !== "APPROVED" || !approval.reviewerId?.trim() || !approval.authorId.trim()) return false;
  return approval.authorId.trim().toLocaleLowerCase("en-US") !== approval.reviewerId.trim().toLocaleLowerCase("en-US");
}

/** Executes a validated graph serially, or returns a pure plan without invoking handlers in dry-run mode. */
export async function executeWorkflow(
  workflow: WorkflowDefinition,
  executeStep: (stepId: string, context: WorkflowExecutionContext) => Promise<void>,
  options: { dryRun: boolean },
): Promise<WorkflowRunResult> {
  const order = validateWorkflow(workflow);
  if (options.dryRun) return { status: "DRY_RUN", order };
  for (const stepId of order) {
    const step = workflow.steps.find((candidate) => candidate.id === stepId)!;
    const context = step.sideEffect?.strategy === "idempotent"
      ? { idempotencyKey: `${workflow.id}:${workflowHash(workflow)}:${step.id}` }
      : {};
    await executeStep(stepId, context);
  }
  return { status: "COMPLETED", order };
}
