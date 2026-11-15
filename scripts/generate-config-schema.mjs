import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateAsesConfigJsonSchema } from "../packages/cli/dist/config-schema.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(process.argv[2] ?? `${root}/schemas/ases.config.schema.json`);
await writeFile(output, `${JSON.stringify(generateAsesConfigJsonSchema(), null, 2)}\n`, { encoding: "utf8", mode: 0o644 });
process.stdout.write(`Generated ${output}\n`);
