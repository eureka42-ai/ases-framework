import assert from "node:assert/strict";
import test from "node:test";
import { AgentAclError, createAgentMessageBus } from "./agent-protocol.js";

test("A2A messages require project-scoped exact ACL rules and arrive as untrusted data", () => {
  const acl = [
    { fromAgent: "planner", toAgent: "builder", projectId: "project-alpha", messageTypes: ["task.request"] as const },
    { fromAgent: "builder", toAgent: "planner", projectId: "project-alpha", messageTypes: ["task.result"] as const }
  ];
  const bus = createAgentMessageBus({ projectId: "project-alpha", agents: ["planner", "builder"], acl });
  const planner = bus.agent("planner");
  const builder = bus.agent("builder");
  assert.throws(() => builder.send("planner", "task.request", { operation: "unsafe" }), AgentAclError);
  assert.throws(() => planner.send("other-project-agent", "task.request", {}), AgentAclError);
  const outgoing = planner.send("builder", "task.request", { instruction: "run tests", metadata: { source: "user" } });
  assert.equal(outgoing.projectId, "project-alpha");
  const received = builder.receive();
  assert.equal(received?.trust, "untrusted-data");
  assert.deepEqual(received?.message.payload, { instruction: "run tests", metadata: { source: "user" } });
  assert.equal(builder.receive(), undefined);
});

test("A2A queues are isolated and enforce payload size, expiry, queue bounds and TTL", () => {
  let clock = 1_800_000_000_000;
  const bus = createAgentMessageBus({ projectId: "project-beta", agents: ["sender", "receiver"], acl: [{ fromAgent: "sender", toAgent: "receiver", projectId: "project-beta", messageTypes: ["context.request"] }], maxMessageBytes: 64, maxQueueSize: 1, now: () => clock });
  const sender = bus.agent("sender");
  const receiver = bus.agent("receiver");
  assert.throws(() => sender.send("receiver", "context.request", { data: "x".repeat(80) }), /byte limit/);
  assert.throws(() => sender.send("receiver", "context.request", {}, { ttlMs: 3_600_001 }), /TTL/);
  assert.throws(() => sender.send("receiver", "context.request", {}, { conversationId: "bad id" }), /conversation ID/);
  sender.send("receiver", "context.request", { request: "index" }, { ttlMs: 100 });
  assert.throws(() => sender.send("receiver", "context.request", { request: "second" }), /queue is full/);
  assert.equal(receiver.pending(), 1);
  clock += 101;
  assert.equal(receiver.pending(), 0);
  assert.equal(receiver.receive(), undefined);
  const otherProject = createAgentMessageBus({ projectId: "project-gamma", agents: ["sender", "receiver"], acl: [] });
  assert.equal(otherProject.agent("receiver").receive(), undefined);
});
