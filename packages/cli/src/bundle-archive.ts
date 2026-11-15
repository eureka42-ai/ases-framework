import { createHash } from "node:crypto";
import { mkdir, open, lstat, realpath, rmdir, unlink } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve, sep } from "node:path";
import { inflateRawSync } from "node:zlib";

const MAX_ENTRIES = 2_000;
const MAX_ENTRY_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const MAX_COMPRESSION_RATIO = 100;

interface ArchiveFile {
  path: string;
  bytes: Buffer;
}

export interface BundleArchivePreview {
  status: "PREVIEW" | "READY" | "CONFLICT";
  workspace: string;
  entries: Array<{ path: string; action: "CREATE" | "CONFLICT"; bytes: number; sha256: string }>;
  conflicts: string[];
  totalBytes: number;
}

export class BundleArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BundleArchiveError";
  }
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  return crc >>> 0;
});

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff]!;
  return (crc ^ 0xffffffff) >>> 0;
}

function need(buffer: Buffer, offset: number, length: number): void {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > buffer.length) throw new BundleArchiveError("truncated or invalid ZIP structure");
}

function readName(buffer: Buffer, offset: number, length: number, flags: number): string {
  need(buffer, offset, length);
  const raw = buffer.subarray(offset, offset + length);
  if (!(flags & 0x800) && raw.some((byte) => byte >= 0x80)) throw new BundleArchiveError("ZIP filenames must be UTF-8");
  let name: string;
  try { name = new TextDecoder("utf-8", { fatal: true }).decode(raw); } catch { throw new BundleArchiveError("ZIP filename is not valid UTF-8"); }
  return name;
}

function safeArchivePath(name: string, directory: boolean): string {
  if (!name || name.includes("\0") || name.includes("\\") || name.startsWith("/") || /^[a-z]:/i.test(name) || name.includes(":")) throw new BundleArchiveError("archive contains an absolute or platform-specific path");
  const path = directory && name.endsWith("/") ? name.slice(0, -1) : name;
  const segments = path.split("/");
  if (segments.some((part) => !part || part === "." || part === ".." || part !== part.normalize("NFC") || /[<>"|?*]/.test(part) || /[ .]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw new BundleArchiveError("archive contains an unsafe path segment");
  if (!directory && ![".json", ".md", ".markdown", ".txt"].includes(extname(path).toLowerCase())) throw new BundleArchiveError("bundle archives may contain only JSON, Markdown, and text files");
  return segments.join("/");
}

function parseZip(archive: Buffer): ArchiveFile[] {
  if (archive.length < 22) throw new BundleArchiveError("archive is not a valid ZIP file");
  const min = Math.max(0, archive.length - 22 - 0xffff);
  let eocd = -1;
  for (let offset = archive.length - 22; offset >= min; offset -= 1) {
    if (archive.readUInt32LE(offset) === 0x06054b50) { eocd = offset; break; }
  }
  if (eocd < 0) throw new BundleArchiveError("ZIP end-of-central-directory record was not found");
  need(archive, eocd, 22);
  const disk = archive.readUInt16LE(eocd + 4);
  const centralDisk = archive.readUInt16LE(eocd + 6);
  const diskEntries = archive.readUInt16LE(eocd + 8);
  const entryCount = archive.readUInt16LE(eocd + 10);
  const centralSize = archive.readUInt32LE(eocd + 12);
  const centralOffset = archive.readUInt32LE(eocd + 16);
  const commentLength = archive.readUInt16LE(eocd + 20);
  if (disk || centralDisk || diskEntries !== entryCount || entryCount === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) throw new BundleArchiveError("multi-disk and ZIP64 archives are not supported");
  if (entryCount > MAX_ENTRIES || eocd + 22 + commentLength !== archive.length || centralOffset + centralSize > eocd) throw new BundleArchiveError("ZIP directory bounds or entry count are invalid");

  const files: ArchiveFile[] = [];
  const seen = new Set<string>();
  let cursor = centralOffset;
  let totalBytes = 0;
  for (let entry = 0; entry < entryCount; entry += 1) {
    need(archive, cursor, 46);
    if (archive.readUInt32LE(cursor) !== 0x02014b50) throw new BundleArchiveError("invalid ZIP central directory entry");
    const madeBy = archive.readUInt16LE(cursor + 4) >>> 8;
    const flags = archive.readUInt16LE(cursor + 8);
    const method = archive.readUInt16LE(cursor + 10);
    const expectedCrc = archive.readUInt32LE(cursor + 16);
    const compressedSize = archive.readUInt32LE(cursor + 20);
    const uncompressedSize = archive.readUInt32LE(cursor + 24);
    const nameLength = archive.readUInt16LE(cursor + 28);
    const extraLength = archive.readUInt16LE(cursor + 30);
    const commentSize = archive.readUInt16LE(cursor + 32);
    const startDisk = archive.readUInt16LE(cursor + 34);
    const externalAttributes = archive.readUInt32LE(cursor + 38);
    const localOffset = archive.readUInt32LE(cursor + 42);
    need(archive, cursor + 46, nameLength + extraLength + commentSize);
    if (startDisk !== 0 || (flags & 1) || (flags & 0x40) || ![0, 8].includes(method)) throw new BundleArchiveError("encrypted, split, or unsupported ZIP entry");
    const name = readName(archive, cursor + 46, nameLength, flags);
    const isDirectory = name.endsWith("/");
    const path = safeArchivePath(name, isDirectory);
    const collisionKey = path.toLocaleLowerCase("en-US");
    if (seen.has(collisionKey)) throw new BundleArchiveError("archive contains duplicate or case-colliding paths");
    seen.add(collisionKey);
    if (madeBy === 3) {
      const unixMode = externalAttributes >>> 16;
      const fileType = unixMode & 0xf000;
      if (fileType === 0xa000 || (fileType && fileType !== (isDirectory ? 0x4000 : 0x8000))) throw new BundleArchiveError("archive contains a symbolic link or special file");
    }
    if (!isDirectory) {
      if (uncompressedSize > MAX_ENTRY_BYTES || (totalBytes += uncompressedSize) > MAX_TOTAL_BYTES) throw new BundleArchiveError("archive exceeds extraction size limits");
      if (uncompressedSize > 0 && (compressedSize === 0 || uncompressedSize / compressedSize > MAX_COMPRESSION_RATIO)) throw new BundleArchiveError("archive compression ratio exceeds the safety limit");
      need(archive, localOffset, 30);
      if (archive.readUInt32LE(localOffset) !== 0x04034b50) throw new BundleArchiveError("invalid ZIP local file header");
      const localFlags = archive.readUInt16LE(localOffset + 6);
      const localMethod = archive.readUInt16LE(localOffset + 8);
      const localNameLength = archive.readUInt16LE(localOffset + 26);
      const localExtraLength = archive.readUInt16LE(localOffset + 28);
      const localName = readName(archive, localOffset + 30, localNameLength, localFlags);
      if (localName !== name || localFlags !== flags || localMethod !== method) throw new BundleArchiveError("ZIP local and central headers disagree");
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      need(archive, dataOffset, compressedSize);
      if (dataOffset + compressedSize > centralOffset) throw new BundleArchiveError("ZIP entry data overlaps the central directory");
      const compressed = archive.subarray(dataOffset, dataOffset + compressedSize);
      let bytes: Buffer;
      try { bytes = method === 0 ? Buffer.from(compressed) : inflateRawSync(compressed, { maxOutputLength: MAX_ENTRY_BYTES }); } catch { throw new BundleArchiveError("ZIP entry decompression failed or exceeded limits"); }
      if (bytes.length !== uncompressedSize || crc32(bytes) !== expectedCrc) throw new BundleArchiveError("ZIP entry size or CRC does not match its directory record");
      files.push({ path, bytes });
    }
    cursor += 46 + nameLength + extraLength + commentSize;
  }
  if (cursor !== centralOffset + centralSize || !files.length) throw new BundleArchiveError("ZIP directory size mismatch or archive has no importable files");
  return files;
}

async function previewFiles(workspaceRoot: string, files: readonly ArchiveFile[]): Promise<BundleArchivePreview> {
  const workspace = await realpath(workspaceRoot);
  const entries: BundleArchivePreview["entries"] = [];
  const conflicts: string[] = [];
  for (const file of files) {
    const target = resolve(workspace, file.path);
    const rel = relative(workspace, target);
    if (!rel || rel === ".." || rel.startsWith(`..${sep}`)) throw new BundleArchiveError("archive target escapes the workspace");
    let current = workspace;
    const parts = file.path.split("/");
    for (let index = 0; index < parts.length; index += 1) {
      current = resolve(current, parts[index]!);
      try {
        const info = await lstat(current);
        if (info.isSymbolicLink()) throw new BundleArchiveError("archive target traverses a symbolic link");
        if (index < parts.length - 1 && !info.isDirectory()) throw new BundleArchiveError("archive target parent is not a directory");
        if (index === parts.length - 1 && !info.isFile()) throw new BundleArchiveError("archive target exists and is not a regular file");
      } catch (error) {
        if (error instanceof BundleArchiveError || (error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    const exists = await lstat(target).then(() => true, (error: NodeJS.ErrnoException) => error.code === "ENOENT" ? false : Promise.reject(error));
    const action = exists ? "CONFLICT" as const : "CREATE" as const;
    if (exists) conflicts.push(file.path);
    entries.push({ path: file.path, action, bytes: file.bytes.length, sha256: sha256(file.bytes) });
  }
  return { status: conflicts.length ? "CONFLICT" : "READY", workspace, entries, conflicts, totalBytes: files.reduce((sum, file) => sum + file.bytes.length, 0) };
}

/** Shows the complete import plan without writing files. */
export async function previewBundleArchive(workspaceRoot: string, archive: Buffer): Promise<BundleArchivePreview> {
  return previewFiles(workspaceRoot, parseZip(archive));
}

/** Applies only a conflict-free archive after explicit apply=true; imported data is never executed. */
export async function importBundleArchive(workspaceRoot: string, archive: Buffer, options: { apply: boolean }): Promise<BundleArchivePreview> {
  const files = parseZip(archive);
  const preview = await previewFiles(workspaceRoot, files);
  if (!options.apply) return { ...preview, status: "PREVIEW" };
  if (preview.conflicts.length) throw new BundleArchiveError(`import stopped due to existing files: ${preview.conflicts.join(", ")}`);
  const createdFiles: string[] = [];
  const createdDirectories: string[] = [];
  try {
    for (const file of files) {
      const target = resolve(preview.workspace, file.path);
      const parents: string[] = [];
      let parent = dirname(target);
      while (parent !== preview.workspace && parent.startsWith(`${preview.workspace}${sep}`)) { parents.unshift(parent); parent = dirname(parent); }
      for (const directory of parents) {
        try { await mkdir(directory); createdDirectories.push(directory); } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
          const info = await lstat(directory);
          if (!info.isDirectory() || info.isSymbolicLink()) throw new BundleArchiveError("archive target directory changed or is unsafe");
        }
      }
      const output = await open(target, "wx", 0o600);
      createdFiles.push(target);
      try { await output.writeFile(file.bytes); await output.sync(); } finally { await output.close(); }
    }
  } catch (error) {
    for (const file of createdFiles.reverse()) await unlink(file).catch(() => undefined);
    for (const directory of createdDirectories.reverse()) await rmdir(directory).catch(() => undefined);
    throw error;
  }
  return { ...preview, status: "READY" };
}
