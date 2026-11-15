import assert from "node:assert/strict";
import { mkdir, mkdtemp, realpath, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createRepositoryRegistry } from "./multi-repo.js";

test("repository registry isolates organization memberships and enforces role-based operations", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-multirepo-"));
  const repoA = join(root, "org-a", "api");
  const repoB = join(root, "org-b", "api");
  await mkdir(repoA, { recursive: true });
  await mkdir(repoB, { recursive: true });
  const registry = await createRepositoryRegistry([
    { organizationId: "org-a", repositoryId: "api", root: repoA },
    { organizationId: "org-b", repositoryId: "api", root: repoB }
  ], [
    { principalId: "alice", organizationId: "org-a", repositoryId: "api", role: "reader" },
    { principalId: "bob", organizationId: "org-a", repositoryId: "api", role: "contributor" },
    { principalId: "owner", organizationId: "org-b", repositoryId: "api", role: "admin" }
  ]);
  assert.equal((await registry.authorize("alice", "org-a", "api", "read")).root, await realpath(repoA));
  await assert.rejects(registry.authorize("alice", "org-a", "api", "write"), /denied/);
  assert.equal((await registry.authorize("bob", "org-a", "api", "write", "src/new.ts")).repositoryId, "api");
  await assert.rejects(registry.authorize("alice", "org-b", "api", "read"), /denied/);
  assert.deepEqual(registry.listRepositories("alice", "org-a").map((item) => item.repositoryId), ["api"]);
  assert.deepEqual(registry.listRepositories("alice", "org-b"), []);
});

test("repository roots must be disjoint and canonical workspace resolution rejects escapes", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-multirepo-paths-"));
  const parent = join(root, "parent");
  const child = join(parent, "child");
  await mkdir(child, { recursive: true });
  await assert.rejects(createRepositoryRegistry([
    { organizationId: "org-a", repositoryId: "parent", root: parent },
    { organizationId: "org-a", repositoryId: "child", root: child }
  ], []), /roots must be disjoint/);
  const workspace = join(root, "workspace");
  const outside = join(root, "outside");
  await mkdir(workspace);
  await mkdir(outside);
  await symlink(outside, join(workspace, "linked"));
  const registry = await createRepositoryRegistry([{ organizationId: "org-a", repositoryId: "repo", root: workspace }], [{ principalId: "reader", organizationId: "org-a", repositoryId: "repo", role: "reader" }]);
  await assert.rejects(registry.authorize("reader", "org-a", "repo", "read", "../outside"), /escapes/);
  await assert.rejects(registry.authorize("reader", "org-a", "repo", "read", "linked/secret.txt"), /symbolic link/);
});
