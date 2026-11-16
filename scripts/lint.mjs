import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

try {
  execFileSync("git", ["grep", "-nI", "-E", "[[:blank:]]+$", "--", ":!pnpm-lock.yaml"], { stdio: "pipe" });
  process.stderr.write("Lint failed: tracked source contains trailing whitespace.\n");
  process.exitCode = 1;
} catch (error) {
  if (error.status !== 1) throw error;
}

for (const entry of await readdir(new URL("../scripts/", import.meta.url), { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith(".mjs")) {
    execFileSync(process.execPath, ["--check", fileURLToPath(new URL(`../scripts/${entry.name}`, import.meta.url))], { stdio: "pipe" });
  }
}

execFileSync(process.execPath, ["--check", fileURLToPath(new URL("../integrations/cloudflare-sandbox/src/index.mjs", import.meta.url))], { stdio: "pipe" });

if (!process.exitCode) process.stdout.write("PASS lint (whitespace + script syntax)\n");
