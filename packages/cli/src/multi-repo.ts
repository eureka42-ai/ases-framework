import { realpath } from "node:fs/promises";
import { isAbsolute, relative, sep } from "node:path";
import { resolveToolPath } from "./workspace-path.js";

export type RepositoryRole = "reader" | "contributor" | "admin";
export type RepositoryOperation = "read" | "write" | "admin";
export interface RepositoryDefinition { organizationId: string; repositoryId: string; root: string }
export interface RepositoryMembership { principalId: string; organizationId: string; repositoryId: string; role: RepositoryRole }
export interface AuthorizedRepository { organizationId: string; repositoryId: string; root: string; path: string; operation: RepositoryOperation; role: RepositoryRole }

const identifier = (value: string) => /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,127}$/.test(value);
const inside = (root: string, candidate: string) => {
  const rel = relative(root, candidate);
  return rel === "" || (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`));
};

/** Builds an immutable multi-organization repository registry with exact per-repo memberships. */
export async function createRepositoryRegistry(definitions: readonly RepositoryDefinition[], memberships: readonly RepositoryMembership[]) {
  const roots = new Map<string, string>();
  const keys = new Set<string>();
  for (const definition of definitions) {
    if (!identifier(definition.organizationId) || !identifier(definition.repositoryId)) throw new Error("invalid organization or repository ID");
    const key = `${definition.organizationId}/${definition.repositoryId}`;
    if (keys.has(key)) throw new Error(`duplicate repository: ${key}`);
    keys.add(key);
    roots.set(key, await realpath(definition.root));
  }
  const entries = [...roots.entries()];
  for (let left = 0; left < entries.length; left += 1) for (let right = left + 1; right < entries.length; right += 1) {
    const leftRoot = entries[left]![1];
    const rightRoot = entries[right]![1];
    if (inside(leftRoot, rightRoot) || inside(rightRoot, leftRoot)) throw new Error("repository roots must be disjoint to prevent cross-repository path access");
  }
  const allowedRoles = new Set<RepositoryRole>(["reader", "contributor", "admin"]);
  const memberRoles = new Map<string, RepositoryRole>();
  for (const member of memberships) {
    const key = `${member.organizationId}/${member.repositoryId}`;
    if (!identifier(member.principalId) || !roots.has(key) || !allowedRoles.has(member.role)) throw new Error("invalid membership; principal, repository and role must be explicit");
    const memberKey = `${member.principalId}\0${key}`;
    if (memberRoles.has(memberKey)) throw new Error(`duplicate membership: ${member.principalId} on ${key}`);
    memberRoles.set(memberKey, member.role);
  }

  function roleFor(principalId: string, organizationId: string, repositoryId: string): RepositoryRole {
    if (!identifier(principalId)) throw new Error("invalid principal ID");
    const role = memberRoles.get(`${principalId}\0${organizationId}/${repositoryId}`);
    if (!role || !roots.has(`${organizationId}/${repositoryId}`)) throw new Error("repository access denied");
    return role;
  }

  return {
    listRepositories(principalId: string, organizationId: string): Array<{ organizationId: string; repositoryId: string; role: RepositoryRole }> {
      if (!identifier(organizationId) || !identifier(principalId)) return [];
      return [...roots.keys()].filter((key) => key.startsWith(`${organizationId}/`)).flatMap((key) => {
        const repositoryId = key.slice(organizationId.length + 1);
        const role = memberRoles.get(`${principalId}\0${key}`);
        return role ? [{ organizationId, repositoryId, role }] : [];
      });
    },
    async authorize(principalId: string, organizationId: string, repositoryId: string, operation: RepositoryOperation, requestedPath = "."): Promise<AuthorizedRepository> {
      const role = roleFor(principalId, organizationId, repositoryId);
      const permitted = operation === "read" || (operation === "write" && role !== "reader") || (operation === "admin" && role === "admin");
      if (!permitted) throw new Error("repository access denied");
      const root = roots.get(`${organizationId}/${repositoryId}`)!;
      const path = await resolveToolPath(root, requestedPath);
      const physical = await realpath(path).catch(async (error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
        return root;
      });
      if (!inside(root, physical)) throw new Error("repository path escapes its organization/repository boundary");
      return { organizationId, repositoryId, root, path, operation, role };
    }
  };
}
