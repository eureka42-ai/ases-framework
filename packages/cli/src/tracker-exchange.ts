import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { basename, join, resolve, relative, sep } from "node:path";
import { readCatalog, type CatalogFile } from "./catalog.js";

export interface TrackerTask {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "done" | "blocked";
  labels: string[];
  source: { system: "ases" | string; id: string; url?: string };
}
export interface TrackerBundle { schemaVersion: "1"; format: "eureka42-tracker-tasks"; exportedAt: string; tasks: TrackerTask[] }

function taskFromRequirement(item: CatalogFile["requirements"][number]): TrackerTask {
  const states: Record<string, TrackerTask["status"]> = { PENDING: "open", READY: "open", IN_PROGRESS: "in_progress", IMPLEMENTED: "done", VERIFIED: "done", FAILED: "open", BLOCKED: "blocked", N_A: "done" };
  const labels = [item.priority, item.classification].filter((value): value is string => Boolean(value)).map((value) => value.toLowerCase());
  if (item.status === "BLOCKED") labels.push("blocked");
  return { id: `ases-${item.id.toLowerCase()}`, title: item.title, description: item.sourceText, status: states[item.status] ?? "open", labels, source: { system: "ases", id: item.id } };
}

export async function exportTrackerTasks(workspace: string, productId?: string): Promise<TrackerBundle> {
  const catalog = await readCatalog(workspace, productId);
  return { schemaVersion: "1", format: "eureka42-tracker-tasks", exportedAt: new Date().toISOString(), tasks: catalog.requirements.map(taskFromRequirement) };
}

function validateBundle(value: unknown): TrackerBundle {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Bundle deve ser um objeto JSON");
  const bundle = value as Partial<TrackerBundle>;
  if (bundle.schemaVersion !== "1" || bundle.format !== "eureka42-tracker-tasks" || !Array.isArray(bundle.tasks)) throw new Error("Formato de bundle não suportado; esperado eureka42-tracker-tasks schemaVersion 1");
  const seen = new Set<string>();
  for (const task of bundle.tasks) {
    if (!task || typeof task !== "object" || typeof task.id !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(task.id) || seen.has(task.id)) throw new Error("ID de tarefa inválido ou duplicado");
    seen.add(task.id);
    if (typeof task.title !== "string" || !task.title.trim() || task.title.length > 500 || typeof task.description !== "string" || task.description.length > 100_000) throw new Error(`Conteúdo inválido na tarefa ${task.id}`);
    if (!["open", "in_progress", "done", "blocked"].includes(task.status) || !Array.isArray(task.labels) || task.labels.length > 100 || task.labels.some((label) => typeof label !== "string" || label.length > 100)) throw new Error(`Status ou labels inválidos na tarefa ${task.id}`);
    if (!task.source || typeof task.source.system !== "string" || typeof task.source.id !== "string" || (task.source.url !== undefined && (typeof task.source.url !== "string" || !/^https:\/\//.test(task.source.url)))) throw new Error(`Referência de origem inválida na tarefa ${task.id}`);
  }
  return bundle as TrackerBundle;
}

export async function importTrackerTasks(file: string, workspace: string, apply = false): Promise<{ status: "preview" | "imported"; count: number; output?: string; tasks: TrackerTask[] }> {
  const source = resolve(file);
  const metadata = await lstat(source);
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > 5 * 1024 * 1024) throw new Error("Bundle deve ser arquivo regular de até 5 MiB (symlinks não são aceitos)");
  const bundle = validateBundle(JSON.parse(await readFile(source, "utf8")) as unknown);
  if (!apply) return { status: "preview", count: bundle.tasks.length, tasks: bundle.tasks };
  const root = await realpath(resolve(workspace));
  const dir = join(root, ".ases", "tracker-imports");
  const canonicalParent = await realpath(root);
  const rel = relative(canonicalParent, dir);
  if (rel.startsWith(`..${sep}`) || rel === "..") throw new Error("Destino fora do workspace");
  await mkdir(dir, { recursive: true });
  const actualDir = await realpath(dir);
  const actualRelative = relative(root, actualDir);
  if (actualRelative === ".." || actualRelative.startsWith(`..${sep}`)) throw new Error("Destino resolvido fora do workspace");
  const output = join(actualDir, `${basename(source, ".json")}.json`);
  await writeFile(output, `${JSON.stringify(bundle, null, 2)}\n`, { flag: "wx" });
  return { status: "imported", count: bundle.tasks.length, output, tasks: bundle.tasks };
}
