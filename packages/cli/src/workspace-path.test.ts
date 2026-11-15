import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, realpath, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveToolPath, WorkspacePathError } from "./workspace-path.js";

test("tool paths stay within the canonical workspace by default", async () => {
  const root = await mkdtemp(join(tmpdir(), "ases-workspace-"));
  const outside = await mkdtemp(join(tmpdir(), "ases-outside-"));
  await mkdir(join(root, "src"));
  await writeFile(join(outside, "secret.txt"), "secret");
  await symlink(outside, join(root, "linked"));
  const canonicalRoot = await realpath(root);
  assert.equal(await resolveToolPath(root, "src/new.ts"), join(canonicalRoot, "src", "new.ts"));
  await assert.rejects(resolveToolPath(root, "../outside.txt"), WorkspacePathError);
  await assert.rejects(resolveToolPath(root, "linked/secret.txt"), WorkspacePathError);
  assert.equal(await resolveToolPath(root, join(outside, "secret.txt"), ["workspace.external"]), join(outside, "secret.txt"));
});
