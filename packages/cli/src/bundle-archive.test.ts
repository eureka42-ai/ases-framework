import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BundleArchiveError, importBundleArchive, previewBundleArchive } from "./bundle-archive.js";

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(entries: Array<{ name: string; content: string }>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const bytes = Buffer.from(entry.content, "utf8");
    const local = Buffer.alloc(30 + name.length + bytes.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc32(bytes), 14);
    local.writeUInt32LE(bytes.length, 18);
    local.writeUInt32LE(bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    name.copy(local, 30);
    bytes.copy(local, 30 + name.length);
    locals.push(local);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE((3 << 8) | 20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(crc32(bytes), 16);
    central.writeUInt32LE(bytes.length, 20);
    central.writeUInt32LE(bytes.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE((0o100600 * 2 ** 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);
    offset += local.length;
  }
  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralDirectory, end]);
}

test("bundle import previews without writing and applies only after explicit confirmation", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-bundle-preview-"));
  const archive = zip([{ name: "context/decisions.json", content: "{\"schemaVersion\":\"1\"}\n" }]);
  const preview = await previewBundleArchive(workspace, archive);
  assert.equal(preview.status, "READY");
  assert.equal(preview.entries[0]!.action, "CREATE");
  await assert.rejects(readFile(join(workspace, "context", "decisions.json")), { code: "ENOENT" });
  const dryRun = await importBundleArchive(workspace, archive, { apply: false });
  assert.equal(dryRun.status, "PREVIEW");
  const applied = await importBundleArchive(workspace, archive, { apply: true });
  assert.equal(applied.status, "READY");
  assert.equal(await readFile(join(workspace, "context", "decisions.json"), "utf8"), "{\"schemaVersion\":\"1\"}\n");
  assert.equal((await stat(join(workspace, "context", "decisions.json"))).mode & 0o777, 0o600);
});

test("bundle import reports conflicts and never overwrites existing workspace files", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-bundle-conflict-"));
  await writeFile(join(workspace, "state.json"), "keep this\n");
  const archive = zip([{ name: "state.json", content: "replace me\n" }]);
  const preview = await previewBundleArchive(workspace, archive);
  assert.equal(preview.status, "CONFLICT");
  assert.deepEqual(preview.conflicts, ["state.json"]);
  await assert.rejects(importBundleArchive(workspace, archive, { apply: true }), BundleArchiveError);
  assert.equal(await readFile(join(workspace, "state.json"), "utf8"), "keep this\n");
});

test("bundle import rejects zip-slip paths, executable payloads, and corrupt entries", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "ases-bundle-reject-"));
  await assert.rejects(previewBundleArchive(workspace, zip([{ name: "../escape.json", content: "{}" }])), /unsafe path segment/);
  await assert.rejects(previewBundleArchive(workspace, zip([{ name: "scripts/run.js", content: "process.exit(0)" }])), /only JSON, Markdown, and text/);
  const corrupt = zip([{ name: "data.json", content: "{}" }]);
  corrupt[31] = 0x58;
  await assert.rejects(previewBundleArchive(workspace, corrupt), /CRC|header|filename/);
});
