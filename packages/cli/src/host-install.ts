import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, realpath, rmdir, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { createHostPlan, readHostAsset, type HostId } from "./host-plan.js";

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
  for (const otherHost of ["codex", "claude-code", "kimi-code", "gemini-cli"] as const) {
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
