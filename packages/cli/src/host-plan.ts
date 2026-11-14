import { createHash } from "node:crypto";
import { access, lstat, readFile, realpath } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const HOSTS = ["codex", "claude-code", "kimi-code", "gemini-cli"] as const;
export type HostId = (typeof HOSTS)[number];

export interface HostPlanFile {
  source: string;
  target: string;
  action: "CREATE" | "UNCHANGED" | "CONFLICT" | "BINARY";
  diff: string;
}

export interface HostPlan {
  host: HostId;
  workspace: string;
  mode: "PLAN_ONLY";
  files: HostPlanFile[];
}

async function exists(path: string): Promise<boolean> {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

async function findIntegrationRoot(): Promise<string> {
  for (const start of [resolve(process.cwd()), dirname(fileURLToPath(import.meta.url))]) {
    let cursor = start;
    for (;;) {
      for (const candidate of [join(cursor, "integrations"), join(cursor, "dist", "integrations")]) {
        if (await exists(join(candidate, "codex", "AGENTS.md"))) return candidate;
      }
      const parent = dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }
  throw new Error("Diretório de integrações não encontrado; execute o plano a partir do checkout do ASES Framework.");
}

function diffText(target: string, before: string | undefined, after: string): string {
  if (before === undefined) {
    const lines = after.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
    return [`--- /dev/null`, `+++ b/${target}`, `@@ -0,0 +1,${lines.length} @@`, ...lines.map((line) => `+${line}`)].join("\n");
  }
  const oldLines = before.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  const newLines = after.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  return [`--- a/${target}`, `+++ b/${target}`, `@@ -1,${oldLines.length} +1,${newLines.length} @@`, ...oldLines.map((line) => `-${line}`), ...newLines.map((line) => `+${line}`)].join("\n");
}

async function hasSymlinkInPath(root: string, target: string): Promise<boolean> {
  const parts = relative(root, target).split(sep);
  let cursor = root;
  for (const part of parts) {
    cursor = join(cursor, part);
    try { if ((await lstat(cursor)).isSymbolicLink()) return true; } catch { return false; }
  }
  return false;
}

export async function createHostPlan(host: HostId, workspacePath: string): Promise<HostPlan> {
  const workspace = await realpath(resolve(workspacePath));
  const integrationRoot = await findIntegrationRoot();
  const hostSource = join(integrationRoot, host);
  const paths = host === "claude-code"
    ? [".claude-plugin/plugin.json", "commands/ases-start.md", "skills/ases-project-start/SKILL.md", ".claude-plugin/icon.png"].map((path) => ({ source: path, target: path }))
    : host === "codex"
      ? ["AGENTS.md", ".agents/skills/ases-project-start/SKILL.md"].map((path) => ({ source: path, target: path }))
      : host === "kimi-code"
        ? [{ source: "skills/ases-project-start/SKILL.md", target: ".agents/skills/ases-project-start/SKILL.md" }]
        : ["gemini-extension.json", "GEMINI.md", "commands/ases/start.toml", "skills/ases-project-start/SKILL.md"].map((path) => ({ source: path, target: join(".gemini", "extensions", "eureka42-ases", path) }));
  const files: HostPlanFile[] = [];

  for (const { source: path, target } of paths) {
    const sourcePath = join(hostSource, path);
    const sourceRelative = relative(integrationRoot, sourcePath);
    if (!sourceRelative || sourceRelative.startsWith(`..${sep}`) || !await exists(sourcePath)) throw new Error(`Artefato de integração inválido ou ausente: ${path}`);
    const targetPath = join(workspace, target);
    if (await hasSymlinkInPath(workspace, targetPath)) {
      files.push({ source: sourceRelative, target, action: "CONFLICT", diff: `CONFLICT ${target}: caminho contém symlink; plano recusado para evitar sair do workspace.` });
      continue;
    }
    const sourceBytes = await readFile(sourcePath);
    const targetExists = await exists(targetPath);
    const binary = path.endsWith(".png");
    if (binary) {
      const checksum = createHash("sha256").update(sourceBytes).digest("hex");
      const targetBytes = targetExists ? await readFile(targetPath) : undefined;
      const action = !targetExists ? "BINARY" : targetBytes && createHash("sha256").update(targetBytes).digest("hex") === checksum ? "UNCHANGED" : "CONFLICT";
      files.push({ source: sourceRelative, target, action, diff: `Binary asset; SHA-256 origem ${checksum}; ${!targetExists ? "novo arquivo, sem diff textual" : action === "UNCHANGED" ? "conteúdo idêntico" : "destino existente difere; requer revisão manual"}.` });
      continue;
    }
    const after = sourceBytes.toString("utf8");
    let before: string | undefined;
    if (targetExists) {
      const stat = await lstat(targetPath);
      if (!stat.isFile()) {
        files.push({ source: sourceRelative, target, action: "CONFLICT", diff: `CONFLICT ${target}: destino existe e não é arquivo regular.` });
        continue;
      }
      before = await readFile(targetPath, "utf8");
    }
    const action = before === undefined ? "CREATE" : before === after ? "UNCHANGED" : "CONFLICT";
    files.push({ source: sourceRelative, target, action, diff: action === "UNCHANGED" ? `UNCHANGED ${target}` : diffText(target, before, after) });
  }
  return { host, workspace, mode: "PLAN_ONLY", files };
}
