import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const relativePath = "EUREKA42_ASES_FRAMEWORK_PROMPT_MESTRE_ULTRA_COMPLETO.md";
const content = await readFile(resolve(root, relativePath));
const registry = {
  schemaVersion: "1",
  generatedAt: "2026-11-13",
  sources: [
    {
      id: "SRC-001",
      path: relativePath,
      sha256: createHash("sha256").update(content).digest("hex"),
      status: "VALIDATION_REQUIRED",
      role: "proposed-master-execution-spec"
    }
  ]
};
await writeFile(resolve(root, "docs/source-register.json"), `${JSON.stringify(registry, null, 2)}\n`);
console.log("Registro de fontes atualizado");

