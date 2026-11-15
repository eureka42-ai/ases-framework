import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, realpath, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { authorizeCommand, commandPolicyResource, PolicyAccessError, SecurityPolicyEngine } from "./policy.js";

test("security policy defaults to deny and explicit deny overrides every allow", () => {
  assert.deepEqual(new SecurityPolicyEngine().evaluate({ actorId: "agent-a", action: "network", resource: "api.example.test" }), { allowed: false, reason: "default-deny" });
  const engine = new SecurityPolicyEngine([
    { effect: "allow", action: "workspace.write", resource: "src/generated.ts" },
    { effect: "allow", action: "workspace.write", actorId: "agent-a", resource: "src/generated.ts" },
    { effect: "deny", action: "workspace.write", actorId: "agent-a", resource: "src/generated.ts" },
  ]);
  assert.deepEqual(engine.evaluate({ actorId: "agent-a", action: "workspace.write", resource: "src/generated.ts" }), { allowed: false, reason: "explicit-deny" });
  assert.equal(engine.evaluate({ actorId: "agent-b", action: "workspace.write", resource: "src/generated.ts" }).allowed, true);
  assert.equal(engine.evaluate({ actorId: "agent-b", action: "workspace.write", resource: "src/secret.ts" }).allowed, false);
});

test("command policy requires an exact command signature and a workspace-contained cwd", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-command-policy-"));
  const executable = "git";
  const args = ["status", "--short"];
  const resource = commandPolicyResource(executable, args);
  const engine = new SecurityPolicyEngine([
    { effect: "allow", action: "command.execute" },
  ]);
  await assert.rejects(authorizeCommand(engine, { actorId: "dev", executable, args, workspaceRoot: workspace }), /command denied/);

  const exact = new SecurityPolicyEngine([{ effect: "allow", action: "command.execute", actorId: "dev", resource }]);
  const plan = await authorizeCommand(exact, { actorId: "dev", executable, args, workspaceRoot: workspace });
  assert.equal(plan.resource, resource);
  assert.equal(plan.cwd, await realpath(workspace));
  await assert.rejects(authorizeCommand(exact, { actorId: "dev", executable, args: ["status"], workspaceRoot: workspace }), /command denied/);
  await assert.rejects(authorizeCommand(exact, { actorId: "dev", executable, args, workspaceRoot: workspace, cwd: "../outside" }), PolicyAccessError);
});

test("command policy blocks shells and dynamic interpreter evaluation even with exact allow rules", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-command-block-"));
  for (const [executable, args] of [["bash", ["-c", "echo unsafe"]], ["node", ["--eval", "process.exit(1)"]], ["python3", ["-c", "print('unsafe')"]]] as const) {
    const resource = commandPolicyResource(executable, args);
    const engine = new SecurityPolicyEngine([{ effect: "allow", action: "command.execute", actorId: "dev", resource }]);
    await assert.rejects(authorizeCommand(engine, { actorId: "dev", executable, args, workspaceRoot: workspace }), /shell and dynamic code execution/);
  }
});

test("command policy rejects traversal arguments and symlinked working directories", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-command-paths-"));
  const outside = await mkdtemp(join(tmpdir(), "ases-command-outside-"));
  await symlink(outside, join(workspace, "linked"));
  const executable = "git";
  const args = ["status"];
  const resource = commandPolicyResource(executable, args);
  const engine = new SecurityPolicyEngine([{ effect: "allow", action: "command.execute", actorId: "dev", resource }]);
  await assert.rejects(authorizeCommand(engine, { actorId: "dev", executable, args: ["show", "../../outside"], workspaceRoot: workspace }), /traverse parent paths/);
  await assert.rejects(authorizeCommand(engine, { actorId: "dev", executable, args, workspaceRoot: workspace, cwd: "linked" }), /symbolic link/);
});
