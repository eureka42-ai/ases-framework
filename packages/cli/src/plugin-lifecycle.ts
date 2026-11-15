import { createHash } from "node:crypto";
import { lstat, readdir, readFile, rmdir, unlink } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { realpath } from "node:fs/promises";

export interface PluginInstallManifest {
  format: "eureka42-plugin-install";
  schemaVersion: "1";
  pluginId: string;
  files: Array<{ path: string; sha256: string }>;
  manifestSha256: string;
}
export interface PluginRemovalResult {
  status: "not-managed" | "removed" | "partial" | "planned";
  pluginId: string;
  workspace: string;
  apply: boolean;
  remove: string[];
  preserve: Array<{ path: string; reason: string }>;
}

const PLUGIN_ID = /^[a-z][a-z0-9-]{1,62}$/;
const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
function safeRelative(path: string): boolean {
  return path.length > 0 && !path.startsWith("/") && !path.includes("\\") && !/^[A-Za-z]:/.test(path) && path.split("/").every((part) => part && part !== "." && part !== "..");
}
function manifestDigest(manifest: Omit<PluginInstallManifest, "manifestSha256">): string {
  return sha256(JSON.stringify(manifest));
}

export function createPluginInstallManifest(pluginId: string, files: Array<{ path: string; content: string }>): PluginInstallManifest {
  if (!PLUGIN_ID.test(pluginId) || files.some((file) => !safeRelative(file.path))) throw new Error("invalid plugin install ownership data");
  const ownedFiles = files.map((file) => ({ path: file.path, sha256: sha256(file.content) })).sort((a, b) => a.path.localeCompare(b.path));
  if (new Set(ownedFiles.map((file) => file.path)).size !== ownedFiles.length || ownedFiles.some((file) => file.path === "install-manifest.json")) throw new Error("duplicate or reserved plugin file path");
  const base = { format: "eureka42-plugin-install" as const, schemaVersion: "1" as const, pluginId, files: ownedFiles };
  return { ...base, manifestSha256: manifestDigest(base) };
}

async function safeOwnedPath(root: string, relativePath: string): Promise<string | undefined> {
  if (!safeRelative(relativePath)) throw new Error("unsafe path in plugin ownership manifest");
  const target = resolve(root, ...relativePath.split("/"));
  if (relative(root, target).startsWith(`..${sep}`) || target === root) throw new Error("plugin ownership path escapes its directory");
  let current = root;
  const parts = relative(root, target).split(sep);
  for (const [index, part] of parts.entries()) {
    current = resolve(current, part);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) return undefined;
      if (index < parts.length - 1 && !info.isDirectory()) return undefined;
      if (index === parts.length - 1 && !info.isFile()) return undefined;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    }
  }
  return current;
}

export async function removeInstalledPlugin(workspacePath: string, pluginId: string, apply = false): Promise<PluginRemovalResult> {
  if (!PLUGIN_ID.test(pluginId)) throw new Error("invalid plugin ID");
  const workspace = await realpath(resolve(workspacePath));
  const pluginRoot = resolve(workspace, ".ases", "plugins", pluginId);
  const manifestPath = resolve(pluginRoot, "install-manifest.json");
  const result: PluginRemovalResult = { status: "not-managed", pluginId, workspace, apply, remove: [], preserve: [] };
  for (const parent of [resolve(workspace, ".ases"), resolve(workspace, ".ases", "plugins")]) {
    try {
      const info = await lstat(parent);
      if (!info.isDirectory() || info.isSymbolicLink()) {
        result.preserve.push({ path: parent, reason: "plugin ownership parent is not a regular directory" });
        result.status = "partial";
        return result;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return result;
      throw error;
    }
  }
  let rootInfo;
  try { rootInfo = await lstat(pluginRoot); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return result;
    throw error;
  }
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
    result.preserve.push({ path: pluginRoot, reason: "plugin directory is not a regular directory" });
    result.status = "partial";
    return result;
  }
  let manifest: PluginInstallManifest;
  try {
    const info = await lstat(manifestPath);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error("ownership manifest is not a regular file");
    manifest = JSON.parse(await readFile(manifestPath, "utf8")) as PluginInstallManifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return result;
    result.preserve.push({ path: manifestPath, reason: error instanceof Error ? error.message : "ownership manifest is invalid" });
    result.status = "partial";
    return result;
  }
  const { manifestSha256, ...base } = manifest;
  if (manifest.format !== "eureka42-plugin-install" || manifest.schemaVersion !== "1" || manifest.pluginId !== pluginId || !Array.isArray(manifest.files) || manifestDigest(base) !== manifestSha256) {
    result.preserve.push({ path: manifestPath, reason: "ownership manifest is malformed or tampered" });
    result.status = "partial";
    return result;
  }
  const seen = new Set<string>();
  for (const file of manifest.files) {
    if (!file || typeof file.path !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256) || seen.has(file.path) || file.path === "install-manifest.json") {
      result.preserve.push({ path: manifestPath, reason: "ownership manifest contains invalid entries" });
      result.status = "partial";
      return result;
    }
    seen.add(file.path);
    const target = await safeOwnedPath(pluginRoot, file.path);
    if (!target) {
      const candidate = resolve(pluginRoot, ...file.path.split("/"));
      try {
        await lstat(candidate);
        result.preserve.push({ path: candidate, reason: "symlink, special file or unsafe path" });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      continue;
    }
    const content = await readFile(target);
    if (sha256(content) !== file.sha256) result.preserve.push({ path: target, reason: "file was modified after installation" });
    else result.remove.push(target);
  }
  const ownedPaths = new Set(manifest.files.map((file) => file.path));
  const inspectUnowned = async (directory: string, prefix = ""): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (!prefix && rel === "install-manifest.json") continue;
      if (entry.isSymbolicLink()) {
        if (!ownedPaths.has(rel)) result.preserve.push({ path: resolve(directory, entry.name), reason: "unowned symlink preserved" });
      } else if (entry.isDirectory()) await inspectUnowned(resolve(directory, entry.name), rel);
      else if (entry.isFile() && !ownedPaths.has(rel)) result.preserve.push({ path: resolve(directory, entry.name), reason: "unowned plugin data preserved" });
      else if (!entry.isFile()) result.preserve.push({ path: resolve(directory, entry.name), reason: "special file preserved" });
    }
  };
  await inspectUnowned(pluginRoot);
  if (!apply) {
    result.status = "planned";
    return result;
  }
  for (const target of result.remove) await unlink(target);
  if (result.preserve.length === 0) {
    await unlink(manifestPath);
    const pruneEmptyOwnedDirectories = async (directory: string): Promise<void> => {
      for (const entry of await readdir(directory, { withFileTypes: true })) if (entry.isDirectory() && !entry.isSymbolicLink()) await pruneEmptyOwnedDirectories(resolve(directory, entry.name));
      if (directory !== pluginRoot) await rmdir(directory).catch(() => undefined);
    };
    await pruneEmptyOwnedDirectories(pluginRoot);
    await rmdir(pluginRoot).catch(() => undefined);
    result.status = "removed";
  } else {
    result.status = "partial";
  }
  return result;
}
