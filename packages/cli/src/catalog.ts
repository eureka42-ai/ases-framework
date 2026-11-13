import { createHash } from "node:crypto";
import { readFile, mkdir, realpath, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export interface GeneralRequirement {
  id: string;
  title: string;
  sourceText: string;
  classification?: string;
  priority?: string;
  applicability?: string;
  acceptanceCriteria?: string;
  source: { path: string; sha256: string };
  status: "PENDING" | "READY" | "IN_PROGRESS" | "IMPLEMENTED" | "VERIFIED" | "FAILED" | "BLOCKED" | "N_A";
  evidence?: Array<{ id: string; kind: string; description: string; sha256?: string; createdAt: string; integrity?: "CURRENT" | "STALE" | "MISSING" | "OUTSIDE_WORKSPACE" | "UNVERIFIABLE" }>;
  traceability?: { decisionRefs: string[]; testRefs: string[] };
  blocker?: { dependency: string; reason: string; createdAt: string };
  waiver?: { justification: string; createdAt: string };
  history?: Array<{ from: string; to: string; at: string }>;
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
    const classification = body.match(/^Classificação sugerida:\s*([A-Z_]+)/mi)?.[1];
    const priority = body.match(/Prioridade sugerida:\s*([A-Z_]+)/i)?.[1];
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
  const catalog = JSON.parse(await readFile(join(resolve(workspace), ".ases", "catalogs", "ases-300.json"), "utf8")) as { source: { path: string; sha256: string }; requirements: GeneralRequirement[] };
  const workspaceRoot = await realpath(resolve(workspace));
  for (const requirement of catalog.requirements) {
    for (const evidence of requirement.evidence ?? []) {
      if (!evidence.sha256 || evidence.kind !== "workspace-file") {
        evidence.integrity = "UNVERIFIABLE";
        continue;
      }
      try {
        const path = resolve(workspaceRoot, evidence.description);
        const canonicalPath = await realpath(path);
        const relativePath = relative(workspaceRoot, canonicalPath);
        if (isAbsolute(evidence.description) || !relativePath || relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
          evidence.integrity = "OUTSIDE_WORKSPACE";
          continue;
        }
        if (!(await stat(canonicalPath)).isFile()) {
          evidence.integrity = "UNVERIFIABLE";
          continue;
        }
        const currentHash = createHash("sha256").update(await readFile(canonicalPath)).digest("hex");
        evidence.integrity = currentHash === evidence.sha256 ? "CURRENT" : "STALE";
      } catch (error) {
        evidence.integrity = (error as NodeJS.ErrnoException).code === "ENOENT" ? "MISSING" : "UNVERIFIABLE";
      }
    }
  }
  return catalog;
}

export async function updateRequirement(workspace: string, id: string, status: GeneralRequirement["status"], options: { evidence?: string; naReason?: string; decisionRefs?: string[]; testRefs?: string[]; blockedBy?: string; blockedReason?: string }): Promise<GeneralRequirement> {
  const path = join(resolve(workspace), ".ases", "catalogs", "ases-300.json");
  const catalog = JSON.parse(await readFile(path, "utf8")) as { source: { path: string; sha256: string }; requirements: GeneralRequirement[] };
  const requirement = catalog.requirements.find((item) => item.id === id);
  if (!requirement) throw new Error(`Requisito inexistente: ${id}`);
  if (status === "VERIFIED" && !options.evidence?.trim()) throw new Error("VERIFIED exige --evidence com caminho de arquivo existente dentro do workspace");
  if (status === "N_A" && !options.naReason?.trim()) throw new Error("N_A exige --na-reason");
  if (status === "BLOCKED" && (!options.blockedBy?.trim() || !options.blockedReason?.trim())) throw new Error("BLOCKED exige --blocked-by e --reason");
  if (status === "VERIFIED") {
    const workspaceRoot = await realpath(resolve(workspace));
    const evidencePath = resolve(workspaceRoot, options.evidence!.trim());
    if (isAbsolute(options.evidence!.trim())) throw new Error("A evidência precisa estar dentro do workspace");
    const canonicalEvidencePath = await realpath(evidencePath);
    const evidenceRelativePath = relative(workspaceRoot, canonicalEvidencePath);
    if (!evidenceRelativePath || evidenceRelativePath === ".." || evidenceRelativePath.startsWith(`..${sep}`) || isAbsolute(evidenceRelativePath)) {
      throw new Error("A evidência precisa estar dentro do workspace");
    }
    if (!(await stat(canonicalEvidencePath)).isFile()) throw new Error("A evidência precisa ser um arquivo regular");
    const evidenceBytes = await readFile(canonicalEvidencePath);
    requirement.evidence = [...(requirement.evidence ?? []), { id: `EVD-${Date.now()}`, kind: "workspace-file", description: options.evidence!.trim(), sha256: createHash("sha256").update(evidenceBytes).digest("hex"), createdAt: new Date().toISOString() }];
  }
  if (status === "N_A") requirement.waiver = { justification: options.naReason!.trim(), createdAt: new Date().toISOString() };
  if (status === "BLOCKED") requirement.blocker = { dependency: options.blockedBy!.trim(), reason: options.blockedReason!.trim(), createdAt: new Date().toISOString() };
  else delete requirement.blocker;
  if (options.decisionRefs?.length || options.testRefs?.length) {
    requirement.traceability = {
      decisionRefs: [...new Set([...(requirement.traceability?.decisionRefs ?? []), ...(options.decisionRefs ?? []).map((ref) => ref.trim()).filter(Boolean)])],
      testRefs: [...new Set([...(requirement.traceability?.testRefs ?? []), ...(options.testRefs ?? []).map((ref) => ref.trim()).filter(Boolean)])]
    };
  }
  requirement.history = [...(requirement.history ?? []), { from: requirement.status, to: status, at: new Date().toISOString() }];
  requirement.status = status;
  await writeFile(path, `${JSON.stringify({ schemaVersion: "1", catalog: "ases-300", source: catalog.source, status: "IMPORTED_NOT_HOMOLOGATED", requirements: catalog.requirements }, null, 2)}\n`);
  return requirement;
}

