import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "EUREKA42_ASES_FRAMEWORK_PROMPT_MESTRE_ULTRA_COMPLETO.md");
const outputPath = resolve(root, "requirements/framework.yaml");
const source = await readFile(sourcePath, "utf8");
const sourceHash = createHash("sha256").update(source).digest("hex");
const rows = [...source.matchAll(/^\| (AFR-\d{3}) \| (P[0-3]) \| (.+) \|$/gm)];

if (rows.length !== 140) {
  throw new Error(`Esperados 140 AFRs, encontrados ${rows.length}`);
}

function milestoneFor(id) {
  const number = Number(id.slice(4));
  if (number <= 6 || (number >= 28 && number <= 30)) return "M1";
  if (number <= 15) return "M2";
  if (number <= 20) return "M3";
  if (number <= 27) return "M4";
  if (number <= 40) return "M5";
  if (number <= 50) return "M6";
  if (number <= 60) return "M7";
  if (number <= 68) return "M8";
  if (number <= 76) return "M9";
  if (number <= 83) return "M10";
  if (number <= 90 || (number >= 96 && number <= 100)) return "M11";
  if (number <= 95) return "M12";
  if (number <= 110) return "M13";
  return "M15+";
}

const quote = (value) => JSON.stringify(value);
const lines = [
  'schemaVersion: "1"',
  'catalog: "ases-framework-requirements"',
  'status: "DRAFT"',
  `sourceSha256: "${sourceHash}"`,
  'source: "EUREKA42_ASES_FRAMEWORK_PROMPT_MESTRE_ULTRA_COMPLETO.md#16"',
  "requirements:"
];

for (const match of rows) {
  const [, id, priority, summary] = match;
  lines.push(`  - id: ${id}`);
  lines.push(`    priority: ${priority}`);
  lines.push(`    milestone: ${quote(milestoneFor(id))}`);
  lines.push('    owner: "UNASSIGNED"');
  lines.push('    status: "PENDING"');
  lines.push(`    summary: ${quote(summary.trim())}`);
  lines.push("    acceptanceCriteria:");
  lines.push(`      - id: AC-${id}-01`);
  lines.push(`        description: ${quote(`O comportamento deve ser demonstrado por teste ou evidência objetiva: ${summary.trim()}`)}`);
  lines.push('        verification: "automated-or-reviewed"');
  lines.push("    artifacts: []");
  lines.push("    tests: []");
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${lines.join("\n")}\n`);
console.log(`Gerados ${rows.length} requisitos em ${outputPath}`);

