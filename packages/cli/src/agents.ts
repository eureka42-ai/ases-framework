export type AgentPermission = "workspace.read" | "workspace.write" | "network" | "command.execute";

export interface AgentBudget {
  maxSteps: number;
  maxDurationMs: number;
  maxTokens: number;
  maxCostUsd: number;
}

export interface AgentDeclaration {
  id: string;
  permissions: readonly AgentPermission[];
  budget: AgentBudget;
  contextPaths: readonly string[];
}

export class AgentDeclarationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentDeclarationError";
  }
}

export class AgentWriteConflictError extends Error {
  constructor(readonly path: string, readonly agents: readonly string[]) {
    super(`agents ${agents.join(", ")} both claim write access to ${path}`);
    this.name = "AgentWriteConflictError";
  }
}

function isSafeRelativePath(path: string): boolean {
  return path.length > 0 && !path.startsWith("/") && !path.includes("\\") && path.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

/** Validates an agent's declared authority and resource limits. */
export function createAgentDeclaration(declaration: AgentDeclaration): AgentDeclaration {
  if (!/^[a-z][a-z0-9-]{1,62}$/.test(declaration.id)) throw new AgentDeclarationError("agent id must be a lowercase slug");
  const permissions = new Set<AgentPermission>(["workspace.read", "workspace.write", "network", "command.execute"]);
  if (declaration.permissions.some((permission) => !permissions.has(permission)) || new Set(declaration.permissions).size !== declaration.permissions.length) {
    throw new AgentDeclarationError("agent permissions must be known and unique");
  }
  const { maxSteps, maxDurationMs, maxTokens, maxCostUsd } = declaration.budget;
  if (![maxSteps, maxDurationMs, maxTokens].every((value) => Number.isSafeInteger(value) && value > 0) || !Number.isFinite(maxCostUsd) || maxCostUsd < 0) {
    throw new AgentDeclarationError("agent budget must use positive integer limits and a non-negative finite cost");
  }
  if (new Set(declaration.contextPaths).size !== declaration.contextPaths.length || declaration.contextPaths.some((path) => !isSafeRelativePath(path))) {
    throw new AgentDeclarationError("agent context paths must be safe, relative and unique");
  }
  return {
    ...declaration,
    permissions: [...declaration.permissions],
    budget: { ...declaration.budget },
    contextPaths: [...declaration.contextPaths],
  };
}

/** Returns only files explicitly named by the agent's context allowlist. */
export function selectAgentContext(declaration: AgentDeclaration, availableFiles: Readonly<Record<string, string>>): Record<string, string> {
  const selected: Record<string, string> = {};
  for (const path of declaration.contextPaths) {
    if (Object.hasOwn(availableFiles, path)) selected[path] = availableFiles[path]!;
  }
  return selected;
}

/** Uses parallel execution only when explicitly available; otherwise preserves order and stops on failure. */
export async function runAgentTasks<T>(tasks: readonly (() => Promise<T>)[], parallelismAvailable: boolean): Promise<T[]> {
  if (parallelismAvailable) return Promise.all(tasks.map((task) => task()));
  const results: T[] = [];
  for (const task of tasks) results.push(await task());
  return results;
}

/** Requires a distinct non-empty reviewer identity before approval can be recorded. */
export function assertIndependentReviewer(authorId: string, reviewerId: string): { authorId: string; reviewerId: string } {
  const author = authorId.trim();
  const reviewer = reviewerId.trim();
  if (!author || !reviewer) throw new AgentDeclarationError("author and reviewer identities are required");
  if (author.toLocaleLowerCase("en-US") === reviewer.toLocaleLowerCase("en-US")) {
    throw new AgentDeclarationError("a change author cannot approve their own review");
  }
  return { authorId: author, reviewerId: reviewer };
}

export interface ClaimedAgentTask<T> {
  id: string;
  writes: readonly string[];
  run: () => Promise<T>;
}

/** Validates all write claims before dispatching any agent task. */
export async function runClaimedAgentTasks<T>(tasks: readonly ClaimedAgentTask<T>[], parallelismAvailable: boolean): Promise<T[]> {
  const paths = new Map<string, string>();
  const ids = new Set<string>();
  for (const task of tasks) {
    if (!task.id.trim() || ids.has(task.id)) throw new AgentDeclarationError("agent task IDs must be non-empty and unique");
    ids.add(task.id);
    for (const path of task.writes) {
      if (!isSafeRelativePath(path)) throw new AgentDeclarationError("agent write claims must use safe relative paths");
      const owner = paths.get(path);
      if (owner && owner !== task.id) throw new AgentWriteConflictError(path, [owner, task.id]);
      paths.set(path, task.id);
    }
  }
  return runAgentTasks(tasks.map((task) => task.run), parallelismAvailable);
}
