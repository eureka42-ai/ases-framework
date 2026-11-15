import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { parseSkillFrontmatter } from "./skill-schema.mjs";

const root = resolve(import.meta.dirname, "..");
const marketplaceFile = ".claude-plugin/marketplace.json";
const jsonFiles = [
  "integrations/claude-code/.claude-plugin/plugin.json",
  "integrations/kimi-code/kimi.plugin.json",
  "integrations/gemini-cli/gemini-extension.json",
  "integrations/codex/plugin.json"
];
const skillFiles = [
  ".agents/skills/ases-project-start/SKILL.md",
  "integrations/claude-code/skills/ases-project-start/SKILL.md",
  "integrations/codex/.agents/skills/ases-project-start/SKILL.md",
  "integrations/kimi-code/skills/ases-project-start/SKILL.md",
  "integrations/gemini-cli/skills/ases-project-start/SKILL.md",
  "integrations/codex/skills/ases-project-start/SKILL.md"
];
const cliPackage = JSON.parse(await readFile(resolve(root, "packages/cli/package.json"), "utf8"));
const vscodePackage = JSON.parse(await readFile(resolve(root, "integrations/vscode/package.json"), "utf8"));
const vscodeEntry = await readFile(resolve(root, "integrations/vscode/extension.js"), "utf8");
if (vscodePackage.publisher !== "eureka42" || vscodePackage.name !== "eureka42-ases" || vscodePackage.version !== cliPackage.version || vscodePackage.main !== "./extension.js" || !vscodePackage.contributes?.commands?.some((command) => command.command === "ases.startProject")) throw new Error("Manifest da extensão VS Code inválido ou com versão divergente");
if (!vscodeEntry.includes('"ases welcome --color && ases interview"') || !vscodeEntry.includes("workspace.uri.fsPath")) throw new Error("A extensão VS Code precisa exibir a marca e iniciar a entrevista no workspace aberto");
const versionSource = await readFile(resolve(root, "packages/cli/src/version.ts"), "utf8");
const sourceVersion = versionSource.match(/VERSION\s*=\s*"([^"]+)"/)?.[1];
if (!sourceVersion || sourceVersion !== cliPackage.version) throw new Error("Versão da CLI diverge de packages/cli/package.json");

for (const relative of jsonFiles) {
  const parsed = JSON.parse(await readFile(resolve(root, relative), "utf8"));
  if (parsed.name !== "eureka42-ases" || parsed.version !== cliPackage.version) {
    throw new Error(`Manifest inválido: ${relative}`);
  }
}
const marketplace = JSON.parse(await readFile(resolve(root, marketplaceFile), "utf8"));
const claudeEntry = marketplace.plugins?.find((plugin) => plugin.name === "eureka42-ases" && plugin.source === "./integrations/claude-code");
if (marketplace.name !== "eureka42-ases-plugins" || !claudeEntry || (await readFile(resolve(root, claudeEntry.source, ".claude-plugin/plugin.json"), "utf8")).length === 0) throw new Error(`Marketplace inválido: ${marketplaceFile}`);
const codexMarketplaceFile = ".agents/plugins/marketplace.json";
const codexMarketplace = JSON.parse(await readFile(resolve(root, codexMarketplaceFile), "utf8"));
const codexEntry = codexMarketplace.plugins?.find((plugin) => plugin.name === "eureka42-ases" && plugin.source?.source === "local" && plugin.source.path === "./integrations/codex");
if (codexMarketplace.name !== "eureka42-codex-plugins" || !codexEntry || codexEntry.policy?.installation !== "AVAILABLE" || codexEntry.policy?.authentication !== "ON_INSTALL") throw new Error(`Marketplace Codex inválido: ${codexMarketplaceFile}`);
const codexManifest = JSON.parse(await readFile(resolve(root, "integrations/codex/plugin.json"), "utf8"));
if (codexManifest.extensions?.["com.openai"]?.onboardingSkill !== "./skills/ases-project-start/SKILL.md") throw new Error("Onboarding Skill do plugin Codex inválido");
let canonicalSkill;
for (const relative of skillFiles) {
  const content = await readFile(resolve(root, relative), "utf8");
  if (parseSkillFrontmatter(content).name !== "ases-project-start" || !content.includes("`PROPOSED`") || !content.includes("ases welcome --color")) throw new Error(`Skill inválida ou sem abertura visual verde: ${relative}`);
  if (canonicalSkill === undefined) canonicalSkill = content;
  else if (content !== canonicalSkill) throw new Error(`Skills divergentes; sincronize com .agents/skills/ases-project-start/SKILL.md: ${relative}`);
}
const hostEntrypoints = [
  "integrations/claude-code/commands/ases-start.md",
  "integrations/codex/AGENTS.md",
  "integrations/gemini-cli/GEMINI.md",
  "integrations/gemini-cli/commands/ases/start.toml",
];
for (const relative of hostEntrypoints) {
  if (!(await readFile(resolve(root, relative), "utf8")).includes("ases welcome --color")) throw new Error(`Entry point deve apresentar o logo verde no início: ${relative}`);
}
const kimiPlugin = JSON.parse(await readFile(resolve(root, "integrations/kimi-code/kimi.plugin.json"), "utf8"));
if (!kimiPlugin.systemPrompt?.includes("ases welcome --color")) throw new Error("Kimi sessionStart deve apresentar o logo verde no início");
if (existsSync(resolve(root, "integrations/claude-code/.claude-plugin/plugin.json"))) {
  const validation = spawnSync("claude", ["plugin", "validate", "integrations/claude-code", "--strict"], { cwd: root, encoding: "utf8" });
  if (validation.error && validation.error.code !== "ENOENT") throw validation.error;
  if (validation.status !== null && validation.status !== 0) throw new Error(`Claude plugin validator failed: ${validation.stderr || validation.stdout}`);
  if (validation.error?.code === "ENOENT") console.log("SKIP Claude Code CLI não está instalado; validação estrutural local executada");
}
console.log(`PASS ${jsonFiles.length} manifests CLI, extensão VS Code, 2 marketplaces e ${skillFiles.length} Skills validados`);

