import assert from "node:assert/strict";
import test from "node:test";
import { createSupportLedger, type SlaPolicy } from "./support-ledger.js";

const policy: SlaPolicy = {
  P1: { firstResponseMinutes: 5, resolutionMinutes: 30 },
  P2: { firstResponseMinutes: 15, resolutionMinutes: 120 },
  P3: { firstResponseMinutes: 60, resolutionMinutes: 480 },
  P4: { firstResponseMinutes: 240, resolutionMinutes: 1_440 },
};

test("support ledger measures SLA deadlines and records valid incident transitions", () => {
  let now = new Date("2026-11-15T12:00:00.000Z");
  const ledger = createSupportLedger(policy, () => new Date(now));
  const opened = ledger.open({ title: "Production API unavailable", severity: "P1", actorId: "oncall@example.test" });
  assert.equal(opened.firstResponseDeadline, "2026-11-15T12:05:00.000Z");
  assert.equal(opened.resolutionDeadline, "2026-11-15T12:30:00.000Z");
  now = new Date("2026-11-15T12:04:00.000Z");
  assert.equal(ledger.get(opened.id)?.firstResponseBreached, false);
  const acknowledged = ledger.acknowledge(opened.id, "responder");
  assert.equal(acknowledged.status, "ACKNOWLEDGED");
  assert.equal(acknowledged.firstResponseElapsedMs, 4 * 60_000);
  now = new Date("2026-11-15T12:31:00.000Z");
  assert.equal(ledger.get(opened.id)?.resolutionBreached, true);
  const resolved = ledger.resolve(opened.id, "resolver");
  assert.equal(resolved.status, "RESOLVED");
  assert.equal(resolved.resolutionBreached, true);
  assert.deepEqual(resolved.events.map(({ type }) => type), ["OPENED", "ACKNOWLEDGED", "RESOLVED"]);
  assert.throws(() => ledger.acknowledge(opened.id, "responder"), /transition not allowed/);
  assert.throws(() => ledger.resolve(opened.id, "resolver"), /transition not allowed/);
});

test("support ledger validates SLA policies and returns detached incident snapshots", () => {
  assert.throws(() => createSupportLedger({ ...policy, P2: { firstResponseMinutes: 30, resolutionMinutes: 10 } }), /cannot exceed/);
  assert.throws(() => createSupportLedger({ P1: policy.P1 } as SlaPolicy), /must define/);
  const ledger = createSupportLedger(policy, () => new Date("2026-11-15T12:00:00.000Z"));
  const opened = ledger.open({ title: "Customer report", severity: "P2", actorId: "support" });
  opened.events.push({ type: "RESOLVED", at: "2026-11-15T12:00:00.000Z", actorId: "forged" });
  assert.equal(ledger.get(opened.id)?.events.length, 1);
  assert.throws(() => ledger.open({ title: " ", severity: "P2", actorId: "support" }), /required and bounded/);
});
