import assert from "node:assert/strict";
import test from "node:test";
import { createR2BackupObjectStore, decryptBackup, deleteEncryptedBackup, encryptBackup, downloadEncryptedBackup, uploadEncryptedBackup, type EncryptedBackupObjectStore, type R2BucketBinding } from "./encrypted-backup.js";

const passphrase = "correct horse battery staple 2026";
const plaintext = new TextEncoder().encode("private ASES catalog and project data");

test("AES-GCM backup envelopes round-trip without exposing plaintext and use fresh nonces", async () => {
  const [first, second] = await Promise.all([encryptBackup(plaintext, passphrase), encryptBackup(plaintext, passphrase)]);
  assert.equal(new TextDecoder().decode(await decryptBackup(first, passphrase)), new TextDecoder().decode(plaintext));
  assert.notEqual(new TextDecoder().decode(first), new TextDecoder().decode(plaintext));
  assert.notEqual(new TextDecoder().decode(first), new TextDecoder().decode(second));
  const envelope = JSON.parse(new TextDecoder().decode(first));
  assert.equal(envelope.format, "eureka42-encrypted-backup");
  assert.equal(envelope.algorithm, "AES-256-GCM");
  assert.equal(envelope.kdf, "PBKDF2-SHA256");
  assert.equal(envelope.iterations, 600_000);
});

test("wrong passphrases and ciphertext/header tampering fail authentication", async () => {
  const encrypted = await encryptBackup(plaintext, passphrase);
  await assert.rejects(decryptBackup(encrypted, "another sufficiently long passphrase"), /authentication failed/);
  const envelope = JSON.parse(new TextDecoder().decode(encrypted));
  envelope.ciphertext = `${envelope.ciphertext.slice(0, -4)}AAAA`;
  await assert.rejects(decryptBackup(new TextEncoder().encode(JSON.stringify(envelope)), passphrase), /authentication failed/);
  const alteredHeader = JSON.parse(new TextDecoder().decode(encrypted));
  alteredHeader.encryptedAt = "2026-01-01T00:00:00.000Z";
  await assert.rejects(decryptBackup(new TextEncoder().encode(JSON.stringify(alteredHeader)), passphrase), /authentication failed/);
});

test("cloud backup sync is explicit and writes encrypted bytes only", async () => {
  const objects = new Map<string, Uint8Array>();
  const calls: string[] = [];
  const store: EncryptedBackupObjectStore = {
    async put(key, data) { calls.push(`put:${key}`); objects.set(key, data); },
    async get(key) { calls.push(`get:${key}`); return objects.get(key); },
    async delete(key) { calls.push(`delete:${key}`); objects.delete(key); },
  };
  await assert.rejects(uploadEncryptedBackup(store, plaintext, { enabled: false, objectKey: "backups/user/latest", passphrase }), /enabled: true/);
  await assert.rejects(downloadEncryptedBackup(store, { enabled: false, objectKey: "backups/user/latest", passphrase }), /enabled: true/);
  await assert.rejects(deleteEncryptedBackup(store, { enabled: false, objectKey: "backups/user/latest" }), /enabled: true/);
  assert.deepEqual(calls, []);
  const uploaded = await uploadEncryptedBackup(store, plaintext, { enabled: true, objectKey: "backups/user/latest", passphrase });
  assert.ok(uploaded.encryptedBytes > plaintext.byteLength);
  assert.equal(new TextDecoder().decode(objects.get("backups/user/latest")).includes("private ASES"), false);
  assert.deepEqual(await downloadEncryptedBackup(store, { enabled: true, objectKey: uploaded.objectKey, passphrase }), plaintext);
  await deleteEncryptedBackup(store, { enabled: true, objectKey: uploaded.objectKey });
  assert.deepEqual(calls, ["put:backups/user/latest", "get:backups/user/latest", "delete:backups/user/latest"]);
});

test("R2 binding adapter performs no I/O until called and stores encrypted envelopes", async () => {
  const objects = new Map<string, Uint8Array>();
  const calls: string[] = [];
  const bucket: R2BucketBinding = {
    async put(key, value, options) { calls.push(`put:${key}:${options?.httpMetadata?.contentType}`); const view = value as ArrayBufferView; objects.set(key, new Uint8Array(view.buffer as ArrayBuffer, view.byteOffset, view.byteLength).slice()); return {}; },
    async get(key) { calls.push(`get:${key}`); const bytes = objects.get(key); return bytes ? { arrayBuffer: async () => bytes.slice().buffer as ArrayBuffer } : null; },
    async delete(key) { calls.push(`delete:${key}`); objects.delete(key); },
  };
  const store = createR2BackupObjectStore(bucket);
  assert.deepEqual(calls, []);
  await assert.rejects(store.put("../outside", new TextEncoder().encode("{}")), /object key is invalid/);
  await assert.rejects(store.put("backups/plain", plaintext), /encrypted ASES backup envelopes only/);
  const encrypted = await encryptBackup(plaintext, passphrase);
  await store.put("backups/project/latest", encrypted);
  assert.match(calls.join("\n"), /application\/vnd\.eureka42\.ases-backup\+json/);
  assert.deepEqual(await store.get("backups/project/latest"), encrypted);
  assert.equal(await store.get("backups/missing"), undefined);
  await store.delete("backups/project/latest");
  assert.equal(objects.size, 0);
});

test("backup helpers reject short secrets, unsupported envelopes and oversized downloads", async () => {
  await assert.rejects(encryptBackup(plaintext, "too-short"), /16 to 1024/);
  await assert.rejects(decryptBackup(new TextEncoder().encode("{}"), passphrase), /unsupported or malformed/);
  const oversizedStore: EncryptedBackupObjectStore = { put: async () => undefined, get: async () => new Uint8Array(46 * 1024 * 1024 + 1), delete: async () => undefined };
  await assert.rejects(downloadEncryptedBackup(oversizedStore, { enabled: true, objectKey: "backup/latest", passphrase }), /46 MiB/);
});
