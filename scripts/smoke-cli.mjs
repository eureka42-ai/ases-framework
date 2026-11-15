import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../packages/cli/dist/bin.js", import.meta.url));
const invoke = (...args) => execFileSync(process.execPath, [cliPath, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
assert.match(invoke("--version"), /^0\.1\.0-rc\.1/);
assert.match(invoke("welcome", "--no-color"), /EUREKA42/);
const workspace = await mkdtemp(join(tmpdir(), "ases-ci-smoke-"));
try {
  const result = JSON.parse(invoke("init", workspace, "--json"));
  assert.equal(result.status, "initialized");
  const config = JSON.parse(await readFile(join(workspace, ".ases", "config.json"), "utf8"));
  assert.equal(config.project.privacy, "local-only");
  process.stdout.write("PASS CLI smoke (version, brand, init)\n");
} finally {
  await rm(workspace, { recursive: true, force: true });
}
