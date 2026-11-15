import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";

async function cli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const child = spawn(process.execPath, [join(process.cwd(), "packages/cli/dist/bin.js"), ...args], { stdio: "pipe" });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
  const code = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (value) => resolve(value ?? -1));
  });
  return { code, stdout, stderr };
}
const sha256 = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

test("CLI end-to-end initializes, executes, installs, updates and uninstalls a host integration", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-e2e-"));
  const custom = join(workspace, "user-notes.md");
  await writeFile(custom, "Keep this project data.\n");

  const version = await cli(["--version"]);
  assert.equal(version.code, 0);
  assert.match(version.stdout, /^0\.1\.0-rc\.1/);

  const init = await cli(["init", workspace, "--json"]);
  assert.equal(init.code, 0, init.stderr);
  assert.equal(JSON.parse(init.stdout).status, "initialized");

  const install = await cli(["host", "apply", "claude-code", workspace, "--apply", "--json"]);
  assert.equal(install.code, 0, install.stderr);
  assert.equal(JSON.parse(install.stdout).status, "installed");
  const manifestPath = join(workspace, ".ases", "host-install-claude-code.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const ownedEntry = manifest.files.find((file: { owned: boolean }) => file.owned);
  const installedPath = join(workspace, ownedEntry.path);
  assert.match(await readFile(installedPath, "utf8"), /Eureka42/);

  const previous = "EUREKA42 ASES — installed version 0\n";
  await writeFile(installedPath, previous);
  ownedEntry.sha256 = sha256(previous);
  const manifestBase = { format: manifest.format, schemaVersion: manifest.schemaVersion, host: manifest.host, files: manifest.files, directories: manifest.directories, asesDirectoryCreated: manifest.asesDirectoryCreated };
  manifest.manifestSha256 = sha256(JSON.stringify(manifestBase));
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const update = await cli(["host", "update", "claude-code", workspace, "--apply", "--json"]);
  assert.equal(update.code, 0, update.stderr);
  assert.equal(JSON.parse(update.stdout).status, "updated");
  const updateResult = JSON.parse(update.stdout);
  assert.ok(updateResult.backups.length > 0);
  assert.equal(await readFile(join(workspace, updateResult.backups[0]), "utf8"), previous);

  const uninstall = await cli(["host", "uninstall", "claude-code", workspace, "--apply", "--json"]);
  assert.equal(uninstall.code, 0, uninstall.stderr);
  assert.equal(JSON.parse(uninstall.stdout).status, "uninstalled");
  assert.equal(await readFile(custom, "utf8"), "Keep this project data.\n");
  assert.equal(JSON.parse(await readFile(join(workspace, ".ases", "config.json"), "utf8")).project.name, basename(workspace));
  await assert.rejects(readFile(installedPath));
});
