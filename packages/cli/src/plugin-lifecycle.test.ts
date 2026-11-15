import assert from "node:assert/strict";
import test from "node:test";
import { lstat, mkdir, mkdtemp, readFile, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createPluginInstallManifest, removeInstalledPlugin } from "./plugin-lifecycle.js";
import { run } from "./index.js";

async function installFixture(workspace: string, files: Array<{ path: string; content: string }>) {
  const root = join(workspace, ".ases", "plugins", "fixture-plugin");
  await mkdir(root, { recursive: true });
  for (const file of files) {
    const target = join(root, file.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content);
  }
  const manifest = createPluginInstallManifest("fixture-plugin", files);
  await writeFile(join(root, "install-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return root;
}

test("plugin removal is a read-only plan by default and CLI applies only owned intact files", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-plugin-remove-"));
  const root = await installFixture(workspace, [{ path: "plugin.js", content: "owned" }]);
  await writeFile(join(root, "user-data.json"), "keep");
  const plan = await run(["plugin", "remove", "fixture-plugin", workspace, "--json"]);
  assert.equal(JSON.parse(plan.output).status, "planned");
  assert.equal(await readFile(join(root, "plugin.js"), "utf8"), "owned");
  const removed = await run(["plugin", "remove", "fixture-plugin", workspace, "--apply", "--json"]);
  assert.equal(JSON.parse(removed.output).status, "partial");
  await assert.rejects(readFile(join(root, "plugin.js")));
  assert.equal(await readFile(join(root, "user-data.json"), "utf8"), "keep");
  assert.ok(JSON.parse(await readFile(join(root, "install-manifest.json"), "utf8")));
});

test("plugin removal preserves modified and symlinked files and does not follow workspace symlinks", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-plugin-safe-"));
  const root = await installFixture(workspace, [
    { path: "modified.txt", content: "original" },
    { path: "safe.txt", content: "remove me" },
    { path: "linked.txt", content: "replace with link" },
  ]);
  await writeFile(join(root, "modified.txt"), "user edits");
  await writeFile(join(workspace, "outside.txt"), "outside data");
  await unlink(join(root, "linked.txt"));
  await symlink(join(workspace, "outside.txt"), join(root, "linked.txt"));
  const result = await removeInstalledPlugin(workspace, "fixture-plugin", true);
  assert.equal(result.status, "partial");
  assert.equal(await readFile(join(root, "modified.txt"), "utf8"), "user edits");
  assert.equal(await readFile(join(workspace, "outside.txt"), "utf8"), "outside data");
  await assert.rejects(readFile(join(root, "safe.txt")));
  assert.ok(result.preserve.length >= 2);
  const link = await mkdtemp(join(tmpdir(), "ases-plugin-link-"));
  await symlink(workspace, join(link, ".ases"));
  const blocked = await removeInstalledPlugin(link, "fixture-plugin", true);
  assert.equal(blocked.status, "partial");
  assert.equal(await readFile(join(workspace, "outside.txt"), "utf8"), "outside data");
});

test("plugin removal handles unmanaged IDs without deleting workspace files", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-plugin-unmanaged-"));
  assert.equal((await removeInstalledPlugin(workspace, "fixture-plugin", true)).status, "not-managed");
  assert.throws(() => createPluginInstallManifest("../outside", []), /invalid plugin install/);
});

test("plugin removal fails closed on a tampered manifest and removes a clean owned install", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-plugin-manifest-"));
  const tamperedRoot = await installFixture(workspace, [{ path: "plugin.js", content: "preserve me" }]);
  const manifestPath = join(tamperedRoot, "install-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.pluginId = "another-plugin";
  await writeFile(manifestPath, JSON.stringify(manifest));
  const tampered = await removeInstalledPlugin(workspace, "fixture-plugin", true);
  assert.equal(tampered.status, "partial");
  assert.equal(await readFile(join(tamperedRoot, "plugin.js"), "utf8"), "preserve me");

  const cleanWorkspace = await mkdtemp(join(tmpdir(), "ases-plugin-clean-"));
  const cleanRoot = await installFixture(cleanWorkspace, [{ path: "nested/plugin.js", content: "owned" }]);
  const clean = await removeInstalledPlugin(cleanWorkspace, "fixture-plugin", true);
  assert.equal(clean.status, "removed");
  await assert.rejects(readFile(cleanRoot));
  assert.equal((await lstat(join(cleanWorkspace, ".ases"))).isDirectory(), true);
  assert.equal((await lstat(join(cleanWorkspace, ".ases", "plugins"))).isDirectory(), true);
});
