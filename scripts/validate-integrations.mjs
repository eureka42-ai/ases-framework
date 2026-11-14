import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const marketplaceFile = ".claude-plugin/marketplace.json";
const jsonFiles = [
  "integrations/claude-code/.claude-plugin/plugin.json",
  "integrations/kimi-code/kimi.plugin.json",
  "integrations/gemini-cli/gemini-extension.json"
];
const skillFiles = [
  ".agents/skills/ases-project-start/SKILL.md",
  "integrations/claude-code/skills/ases-project-start/SKILL.md",
  "integrations/kimi-code/skills/ases-project-start/SKILL.md",
  "integrations/gemini-cli/skills/ases-project-start/SKILL.md",
  "integrations/codex/.agents/skills/ases-project-start/SKILL.md"
];

for (const relative of jsonFiles) {
  const parsed = JSON.parse(await readFile(resolve(root, relative), "utf8"));
  if (parsed.name !== "eureka42-ases" || typeof parsed.version !== "string") {
    throw new Error(`Manifest inválido: ${relative}`);
  }
}
const marketplace = JSON.parse(await readFile(resolve(root, marketplaceFile), "utf8"));
const claudeEntry = marketplace.plugins?.find((plugin) => plugin.name === "eureka42-ases" && plugin.source === "./integrations/claude-code");
if (marketplace.name !== "eureka42-ases-plugins" || !claudeEntry || (await readFile(resolve(root, claudeEntry.source, ".claude-plugin/plugin.json"), "utf8")).length === 0) throw new Error(`Marketplace inválido: ${marketplaceFile}`);
let canonicalSkill;
for (const relative of skillFiles) {
  const content = await readFile(resolve(root, relative), "utf8");
  if (!content.startsWith("---\nname: ases-project-start\n") || !content.includes("`PROPOSED`")) throw new Error(`Skill inválida: ${relative}`);
  if (canonicalSkill === undefined) canonicalSkill = content;
  else if (content !== canonicalSkill) throw new Error(`Skills divergentes; sincronize com .agents/skills/ases-project-start/SKILL.md: ${relative}`);
}
if (existsSync(resolve(root, "integrations/claude-code/.claude-plugin/plugin.json"))) {
  const validation = spawnSync("claude", ["plugin", "validate", "integrations/claude-code", "--strict"], { cwd: root, encoding: "utf8" });
  if (validation.error && validation.error.code !== "ENOENT") throw validation.error;
  if (validation.status !== null && validation.status !== 0) throw new Error(`Claude plugin validator failed: ${validation.stderr || validation.stdout}`);
  if (validation.error?.code === "ENOENT") console.log("SKIP Claude Code CLI não está instalado; validação estrutural local executada");
}
console.log(`PASS ${jsonFiles.length} manifests, 1 marketplace e ${skillFiles.length} Skills validados`);

