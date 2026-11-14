import { cp, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "integrations");
const destination = join(root, "packages", "cli", "dist", "integrations");
await mkdir(destination, { recursive: true });
for (const host of ["codex", "claude-code", "kimi-code", "gemini-cli"]) {
  await cp(join(source, host), join(destination, host), { recursive: true });
}
