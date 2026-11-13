import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

export interface GeneralRequirement {
  id: string;
  title: string;
  sourceText: string;
  classification?: string;
  priority?: string;
  applicability?: string;
  acceptanceCriteria?: string;
  source: { path: string; sha256: string };
  status: "PENDING";
}

export async function importAses300(sourcePath: string, workspace: string): Promise<{ count: number; hash: string; output: string }> {
  const source = await readFile(resolve(sourcePath), "utf8");
  const hash = createHash("sha256").update(source).digest("hex");
  const headings = [...source.matchAll(/^###\s+(REQ-(\d{3}))\s+[—-]\s+(.+)$/gm)];
  const requirements: GeneralRequirement[] = headings.map((heading, index) => {
    const start = heading.index! + heading[0].length;
    const end = headings[index + 1]?.index ?? source.length;
    const body = source.slice(start, end).trim();
    const value = (label: string) => body.match(new RegExp(`^${label}:\\s*([^\\n]+)`, "mi"))?.[1]?.trim();
    const classification = value("Classificação sugerida");
    const priority = value("Prioridade sugerida");
    const applicability = value("Aplicabilidade");
    const acceptanceCriteria = value("Critério de aceite mínimo");
    return {
      id: heading[1]!,
      title: heading[3]!.trim(),
      sourceText: body,
      ...(classification ? { classification } : {}),
      ...(priority ? { priority } : {}),
      ...(applicability ? { applicability } : {}),
      ...(acceptanceCriteria ? { acceptanceCriteria } : {}),
      source: { path: basename(sourcePath), sha256: hash },
      status: "PENDING"
    };
  });
  const ids = new Set(requirements.map((item) => item.id));
  const missing = Array.from({ length: 300 }, (_, i) => `REQ-${String(i + 1).padStart(3, "0")}`).filter((id) => !ids.has(id));
  const duplicates = requirements.length - ids.size;
  if (requirements.length !== 300 || missing.length || duplicates) throw new Error(`Catálogo inválido: encontrados=${requirements.length}, ausentes=${missing.join(",") || "nenhum"}, duplicados=${duplicates}`);
  const output = join(resolve(workspace), ".ases", "catalogs", "ases-300.json");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify({ schemaVersion: "1", catalog: "ases-300", source: { path: basename(sourcePath), sha256: hash }, status: "IMPORTED_NOT_HOMOLOGATED", requirements }, null, 2)}\n`, { flag: "wx" });
  return { count: requirements.length, hash, output };
}

export async function readCatalog(workspace: string): Promise<{ source: { path: string; sha256: string }; requirements: GeneralRequirement[] }> {
  return JSON.parse(await readFile(join(resolve(workspace), ".ases", "catalogs", "ases-300.json"), "utf8")) as { source: { path: string; sha256: string }; requirements: GeneralRequirement[] };
}

