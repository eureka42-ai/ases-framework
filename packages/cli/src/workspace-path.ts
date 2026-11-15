import { realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

export class WorkspacePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspacePathError";
  }
}

function isInside(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === "" || (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`));
}

/** Resolves a tool path and checks its real existing ancestor against the canonical workspace. */
export async function resolveToolPath(workspaceRoot: string, requestedPath: string, permissions: readonly string[] = []): Promise<string> {
  const root = await realpath(workspaceRoot);
  const candidate = resolve(root, requestedPath);
  if (permissions.includes("workspace.external")) return candidate;
  if (!isInside(root, candidate)) throw new WorkspacePathError("tool path escapes the workspace");

  let existingAncestor = candidate;
  while (true) {
    try {
      const physical = await realpath(existingAncestor);
      if (!isInside(root, physical)) throw new WorkspacePathError("tool path resolves outside the workspace through a symbolic link");
      return candidate;
    } catch (error) {
      if (error instanceof WorkspacePathError) throw error;
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const parent = dirname(existingAncestor);
      if (parent === existingAncestor) throw new WorkspacePathError("tool path has no existing workspace ancestor");
      existingAncestor = parent;
    }
  }
}
