import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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
  "integrations/antigravity-cli/plugin.json",
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
const antigravityPlugin = JSON.parse(await readFile(resolve(root, "integrations/antigravity-cli/plugin.json"), "utf8"));
const antigravitySkill = await readFile(resolve(root, "integrations/antigravity-cli/skills/ases-project-start/SKILL.md"), "utf8");
if (antigravityPlugin.displayName !== "EUREKA42 ASES" || antigravityPlugin.logo !== "assets/eureka42-logo.png" || !existsSync(resolve(root, "integrations/antigravity-cli", antigravityPlugin.logo)) || !antigravitySkill.includes("node scripts/welcome.mjs --color") || !antigravitySkill.includes("`PROPOSED`")) throw new Error("Plugin Antigravity sem logo ou onboarding ASES válidos");
const antigravityWelcome = resolve(root, "integrations/antigravity-cli/skills/ases-project-start/scripts/welcome.mjs");
if (!existsSync(antigravityWelcome)) throw new Error("Script welcome local do plugin Antigravity ausente");
const welcomeSyntax = spawnSync(process.execPath, ["--check", antigravityWelcome], { cwd: root, encoding: "utf8" });
if (welcomeSyntax.status !== 0) throw new Error(`Script welcome Antigravity inválido: ${welcomeSyntax.stderr}`);
const antigravityValidator = spawnSync("agy", ["plugin", "validate", "--strict", "./integrations/antigravity-cli"], { cwd: root, encoding: "utf8" });
if (antigravityValidator.error && antigravityValidator.error.code !== "ENOENT") throw antigravityValidator.error;
if (antigravityValidator.status !== null && antigravityValidator.status !== 0) throw new Error(`Antigravity plugin validator failed: ${antigravityValidator.stderr || antigravityValidator.stdout}`);
if (antigravityValidator.error?.code === "ENOENT") console.log("SKIP Antigravity CLI não está instalado; validação estrutural local executada");
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
const reviewFile = "docs/security/marketplace-review.json";
const review = JSON.parse(await readFile(resolve(root, reviewFile), "utf8"));
if (review.schemaVersion !== 1 || review.reviewStatus !== "APPROVED" || !review.reviewedAt || !review.reviewedBy || !Array.isArray(review.findings) || review.findings.length === 0) throw new Error(`Revisão de segurança inválida: ${reviewFile}`);
const reviewedPaths = new Set((review.artifacts ?? []).map((artifact) => artifact.path));
const requiredReviewPaths = [marketplaceFile, codexMarketplaceFile, ...jsonFiles, ".agents/skills/ases-project-start/SKILL.md", "integrations/claude-code/commands/ases-start.md", "integrations/claude-code/skills/ases-project-start/SKILL.md", "integrations/codex/AGENTS.md", "integrations/codex/skills/ases-project-start/SKILL.md", "integrations/gemini-cli/GEMINI.md", "integrations/gemini-cli/commands/ases/start.toml", "integrations/gemini-cli/skills/ases-project-start/SKILL.md", "integrations/kimi-code/skills/ases-project-start/SKILL.md", "integrations/antigravity-cli/README.md", "integrations/antigravity-cli/assets/eureka42-logo.png", "integrations/antigravity-cli/skills/ases-project-start/SKILL.md", "integrations/antigravity-cli/skills/ases-project-start/scripts/welcome.mjs"];
for (const path of requiredReviewPaths) if (!reviewedPaths.has(path)) throw new Error(`Artefato publicado sem revisão de segurança: ${path}`);
for (const artifact of review.artifacts ?? []) {
  if (typeof artifact.path !== "string" || !/^[a-f0-9]{64}$/.test(artifact.sha256 ?? "")) throw new Error(`Artefato de revisão malformado: ${reviewFile}`);
  const digest = createHash("sha256").update(await readFile(resolve(root, artifact.path))).digest("hex");
  if (digest !== artifact.sha256) throw new Error(`Artefato do marketplace mudou desde a revisão; renovar ${reviewFile}: ${artifact.path}`);
}
for (const finding of review.findings) {
  if (!/^MR-\d{3}$/.test(finding.id ?? "") || !["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(finding.severity) || !["DOCUMENTED", "MITIGATED", "ACCEPTED"].includes(finding.status) || typeof finding.detail !== "string" || !finding.detail.trim()) throw new Error(`Achado de segurança inválido: ${reviewFile}`);
  if (["HIGH", "CRITICAL"].includes(finding.severity) && finding.status === "ACCEPTED") throw new Error(`Achado HIGH/CRITICAL não pode ser aceito sem mitigação: ${finding.id}`);
}
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
console.log(`PASS ${jsonFiles.length} manifests CLI, extensão VS Code, 2 marketplaces (${review.findings.length} achados de revisão hash-pinned) e ${skillFiles.length} Skills validados`);

