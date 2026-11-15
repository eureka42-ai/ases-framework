import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createContextBundle, forgetMemory, inspectMemory, remember, verifyContextBundle } from "./memory.js";

test("memory requires consent and retains scope, TTL, origin and inspectable content", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-memory-"));
  await assert.rejects(remember(workspace, { scope: "project", value: "preference", ttlMs: 60_000, consent: false, origin: { kind: "user", reference: "conversation-1" } }), /explicit consent/);
  const entry = await remember(workspace, { id: "project-pref", scope: "project", value: "Use TypeScript", ttlMs: 60_000, consent: true, origin: { kind: "user-confirmed", reference: "decision-42" } });
  assert.equal(entry.consent, true);
  assert.equal(entry.scope, "project");
  assert.equal(entry.origin.reference, "decision-42");
  assert.ok(Date.parse(entry.expiresAt) > Date.parse(entry.createdAt));
  assert.deepEqual((await inspectMemory(workspace, "project")).map((item) => item.id), ["project-pref"]);
  assert.deepEqual(await inspectMemory(workspace, "session"), []);
});

test("memory hides expired entries and deletion removes data from disk", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-memory-delete-"));
  const entry = await remember(workspace, { id: "expire-pref", scope: "session", value: "temporary preference", ttlMs: 60_000, consent: true, origin: { kind: "user", reference: "session-7" } });
  const path = join(workspace, ".ases", "memory", "session", "expire-pref.json");
  const expired = { ...entry, expiresAt: new Date(Date.now() - 1_000).toISOString() };
  await writeFile(path, `${JSON.stringify(expired)}\n`);
  assert.deepEqual(await inspectMemory(workspace, "session"), []);
  assert.equal((await inspectMemory(workspace, "session", { includeExpired: true })).length, 1);
  assert.equal(await forgetMemory(workspace, "session", "expire-pref"), true);
  await assert.rejects(readFile(path), { code: "ENOENT" });
  assert.equal(await forgetMemory(workspace, "session", "expire-pref"), false);
});

test("ContextBundle exports selected records, redacts secrets, and detects tampering", () => {
  const content = "The service uses api_key=sk-test-abcdefghijklmnopqrstuvwxyz123456 and must rotate it.";
  const bundle = createContextBundle({
    projectId: "customer-portal",
    decisions: [{ id: "decision-1", title: "API credentials", content, source: { path: "docs/decision.md", sha256: createHash("sha256").update(content).digest("hex") } }],
    requirements: [],
    checkpoints: [],
  });
  assert.equal(bundle.redactions, 1);
  assert.doesNotMatch(bundle.decisions[0]!.content, /sk-test-/);
  assert.match(bundle.decisions[0]!.content, /\[REDACTED\]/);
  assert.equal(verifyContextBundle(bundle), true);
  const tampered = structuredClone(bundle);
  tampered.decisions[0]!.content += " tampered";
  assert.equal(verifyContextBundle(tampered), false);
  assert.throws(() => createContextBundle({
    projectId: "customer-portal",
    decisions: [{ id: "decision-2", title: "Bad source", content, source: { path: "docs/decision.md", sha256: "0".repeat(64) } }],
    requirements: [], checkpoints: [],
  }), /source hash mismatch/);
});
