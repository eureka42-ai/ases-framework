import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateAsesConfigJsonSchema } from "../packages/cli/dist/config-schema.js";

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, child]) => `${JSON.stringify(key)}:${canonical(child)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = resolve(root, "schemas/ases.config.schema.json");
const artifact = JSON.parse(await readFile(path, "utf8"));
if (canonical(artifact) !== canonical(generateAsesConfigJsonSchema())) {
  process.stderr.write("Config JSON Schema is out of sync. Run `pnpm schema:generate` and review the result.\n");
  process.exitCode = 1;
} else {
  process.stdout.write("PASS generated config JSON Schema is in sync\n");
}
