import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { run } from "./index.js";
import { checkArchitectureContracts } from "./architecture-contracts.js";

test("repository ADR contracts report verified matches as observe-only while ADRs are proposed", async () => {
  const report = await checkArchitectureContracts(process.cwd());
  assert.equal(report.status, "CLEAN");
  assert.equal(report.summary.contracts, 2);
  assert.equal(report.summary.assertions, 7);
  assert.equal(report.summary.passed, 7);
  assert.equal(report.summary.drift, 0);
  assert.ok(report.contracts.every((contract) => contract.adrStatus === "PROPOSED" && contract.enforcement === "observe-only"));
  const cli = await run(["architecture", "check", process.cwd(), "--json"]);
  assert.equal(cli.exitCode, 0);
  assert.equal(JSON.parse(cli.output).status, "CLEAN");
});

test("accepted ADR contract drift fails the CLI without exposing observed values", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-architecture-drift-"));
  try {
    await mkdir(join(workspace, "docs", "adr"), { recursive: true });
    await writeFile(join(workspace, "docs", "adr", "ADR-010-sample.md"), "# ADR-010 — Sample\n\nStatus: ACCEPTED\n");
    await writeFile(join(workspace, "package.json"), JSON.stringify({ type: "commonjs", secret: "private-value" }));
    const contractsPath = join(workspace, "contracts.json");
    await writeFile(contractsPath, JSON.stringify({ schemaVersion: "1", contracts: [{ id: "module-type", adrId: "ADR-010", adrPath: "docs/adr/ADR-010-sample.md", assertions: [{ id: "esm", kind: "json-pointer-equals", path: "package.json", pointer: "/type", expected: "module" }] }] }));
    const result = await run(["architecture", "check", workspace, "--contracts", "contracts.json", "--json"]);
    assert.equal(result.exitCode, 1);
    const report = JSON.parse(result.output);
    assert.equal(report.status, "DRIFT");
    assert.equal(report.summary.enforcedDrift, 1);
    assert.equal(report.contracts[0].assertions[0].status, "DRIFT");
    assert.equal(result.output.includes("commonjs"), false);
    assert.equal(result.output.includes("private-value"), false);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("proposed ADR drift is visible but remains observational", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-architecture-proposed-"));
  try {
    await mkdir(join(workspace, "docs", "adr"), { recursive: true });
    await writeFile(join(workspace, "docs", "adr", "ADR-011-sample.md"), "# ADR-011 — Sample\n\nStatus: PROPOSED\n");
    await writeFile(join(workspace, "settings.json"), JSON.stringify({ type: "commonjs" }));
    await writeFile(join(workspace, "contracts.json"), JSON.stringify({ schemaVersion: "1", contracts: [{ id: "module-type", adrId: "ADR-011", adrPath: "docs/adr/ADR-011-sample.md", assertions: [{ id: "esm", kind: "json-pointer-equals", path: "settings.json", pointer: "/type", expected: "module" }] }] }));
    const report = await checkArchitectureContracts(workspace, "contracts.json");
    assert.equal(report.status, "CLEAN");
    assert.equal(report.summary.drift, 1);
    assert.equal(report.summary.enforcedDrift, 0);
    assert.equal(report.contracts[0]?.enforcement, "observe-only");
    assert.equal(report.contracts[0]?.assertions[0]?.status, "DRIFT");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("architecture contracts reject traversal and mark symlink evidence unverifiable", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-architecture-symlink-"));
  const outside = await mkdtemp(join(tmpdir(), "ases-architecture-outside-"));
  try {
    await mkdir(join(workspace, "docs", "adr"), { recursive: true });
    await writeFile(join(workspace, "docs", "adr", "ADR-012-sample.md"), "# ADR-012 — Sample\n\nStatus: ACCEPTED\n");
    await writeFile(join(outside, "config.json"), JSON.stringify({ mode: "offline" }));
    await symlink(join(outside, "config.json"), join(workspace, "config.json"));
    await writeFile(join(workspace, "contracts.json"), JSON.stringify({ schemaVersion: "1", contracts: [{ id: "offline-mode", adrId: "ADR-012", adrPath: "docs/adr/ADR-012-sample.md", assertions: [{ id: "mode", kind: "json-pointer-equals", path: "config.json", pointer: "/mode", expected: "offline" }] }] }));
    const report = await checkArchitectureContracts(workspace, "contracts.json");
    assert.equal(report.status, "UNVERIFIABLE");
    assert.equal(report.summary.enforcedUnverifiable, 1);
    await assert.rejects(checkArchitectureContracts(workspace, "../outside/contracts.json"), /workspace-relative/);
    const cli = await run(["architecture", "check", workspace, "--contracts", "contracts.json", "--json"]);
    assert.equal(cli.exitCode, 2);
  } finally {
    await rm(workspace, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
