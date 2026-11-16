import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, realpath, rename, rmdir, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { createHostPlan, HOSTS, readHostAsset, type HostId } from "./host-plan.js";

const FORMAT = "eureka42-ases-host-install-manifest";
const hash = (bytes: Buffer | string): string => createHash("sha256").update(bytes).digest("hex");

interface OwnedFile {
  path: string;
  sha256: string;
  owned: boolean;
}

interface HostManifest {
  format: typeof FORMAT;
  schemaVersion: "1";
  host: HostId;
  files: OwnedFile[];
  directories: string[];
  asesDirectoryCreated: boolean;
  manifestSha256: string;
}

interface HostBackupManifest {
  format: "eureka42-host-backup";
  schemaVersion: "1";
  host: HostId;
  files: Array<{ path: string; sha256: string }>;
  manifestSha256: string;
}

interface HostInstallHooks {
  afterFileCreated?: (target: string) => Promise<void> | void;
}

function manifestBase(host: HostId, files: OwnedFile[], directories: string[], asesDirectoryCreated: boolean) {
  return { format: FORMAT as typeof FORMAT, schemaVersion: "1" as const, host, files, directories, asesDirectoryCreated };
}

function manifestPath(root: string, host: HostId): string {
  return join(root, ".ases", `host-install-${host}.json`);
}

function isSafeRelative(path: string): boolean {
  return path.length > 0 && !isAbsolute(path) && !path.split(/[\\/]/).some((part) => part === ".." || part === "");
}

async function assertNoSymlinkPath(root: string, target: string): Promise<void> {
  const rel = relative(root, target);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`Caminho fora do workspace: ${target}`);
  let cursor = root;
  for (const part of rel.split(sep)) {
    cursor = join(cursor, part);
    try {
      if ((await lstat(cursor)).isSymbolicLink()) throw new Error(`Caminho contém symlink: ${cursor}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
  }
}

async function ensureDirectories(root: string, directory: string, created: string[]): Promise<void> {
  const rel = relative(root, directory);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`Diretório fora do workspace: ${directory}`);
  let cursor = root;
  for (const part of rel.split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    try {
      const info = await lstat(cursor);
      if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`Destino não é diretório regular: ${cursor}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await mkdir(cursor);
      created.push(cursor);
    }
  }
}

async function readManifest(root: string, host: HostId): Promise<HostManifest> {
  const path = manifestPath(root, host);
  await assertNoSymlinkPath(root, path);
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error("Manifesto de integração não é arquivo regular.");
  const value = JSON.parse(await readFile(path, "utf8")) as Partial<HostManifest>;
  if (value.format !== FORMAT || value.schemaVersion !== "1" || value.host !== host || !Array.isArray(value.files) || !value.files.length || !Array.isArray(value.directories) || typeof value.asesDirectoryCreated !== "boolean" || typeof value.manifestSha256 !== "string" || !/^[a-f0-9]{64}$/.test(value.manifestSha256)) throw new Error("Manifesto de integração inválido.");
  const paths = new Set<string>();
  for (const entry of value.files) {
    if (!entry || typeof entry.path !== "string" || !isSafeRelative(entry.path) || paths.has(entry.path) || typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256) || typeof entry.owned !== "boolean") throw new Error("Manifesto contém propriedade inválida.");
    paths.add(entry.path);
  }
  const directories = new Set<string>();
  for (const directory of value.directories) {
    if (typeof directory !== "string" || !isSafeRelative(directory) || directories.has(directory) || directory === ".ases" || directory.startsWith(`.ases${sep}`)) throw new Error("Manifesto contém diretório inválido.");
    directories.add(directory);
  }
  const base = manifestBase(host, value.files, value.directories, value.asesDirectoryCreated);
  if (hash(JSON.stringify(base)) !== value.manifestSha256) throw new Error("Hash de integridade do manifesto não confere.");
  return value as HostManifest;
}

interface PendingHostUpdate {
  path: string;
  absolute: string;
  previous: Buffer;
  next: Buffer;
  previousHash: string;
  nextHash: string;
}

async function replaceRegularFile(root: string, target: string, expectedHash: string, next: Buffer): Promise<void> {
  await assertNoSymlinkPath(root, target);
  const info = await lstat(target);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Destino não é arquivo regular: ${target}`);
  if (hash(await readFile(target)) !== expectedHash) throw new Error(`Destino mudou durante a atualização: ${relative(root, target)}`);
  const temporary = join(dirname(target), `.${randomUUID()}.ases-update.tmp`);
  await writeFile(temporary, next, { flag: "wx" });
  try {
    await assertNoSymlinkPath(root, target);
    const currentInfo = await lstat(target);
    if (!currentInfo.isFile() || currentInfo.isSymbolicLink() || hash(await readFile(target)) !== expectedHash) throw new Error(`Destino mudou durante a atualização: ${relative(root, target)}`);
    await rename(temporary, target);
  } catch (error) {
    try { await unlink(temporary); } catch { /* temporary file may already be gone */ }
    throw error;
  }
}

async function replaceManifest(root: string, host: HostId, current: HostManifest, next: HostManifest): Promise<void> {
  const path = manifestPath(root, host);
  const currentBytes = await readFile(path);
  const currentHash = hash(currentBytes);
  const disk = JSON.parse(currentBytes.toString("utf8")) as Partial<HostManifest>;
  if (disk.manifestSha256 !== current.manifestSha256 || disk.format !== FORMAT || disk.schemaVersion !== "1" || disk.host !== host || !Array.isArray(disk.files) || !Array.isArray(disk.directories) || typeof disk.asesDirectoryCreated !== "boolean") throw new Error("Manifesto mudou durante a atualização.");
  const diskBase = manifestBase(host, disk.files, disk.directories, disk.asesDirectoryCreated);
  if (hash(JSON.stringify(diskBase)) !== disk.manifestSha256) throw new Error("Manifesto perdeu integridade durante a atualização.");
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { flag: "wx" });
  try {
    await assertNoSymlinkPath(root, path);
    if (hash(await readFile(path)) !== currentHash) throw new Error("Manifesto mudou durante a atualização.");
    await rename(temporary, path);
  } catch (error) {
    try { await unlink(temporary); } catch { /* temporary file may already be gone */ }
    throw error;
  }
}

export async function updateHostIntegration(host: HostId, workspacePath: string, apply: boolean) {
  const root = await realpath(resolve(workspacePath));
  const path = manifestPath(root, host);
  let manifest: HostManifest;
  try {
    manifest = await readManifest(root, host);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { status: "not-managed" as const, host, workspace: root, apply: false, updates: [] as string[] };
    throw error;
  }
  const plan = await createHostPlan(host, root);
  const sourceByTarget = new Map(plan.files.map((item) => [item.target, item]));
  const updates: PendingHostUpdate[] = [];
  const unchanged: string[] = [];
  const missing: string[] = [];
  const obsolete: string[] = [];
  const conflicts: Array<{ path: string; reason: string }> = [];

  for (const entry of manifest.files) {
    if (!entry.owned) continue;
    if (!isSafeRelative(entry.path)) throw new Error(`Caminho inválido no manifesto: ${entry.path}`);
    const item = sourceByTarget.get(entry.path);
    if (!item) {
      obsolete.push(entry.path);
      continue;
    }
    const absolute = resolve(root, entry.path);
    await assertNoSymlinkPath(root, absolute);
    let previous: Buffer;
    try {
      const info = await lstat(absolute);
      if (!info.isFile() || info.isSymbolicLink()) {
        conflicts.push({ path: entry.path, reason: "destino não é arquivo regular" });
        continue;
      }
      previous = await readFile(absolute);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        missing.push(entry.path);
        continue;
      }
      throw error;
    }
    const previousHash = hash(previous);
    if (previousHash !== entry.sha256) {
      conflicts.push({ path: entry.path, reason: "arquivo alterado desde a instalação; atualização recusada" });
      continue;
    }
    const next = await readHostAsset(host, item.source);
    const nextHash = hash(next);
    if (nextHash === previousHash) unchanged.push(entry.path);
    else updates.push({ path: entry.path, absolute, previous, next, previousHash, nextHash });
  }

  if (conflicts.length) return { status: "conflict" as const, host, workspace: root, apply: false, conflicts, updates: updates.map((item) => item.path), unchanged, missing, obsolete };
  if (!apply) return { status: updates.length ? "planned" as const : missing.length || obsolete.length ? "attention" as const : "current" as const, host, workspace: root, apply: false, wouldUpdate: updates.map((item) => item.path), unchanged, missing, obsolete, backupRoot: `.ases/backups/hosts/${host}/<timestamp-id>` };
  if (!updates.length) return { status: missing.length || obsolete.length ? "attention" as const : "current" as const, host, workspace: root, apply: true, updated: [] as string[], unchanged, missing, obsolete };

  const backupRootRelative = `.ases/backups/hosts/${host}/${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
  const backupRoot = resolve(root, backupRootRelative);
  if (!isSafeRelative(backupRootRelative)) throw new Error("Diretório de backup inválido.");
  await ensureDirectories(root, backupRoot, []);
  const backedUp: string[] = [];
  const replaced: PendingHostUpdate[] = [];
  try {
    for (const item of updates) {
      const backupRelative = join(backupRootRelative, item.path);
      const backupAbsolute = resolve(root, backupRelative);
      if (!isSafeRelative(backupRelative)) throw new Error(`Caminho de backup inválido: ${backupRelative}`);
      await ensureDirectories(root, dirname(backupAbsolute), []);
      await assertNoSymlinkPath(root, backupAbsolute);
      await writeFile(backupAbsolute, item.previous, { flag: "wx" });
      backedUp.push(backupRelative);
    }
    const backupBase = {
      format: "eureka42-host-backup" as const,
      schemaVersion: "1" as const,
      host,
      files: updates.map((item) => ({ path: item.path, sha256: item.previousHash })).sort((a, b) => a.path.localeCompare(b.path)),
    };
    const backupManifest: HostBackupManifest = { ...backupBase, manifestSha256: hash(JSON.stringify(backupBase)) };
    await writeFile(resolve(backupRoot, "manifest.json"), `${JSON.stringify(backupManifest, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    for (const item of updates) {
      await replaceRegularFile(root, item.absolute, item.previousHash, item.next);
      replaced.push(item);
    }

    const nextFiles = manifest.files.map((entry) => {
      const changed = updates.find((item) => item.path === entry.path);
      return changed ? { ...entry, sha256: changed.nextHash } : entry;
    });
    const base = manifestBase(host, nextFiles, manifest.directories, manifest.asesDirectoryCreated);
    const nextManifest: HostManifest = { ...base, manifestSha256: hash(JSON.stringify(base)) };
    await replaceManifest(root, host, manifest, nextManifest);
    return { status: "updated" as const, host, workspace: root, apply: true, updated: updates.map((item) => item.path), backups: backedUp, backupRoot: backupRootRelative, unchanged, missing, obsolete };
  } catch (error) {
    const rollbackErrors: string[] = [];
    for (const item of replaced.reverse()) {
      try { await replaceRegularFile(root, item.absolute, item.nextHash, item.previous); }
      catch { rollbackErrors.push(item.path); }
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Atualização interrompida: ${message}. Backups preservados em ${backupRootRelative}.${rollbackErrors.length ? ` Rollback incompleto para: ${rollbackErrors.join(", ")}.` : " Arquivos atualizados foram restaurados."}`);
  }
}

export async function restoreHostBackup(host: HostId, backupId: string, workspacePath: string, apply: boolean) {
  if (!HOSTS.includes(host) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(backupId)) throw new Error("Host or backup ID is invalid.");
  const root = await realpath(resolve(workspacePath));
  const backupRelative = `.ases/backups/hosts/${host}/${backupId}`;
  if (!isSafeRelative(backupRelative)) throw new Error("Backup path is invalid.");
  const backupRoot = resolve(root, backupRelative);
  await assertNoSymlinkPath(root, backupRoot);
  const directoryInfo = await lstat(backupRoot).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  });
  if (!directoryInfo) return { status: "not-found" as const, host, backupId, workspace: root, apply, restored: [] as string[], conflicts: [] as string[] };
  if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()) throw new Error("Backup directory is not a regular directory.");
  const backupManifestPath = resolve(backupRoot, "manifest.json");
  await assertNoSymlinkPath(root, backupManifestPath);
  const backupInfo = await lstat(backupManifestPath);
  if (!backupInfo.isFile() || backupInfo.isSymbolicLink()) throw new Error("Backup manifest is not a regular file.");
  const backupManifest = JSON.parse(await readFile(backupManifestPath, "utf8")) as Partial<HostBackupManifest>;
  const backupBase = { format: backupManifest.format, schemaVersion: backupManifest.schemaVersion, host: backupManifest.host, files: backupManifest.files };
  if (backupManifest.format !== "eureka42-host-backup" || backupManifest.schemaVersion !== "1" || backupManifest.host !== host || !Array.isArray(backupManifest.files) || typeof backupManifest.manifestSha256 !== "string" || hash(JSON.stringify(backupBase)) !== backupManifest.manifestSha256) throw new Error("Backup manifest is invalid or tampered.");
  const installed = await readManifest(root, host);
  const restores: Array<{ path: string; target: string; current: Buffer; currentHash: string; backup: Buffer; backupHash: string }> = [];
  const conflicts: string[] = [];
  const paths = new Set<string>();
  for (const item of backupManifest.files) {
    if (!item || typeof item.path !== "string" || !isSafeRelative(item.path) || paths.has(item.path) || typeof item.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(item.sha256)) throw new Error("Backup manifest contains an invalid file entry.");
    paths.add(item.path);
    const owned = installed.files.find((entry) => entry.path === item.path && entry.owned);
    if (!owned) { conflicts.push(item.path); continue; }
    const target = resolve(root, item.path);
    const backupFile = resolve(backupRoot, item.path);
    await assertNoSymlinkPath(root, target);
    await assertNoSymlinkPath(backupRoot, backupFile);
    try {
      const [targetInfo, backupFileInfo] = await Promise.all([lstat(target), lstat(backupFile)]);
      if (!targetInfo.isFile() || targetInfo.isSymbolicLink() || !backupFileInfo.isFile() || backupFileInfo.isSymbolicLink()) { conflicts.push(item.path); continue; }
      const [current, backup] = await Promise.all([readFile(target), readFile(backupFile)]);
      const currentHash = hash(current);
      if (currentHash !== owned.sha256 || hash(backup) !== item.sha256) { conflicts.push(item.path); continue; }
      restores.push({ path: item.path, target, current, currentHash, backup, backupHash: item.sha256 });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") conflicts.push(item.path);
      else throw error;
    }
  }
  if (conflicts.length) return { status: "conflict" as const, host, backupId, workspace: root, apply: false, restored: [] as string[], conflicts };
  if (!apply) return { status: "planned" as const, host, backupId, workspace: root, apply: false, restore: restores.map((item) => item.path), conflicts: [] as string[] };
  const replaced: typeof restores = [];
  try {
    for (const item of restores) {
      await replaceRegularFile(root, item.target, item.currentHash, item.backup);
      replaced.push(item);
    }
    const nextFiles = installed.files.map((entry) => {
      const restored = restores.find((item) => item.path === entry.path);
      return restored ? { ...entry, sha256: restored.backupHash } : entry;
    });
    const nextBase = manifestBase(host, nextFiles, installed.directories, installed.asesDirectoryCreated);
    const nextManifest: HostManifest = { ...nextBase, manifestSha256: hash(JSON.stringify(nextBase)) };
    await replaceManifest(root, host, installed, nextManifest);
    return { status: "restored" as const, host, backupId, workspace: root, apply: true, restored: restores.map((item) => item.path), conflicts: [] as string[] };
  } catch (error) {
    const rollbackErrors: string[] = [];
    for (const item of replaced.reverse()) {
      try { await replaceRegularFile(root, item.target, item.backupHash, item.current); }
      catch { rollbackErrors.push(item.path); }
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Restore failed: ${message}.${rollbackErrors.length ? ` Rollback incomplete for: ${rollbackErrors.join(", ")}.` : " Restored files were rolled back."}`);
  }
}

export async function applyHostIntegration(host: HostId, workspacePath: string, apply: boolean, hooks: HostInstallHooks = {}) {
  const root = resolve(workspacePath);
  const plan = await createHostPlan(host, root);
  const conflicts = plan.files.filter((file) => file.action === "CONFLICT");
  if (conflicts.length) return { status: "conflict" as const, host, workspace: plan.workspace, apply: false, conflicts: conflicts.map(({ target, diff }) => ({ target, reason: diff })) };
  if (!apply) return { status: "planned" as const, host, workspace: plan.workspace, apply: false, create: plan.files.filter((file) => file.action === "CREATE" || file.action === "BINARY").map((file) => file.target), unchanged: plan.files.filter((file) => file.action === "UNCHANGED").map((file) => file.target) };

  const manifest = manifestPath(plan.workspace, host);
  await assertNoSymlinkPath(plan.workspace, join(plan.workspace, ".ases"));
  try {
    await lstat(manifest);
    return { status: "already-managed" as const, host, workspace: plan.workspace, apply: false };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const filesToCreate = plan.files.filter((file) => file.action === "CREATE" || file.action === "BINARY");

  const createdFiles: Array<{ path: string; absolute: string; sha256: string }> = [];
  const createdDirectories: string[] = [];
  try {
    for (const item of filesToCreate) {
      if (!isSafeRelative(item.target)) throw new Error(`Destino relativo inválido: ${item.target}`);
      const absolute = resolve(plan.workspace, item.target);
      await assertNoSymlinkPath(plan.workspace, absolute);
      await ensureDirectories(plan.workspace, dirname(absolute), createdDirectories);
      const bytes = await readHostAsset(host, item.source);
      await writeFile(absolute, bytes, { flag: "wx" });
      createdFiles.push({ path: item.target, absolute, sha256: hash(bytes) });
      await hooks.afterFileCreated?.(item.target);
    }
    await assertNoSymlinkPath(plan.workspace, join(plan.workspace, ".ases"));
    await ensureDirectories(plan.workspace, join(plan.workspace, ".ases"), createdDirectories);
    const asesDirectoryCreated = createdDirectories.includes(join(plan.workspace, ".ases"));
    const createdByPath = new Map(createdFiles.map((file) => [file.path, file]));
    const owned: OwnedFile[] = [];
    for (const item of plan.files) {
      const created = createdByPath.get(item.target);
      if (created) {
        owned.push({ path: item.target, sha256: created.sha256, owned: true });
      } else {
        const source = await readHostAsset(host, item.source);
        const sourceHash = hash(source);
        const targetPath = resolve(plan.workspace, item.target);
        await assertNoSymlinkPath(plan.workspace, targetPath);
        if (hash(await readFile(targetPath)) !== sourceHash) throw new Error(`Destino mudou durante a instalação: ${item.target}`);
        owned.push({ path: item.target, sha256: sourceHash, owned: false });
      }
    }
    const ownedDirectories = createdDirectories
      .map((directory) => relative(plan.workspace, directory))
      .filter((directory) => directory !== ".ases" && !directory.startsWith(`.ases${sep}`));
    const base = manifestBase(host, owned, ownedDirectories, asesDirectoryCreated);
    const contents: HostManifest = { ...base, manifestSha256: hash(JSON.stringify(base)) };
    await writeFile(manifest, `${JSON.stringify(contents, null, 2)}\n`, { flag: "wx" });
    return { status: "installed" as const, host, workspace: plan.workspace, apply: true, owned: owned.filter((entry) => entry.owned).map((entry) => entry.path), borrowed: owned.filter((entry) => !entry.owned).map((entry) => entry.path), manifest: relative(plan.workspace, manifest) };
  } catch (error) {
    for (const file of createdFiles.reverse()) {
      try {
        if (hash(await readFile(file.absolute)) === file.sha256) await unlink(file.absolute);
      } catch { /* rollback continues for remaining files */ }
    }
    for (const directory of createdDirectories.reverse()) {
      try { await rmdir(directory); } catch { /* preserve non-empty directories */ }
    }
    throw error;
  }
}

export async function uninstallHostIntegration(host: HostId, workspacePath: string, apply: boolean) {
  const root = resolve(workspacePath);
  const canonicalRoot = await realpath(root);
  const path = manifestPath(canonicalRoot, host);
  let manifest: HostManifest;
  try {
    manifest = await readManifest(canonicalRoot, host);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { status: "not-managed" as const, host, workspace: canonicalRoot, apply: false, removed: [] as string[] };
    throw error;
  }

  const inspected: Array<{ path: string; absolute: string; action: "remove" | "preserve" | "missing"; reason?: string }> = [];
  const borrowed: string[] = [];
  const shared = new Map<string, HostId>();
  for (const otherHost of ["codex", "claude-code", "kimi-code", "gemini-cli", "antigravity-cli"] as const) {
    if (otherHost === host) continue;
    try {
      const other = await readManifest(canonicalRoot, otherHost);
      for (const entry of other.files) shared.set(`${entry.path}\0${entry.sha256}`, otherHost);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  for (const entry of manifest.files) {
    const absolute = resolve(canonicalRoot, entry.path);
    if (!isSafeRelative(entry.path)) throw new Error(`Caminho inválido no manifesto: ${entry.path}`);
    if (!entry.owned) {
      borrowed.push(entry.path);
      continue;
    }
    await assertNoSymlinkPath(canonicalRoot, absolute);
    try {
      const info = await lstat(absolute);
      if (!info.isFile() || info.isSymbolicLink()) inspected.push({ path: entry.path, absolute, action: "preserve", reason: "não é arquivo regular" });
      else if (hash(await readFile(absolute)) === entry.sha256) {
        const referencingHost = shared.get(`${entry.path}\0${entry.sha256}`);
        inspected.push(referencingHost
          ? { path: entry.path, absolute, action: "preserve", reason: `também referenciado pela integração ${referencingHost}` }
          : { path: entry.path, absolute, action: "remove" });
      }
      else inspected.push({ path: entry.path, absolute, action: "preserve", reason: "arquivo alterado depois da instalação" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") inspected.push({ path: entry.path, absolute, action: "missing" });
      else throw error;
    }
  }
  const wouldRemove = inspected.filter((item) => item.action === "remove").map((item) => item.path);
  const preserved = inspected.filter((item) => item.action === "preserve").map(({ path: itemPath, reason }) => ({ path: itemPath, reason }));
  const missing = inspected.filter((item) => item.action === "missing").map((item) => item.path);
  if (!apply) return { status: "planned" as const, host, workspace: canonicalRoot, apply: false, wouldRemove, borrowed, preserved, missing };

  const removed: string[] = [];
  const removedDirectories: string[] = [];
  for (const item of inspected) {
    if (item.action !== "remove") continue;
    await unlink(item.absolute);
    removed.push(item.path);
  }
  for (const directory of [...manifest.directories].reverse()) {
    const absolute = resolve(canonicalRoot, directory);
    await assertNoSymlinkPath(canonicalRoot, absolute);
    try {
      const info = await lstat(absolute);
      if (info.isDirectory() && !info.isSymbolicLink()) {
        await rmdir(absolute);
        removedDirectories.push(directory);
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT" && code !== "ENOTEMPTY" && code !== "EEXIST") throw error;
    }
  }
  if (preserved.length === 0) {
    await unlink(path);
    removed.push(relative(canonicalRoot, path));
    if (manifest.asesDirectoryCreated) {
      try { await rmdir(dirname(path)); } catch (error) {
        if (!["ENOTEMPTY", "EEXIST"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
      }
    }
  }
  return { status: preserved.length ? "partial" as const : "uninstalled" as const, host, workspace: canonicalRoot, apply: true, removed, removedDirectories, borrowed, preserved, missing };
}
