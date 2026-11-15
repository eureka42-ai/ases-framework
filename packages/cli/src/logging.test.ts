import assert from "node:assert/strict";
import test from "node:test";
import { createSafeLogRecord, writeSafeLog } from "./logging.js";

test("safe logs redact credential and personal-data fields and secret-like text", () => {
  let written = "";
  const secret = "sk-test-abcdefghijklmnopqrstuvwxyz123456";
  const result = writeSafeLog((line) => { written = line; }, "provider.failure", {
    password: "correct horse battery staple",
    userEmail: "person@example.test",
    message: `request failed with token=${secret}; contact person@example.test`,
  }, new Date("2026-11-15T12:00:00.000Z"));
  assert.equal(written, result.line);
  assert.doesNotMatch(written, /correct horse|person@example\.test|sk-test-|token=/);
  assert.match(written, /\[REDACTED\]/);
  assert.ok(result.redactions >= 4);
  assert.equal(JSON.parse(written).timestamp, "2026-11-15T12:00:00.000Z");
});

test("safe logs omit error stacks, bound cycles/depth, and keep oversized records valid JSON", () => {
  const cyclic: Record<string, unknown> = { error: new Error("api_key=sk-private-abcdefghijklmnopqrstuvwxyz123456") };
  cyclic.self = cyclic;
  const result = createSafeLogRecord("runtime.warning", cyclic);
  assert.equal(JSON.parse(result.line).data.self, "[CIRCULAR]");
  assert.equal("stack" in JSON.parse(result.line).data.error, false);
  assert.doesNotMatch(result.line, /sk-private-/);

  const oversized = createSafeLogRecord("runtime.payload", { content: Array.from({ length: 100 }, () => "x".repeat(4_000)) });
  assert.deepEqual(JSON.parse(oversized.line).data, { truncated: true, reason: "log-size-limit" });
});
