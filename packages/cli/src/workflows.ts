import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, open, readFile, realpath, rename, unlink } from "node:fs/promises";
import { join } from "node:path";

export type WorkflowStepKind = "agent" | "tool" | "approval" | "condition";
export type WorkflowPermission = "workspace.read" | "workspace.write" | "network" | "command.execute";

export interface WorkflowStep {
  id: string;
  kind: WorkflowStepKind;
  dependsOn: readonly string[];
  name?: string;
  agentId?: string;
  timeoutMinutes?: number;
  permissions?: readonly WorkflowPermission[];
  sideEffect?: { strategy: "idempotent" };
}

export interface WorkflowDefinition {
  schemaVersion?: "1";
  id: string;
  title?: string;
  steps: readonly WorkflowStep[];
}

/** A reusable, serial feature-delivery workflow. Approval enforcement belongs to the review handler. */
export function createFeatureWorkflow(featureId = "feature-delivery"): WorkflowDefinition {
  return {
    id: featureId,
    title: "Feature delivery",
    steps: [
      { id: "analyze", kind: "agent", dependsOn: [] },
      { id: "plan", kind: "agent", dependsOn: ["analyze"] },
      { id: "implement", kind: "agent", dependsOn: ["plan"] },
      { id: "test", kind: "tool", dependsOn: ["implement"] },
      { id: "evidence", kind: "tool", dependsOn: ["test"] },
      { id: "review", kind: "approval", dependsOn: ["evidence"] },
    ],
  };
}

export interface FeatureWorkflowHandlers {
  analyze(context: WorkflowExecutionContext): Promise<void>;
  plan(context: WorkflowExecutionContext): Promise<void>;
  implement(context: WorkflowExecutionContext): Promise<void>;
  test(context: WorkflowExecutionContext): Promise<void>;
  evidence(context: WorkflowExecutionContext): Promise<void>;
  review(context: WorkflowExecutionContext): Promise<WorkflowApproval>;
}

export class WorkflowValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowValidationError";
  }
}

export type WorkflowExecutionErrorCode = "CANCELLED" | "TIMEOUT" | "RETRIES_EXHAUSTED" | "APPROVAL_REQUIRED";

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
    title: workflow.title ?? null,
    steps: workflow.steps.map((step) => ({ id: step.id, kind: step.kind, name: step.name ?? null, agentId: step.agentId ?? null, timeoutMinutes: step.timeoutMinutes ?? null, permissions: [...(step.permissions ?? [])].sort(), dependsOn: [...step.dependsOn].sort(), sideEffect: step.sideEffect ?? null })),
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
  if (workflow.schemaVersion !== undefined && workflow.schemaVersion !== "1") throw new WorkflowValidationError("unsupported workflow schema version");
  if (!/^[a-z][a-z0-9-]{1,62}$/.test(workflow.id)) throw new WorkflowValidationError("workflow ID must be a lowercase slug");
  if (workflow.title !== undefined && (typeof workflow.title !== "string" || !workflow.title.trim() || workflow.title.length > 120)) throw new WorkflowValidationError("workflow title must be non-empty and at most 120 characters");
  if (workflow.steps.length === 0) throw new WorkflowValidationError("workflow must contain at least one step");
  const byId = new Map<string, WorkflowStep>();
  for (const step of workflow.steps) {
    if (!/^[a-z][a-z0-9-]{0,62}$/.test(step.id) || byId.has(step.id)) throw new WorkflowValidationError(`invalid or duplicate workflow step ID: ${step.id}`);
    if (!["agent", "tool", "approval", "condition"].includes(step.kind)) throw new WorkflowValidationError(`invalid workflow step kind: ${step.kind}`);
    if (step.name !== undefined && (typeof step.name !== "string" || !step.name.trim() || step.name.length > 120)) throw new WorkflowValidationError(`invalid step name: ${step.id}`);
    if (step.agentId !== undefined && (typeof step.agentId !== "string" || !/^[a-z][a-z0-9-]{1,62}$/.test(step.agentId))) throw new WorkflowValidationError(`invalid agent ID: ${step.id}`);
    if (step.timeoutMinutes !== undefined && (!Number.isSafeInteger(step.timeoutMinutes) || step.timeoutMinutes < 1 || step.timeoutMinutes > 120)) throw new WorkflowValidationError(`invalid timeout for step: ${step.id}`);
    const knownPermissions = new Set<WorkflowPermission>(["workspace.read", "workspace.write", "network", "command.execute"]);
    if (step.permissions !== undefined && (!Array.isArray(step.permissions) || new Set(step.permissions).size !== step.permissions.length || step.permissions.some((permission) => !knownPermissions.has(permission)))) throw new WorkflowValidationError(`invalid permissions for step: ${step.id}`);
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
  step?: WorkflowStep;
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
      ? { idempotencyKey: `${workflow.id}:${workflowHash(workflow)}:${step.id}`, step }
      : { step };
    await executeStep(stepId, context);
  }
  return { status: "COMPLETED", order };
}

/** Executes the feature lifecycle and fails closed unless its final reviewer is independent and approved. */
export async function executeFeatureWorkflow(
  handlers: FeatureWorkflowHandlers,
  options: { dryRun: boolean; featureId?: string },
): Promise<WorkflowRunResult> {
  const workflow = createFeatureWorkflow(options.featureId);
  return executeWorkflow(workflow, async (stepId, context) => {
    if (stepId === "review") {
      const approval = await handlers.review(context);
      if (!isWorkflowApprovalSatisfied(approval)) {
        throw new WorkflowExecutionError("APPROVAL_REQUIRED", "feature workflow requires explicit approval from an independent reviewer");
      }
      return;
    }
    switch (stepId) {
      case "analyze": await handlers.analyze(context); return;
      case "plan": await handlers.plan(context); return;
      case "implement": await handlers.implement(context); return;
      case "test": await handlers.test(context); return;
      case "evidence": await handlers.evidence(context); return;
      default: throw new WorkflowValidationError(`unknown feature workflow step: ${stepId}`);
    }
  }, options);
}
