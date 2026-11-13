import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
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
  if (parsed.name !== "eureka42-ases" || typeof parsed.version !== "string") throw new Error(`Manifest inválido: ${relative}`);
}
for (const relative of skillFiles) {
  const content = await readFile(resolve(root, relative), "utf8");
  if (!content.startsWith("---\nname: ases-project-start\n") || !content.includes("`PROPOSED`")) throw new Error(`Skill inválida: ${relative}`);
}
console.log(`PASS ${jsonFiles.length} manifests e ${skillFiles.length} Skills validados`);

