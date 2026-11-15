import assert from "node:assert/strict";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { run } from "./index.js";
import { commandPolicyResource } from "./policy.js";
import { createTeamPolicyEngine, readTeamPolicyFile, teamPolicyTemplate, validateTeamPolicy } from "./team-policy.js";

test("team policy is strict, versioned and deny-by-default", () => {
  const valid = {
    schemaVersion: "1", defaultEffect: "deny",
    rules: [{ id: "read-requirements", effect: "allow", action: "tool.execute", actorId: "dev-agent", resource: "requirements_list", rationale: "Permit the project agent to read the requirements catalog." }],
  };
  const validation = validateTeamPolicy(valid);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  const engine = createTeamPolicyEngine(valid);
  assert.deepEqual(engine.evaluate({ actorId: "dev-agent", action: "tool.execute", resource: "requirements_list" }), { allowed: true, reason: "explicit-allow" });
  assert.deepEqual(engine.evaluate({ actorId: "other-agent", action: "tool.execute", resource: "requirements_list" }), { allowed: false, reason: "default-deny" });
  assert.deepEqual(createTeamPolicyEngine(teamPolicyTemplate).evaluate({ actorId: "dev-agent", action: "network", resource: "api.example" }), { allowed: false, reason: "default-deny" });
});

test("team policy rejects ambiguous, broad or malformed rules and explains deny precedence", () => {
  const invalid = validateTeamPolicy({
    schemaVersion: "1", defaultEffect: "allow", extra: true,
    rules: [
      { id: "too-broad", effect: "allow", action: "workspace.write", rationale: "This rule is intentionally too broad." },
      { id: "too-broad", effect: "deny", action: "network", actorId: "*", rationale: "This duplicate actor rule is invalid." },
      { id: "cmd", effect: "allow", action: "command.execute", actorId: "dev", rationale: "Command rule lacks exact command resource." },
    ],
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.some((error) => error.includes("defaultEffect")));
  assert.ok(invalid.errors.some((error) => error.includes("unknown policy property")));
  assert.ok(invalid.errors.some((error) => error.includes("allow rules must scope")));
  assert.ok(invalid.errors.some((error) => error.includes("id must be valid and unique")));
  assert.ok(invalid.errors.some((error) => error.includes("actorId is invalid")));
  assert.ok(invalid.errors.some((error) => error.includes("exact command resource")));

  const conflict = validateTeamPolicy({
    schemaVersion: "1", defaultEffect: "deny",
    rules: [
      { id: "allow-read", effect: "allow", action: "workspace.read", actorId: "agent", rationale: "Allow this agent to read project files." },
      { id: "deny-read", effect: "deny", action: "workspace.read", actorId: "agent", rationale: "Deny this agent access to project files." },
    ],
  });
  assert.equal(conflict.valid, true);
  assert.equal(conflict.warnings.length, 1);
  assert.equal(createTeamPolicyEngine(conflict.policy).evaluate({ actorId: "agent", action: "workspace.read", resource: "README.md" }).reason, "explicit-deny");

  const command = validateTeamPolicy({ schemaVersion: "1", defaultEffect: "deny", rules: [{ id: "git-status", effect: "allow", action: "command.execute", actorId: "dev", resource: commandPolicyResource("git", ["status", "--short"]), rationale: "Allow an exact read-only Git status invocation." }] });
  assert.equal(command.valid, true);
});

test("policy file reader rejects symlinks and oversized files", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-team-policy-"));
  const outside = await mkdtemp(join(tmpdir(), "ases-team-policy-outside-"));
  try {
    const policyPath = join(workspace, "policy.json");
    await writeFile(join(outside, "policy.json"), JSON.stringify(teamPolicyTemplate));
    await symlink(join(outside, "policy.json"), policyPath);
    await assert.rejects(readTeamPolicyFile(policyPath), /regular file/);
    await rm(policyPath);
    await writeFile(policyPath, " ".repeat(1024 * 1024 + 1));
    await assert.rejects(readTeamPolicyFile(policyPath), /1 MiB/);
  } finally {
    await rm(workspace, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("policy CLI prints a template, validates a file and evaluates without executing actions", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-policy-cli-"));
  try {
    const template = await run(["policy", "template"]);
    assert.equal(template.exitCode, 0);
    assert.equal(JSON.parse(template.output).defaultEffect, "deny");
    const path = join(workspace, "policy.json");
    const document = { schemaVersion: "1", defaultEffect: "deny", rules: [{ id: "read-docs", effect: "allow", action: "workspace.read", actorId: "review-agent", resource: "docs/README.md", rationale: "Permit the reviewer to inspect approved documentation." }] };
    await writeFile(path, JSON.stringify(document));
    const validation = await run(["policy", "validate", path, "--json"]);
    assert.equal(validation.exitCode, 0);
    assert.equal(JSON.parse(validation.output).valid, true);
    const evaluation = await run(["policy", "evaluate", path, "--actor", "review-agent", "--action", "workspace.read", "--resource", "docs/README.md", "--json"]);
    assert.equal(evaluation.exitCode, 0);
    assert.equal(JSON.parse(evaluation.output).decision.allowed, true);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
