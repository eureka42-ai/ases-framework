import { basename } from "node:path";

export type ResolvedProjectConfig = {
  schemaVersion: "1";
  project: {
    id: string;
    name: string;
    locale: "pt-BR" | "en-US";
    mode: "host" | "standalone" | "headless" | "offline";
    privacy: "local-only";
  };
};

export type ConfigKey = "project.id" | "project.name" | "project.locale" | "project.mode" | "project.privacy";
export type ConfigLayer = { key: ConfigKey | "schemaVersion"; value: string; source: string };

const environmentKeys: Partial<Record<ConfigKey, string>> = {
  "project.id": "ASES_PROJECT_ID",
  "project.name": "ASES_PROJECT_NAME",
  "project.locale": "ASES_PROJECT_LOCALE",
  "project.mode": "ASES_PROJECT_MODE"
};

const configKeys = new Set<ConfigKey>(["project.id", "project.name", "project.locale", "project.mode", "project.privacy"]);
const projectProperties = new Set(["id", "name", "locale", "mode", "privacy"]);

function slugify(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ases-project";
}

export function resolveConfigLayers(options: {
  root: string;
  fileConfig?: unknown;
  fileSource?: string;
  env?: NodeJS.ProcessEnv;
  flags?: string[];
}): { config: ResolvedProjectConfig; resolved: ConfigLayer[]; errors: string[] } {
  const projectName = basename(options.root) || "ases-project";
  const config: ResolvedProjectConfig = {
    schemaVersion: "1",
    project: { id: slugify(projectName), name: projectName, locale: "pt-BR", mode: "host", privacy: "local-only" }
  };
  const sources = new Map<ConfigKey | "schemaVersion", string>([
    ["schemaVersion", "default"], ["project.id", "default"], ["project.name", "default"],
    ["project.locale", "default"], ["project.mode", "default"], ["project.privacy", "default"]
  ]);
  const inputErrors: string[] = [];

  if (options.fileConfig !== undefined) {
    if (!options.fileConfig || typeof options.fileConfig !== "object" || Array.isArray(options.fileConfig)) {
      return { config, resolved: [], errors: ["configuração deve ser um objeto JSON"] };
    }
    const raw = options.fileConfig as Record<string, unknown>;
    for (const key of Object.keys(raw)) if (key !== "schemaVersion" && key !== "project") inputErrors.push(`propriedade não permitida: ${key}`);
    if (raw.schemaVersion !== undefined) {
      config.schemaVersion = raw.schemaVersion as "1";
      sources.set("schemaVersion", options.fileSource ?? "file");
    }
    if (raw.project !== undefined) {
      if (!raw.project || typeof raw.project !== "object" || Array.isArray(raw.project)) return { config, resolved: [], errors: ["project deve ser um objeto"] };
      const project = raw.project as Record<string, unknown>;
      for (const key of Object.keys(project)) if (!projectProperties.has(key)) inputErrors.push(`propriedade project não permitida: ${key}`);
      for (const key of ["id", "name", "locale", "mode", "privacy"] as const) {
        if (project[key] !== undefined) {
          (config.project as unknown as Record<string, unknown>)[key] = project[key];
          sources.set(`project.${key}`, options.fileSource ?? "file");
        }
      }
    }
  }

  for (const key of configKeys) {
    const envKey = environmentKeys[key];
    const value = envKey ? options.env?.[envKey]?.trim() : undefined;
    if (value) {
      (config.project as unknown as Record<string, unknown>)[key.slice("project.".length)] = value;
      sources.set(key, `env:${envKey}`);
    }
  }

  for (const entry of options.flags ?? []) {
    const separator = entry.indexOf("=");
    const key = separator < 0 ? entry : entry.slice(0, separator);
    const value = separator < 0 ? "" : entry.slice(separator + 1);
    if (!configKeys.has(key as ConfigKey)) return { config, resolved: [], errors: [`chave de configuração não permitida: ${key}`] };
    if (!value.trim()) return { config, resolved: [], errors: [`valor vazio para ${key}`] };
    (config.project as unknown as Record<string, unknown>)[key.slice("project.".length)] = value;
    sources.set(key as ConfigKey, "flag:--set");
  }

  const resolved: ConfigLayer[] = [
    { key: "schemaVersion", value: String(config.schemaVersion), source: sources.get("schemaVersion")! },
    { key: "project.id", value: String(config.project.id), source: sources.get("project.id")! },
    { key: "project.name", value: String(config.project.name), source: sources.get("project.name")! },
    { key: "project.locale", value: String(config.project.locale), source: sources.get("project.locale")! },
    { key: "project.mode", value: String(config.project.mode), source: sources.get("project.mode")! },
    { key: "project.privacy", value: String(config.project.privacy), source: sources.get("project.privacy")! }
  ];
  const errors: string[] = [...inputErrors];
  if (config.schemaVersion !== "1") errors.push("schemaVersion deve ser '1'");
  if (typeof config.project.id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(config.project.id)) errors.push("project.id deve usar letras minúsculas, números e hífens");
  if (typeof config.project.name !== "string" || !config.project.name.trim()) errors.push("project.name é obrigatório");
  if (config.project.locale !== "pt-BR" && config.project.locale !== "en-US") errors.push("project.locale inválido");
  if (!["host", "standalone", "headless", "offline"].includes(config.project.mode)) errors.push("project.mode inválido");
  if (config.project.privacy !== "local-only") errors.push("project.privacy deve ser 'local-only' nesta versão");
  return { config, resolved, errors };
}
