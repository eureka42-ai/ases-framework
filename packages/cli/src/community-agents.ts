import type { AgentPermission } from "./agents.js";

export interface CommunityAgentRelease {
  id: string;
  version: string;
  name: string;
  description: string;
  publisher: string;
  source: string;
  apiVersion: string;
  categories: readonly string[];
  capabilities: readonly string[];
  permissions: readonly AgentPermission[];
}

export interface CommunityAgentCatalogOptions {
  runtimeApiVersion: string;
  trustedSources: readonly string[];
}

export interface DiscoveredCommunityAgent extends CommunityAgentRelease {
  trust: "TRUSTED_SOURCE" | "UNTRUSTED_SOURCE";
  compatible: boolean;
}

export interface CommunityAgentQuery {
  text?: string;
  category?: string;
  capability?: string;
  compatibleOnly?: boolean;
}

const ID = /^[a-z][a-z0-9-]{1,62}$/;
const IDENTIFIER = "(?:0|[1-9]\\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)";
const VERSION = new RegExp(`^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-(${IDENTIFIER}(?:\\.${IDENTIFIER})*))?(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$`);
const TAG = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const PERMISSIONS = new Set<AgentPermission>(["workspace.read", "workspace.write", "network", "command.execute"]);

function versionParts(value: string): [number, number, number, string | undefined] | undefined {
  const match = VERSION.exec(value);
  if (!match) return undefined;
  return [Number(match[1]), Number(match[2]), Number(match[3]), match[4]];
}

function compareVersions(left: string, right: string): number {
  const a = versionParts(left)!;
  const b = versionParts(right)!;
  for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return (a[index]! as number) < (b[index]! as number) ? -1 : 1;
  if (a[3] === b[3]) return 0;
  if (a[3] === undefined) return 1;
  if (b[3] === undefined) return -1;
  const ap = a[3].split(".");
  const bp = b[3].split(".");
  for (let index = 0; index < Math.max(ap.length, bp.length); index += 1) {
    const av = ap[index];
    const bv = bp[index];
    if (av === undefined) return -1;
    if (bv === undefined) return 1;
    if (av === bv) continue;
    const an = /^\d+$/.test(av);
    const bn = /^\d+$/.test(bv);
    if (an && bn) return Number(av) < Number(bv) ? -1 : 1;
    if (an !== bn) return an ? -1 : 1;
    return av < bv ? -1 : 1;
  }
  return 0;
}

function compatible(agentApi: string, runtimeApi: string): boolean {
  const agent = versionParts(agentApi);
  const runtime = versionParts(runtimeApi);
  return Boolean(agent && runtime && agent[0] === runtime[0] && compareVersions(agentApi, runtimeApi) <= 0);
}

function validateRelease(release: CommunityAgentRelease): void {
  if (!release || !ID.test(release.id) || !versionParts(release.version)) throw new TypeError("community agent id or semantic version is invalid");
  if (!release.name.trim() || release.name.length > 120 || !release.description.trim() || release.description.length > 2_000) throw new TypeError(`community agent metadata is invalid: ${release.id}`);
  if (!release.publisher.trim() || release.publisher.length > 120 || !release.source.trim() || release.source.length > 512) throw new TypeError(`community agent provenance is invalid: ${release.id}`);
  if (!versionParts(release.apiVersion)) throw new TypeError(`community agent API version is invalid: ${release.id}`);
  for (const [label, values] of [["categories", release.categories], ["capabilities", release.capabilities], ["permissions", release.permissions]] as const) {
    if (!Array.isArray(values) || values.length > 64 || new Set(values).size !== values.length) throw new TypeError(`community agent ${label} must be unique and bounded: ${release.id}`);
  }
  if (release.categories.some((value) => !TAG.test(value)) || release.capabilities.some((value) => !TAG.test(value)) || release.permissions.some((value) => !PERMISSIONS.has(value))) throw new TypeError(`community agent declares invalid categories, capabilities, or permissions: ${release.id}`);
}

/** Creates a local metadata catalog. Discovery never downloads, installs, or executes a community agent. */
export function createCommunityAgentCatalog(releases: readonly CommunityAgentRelease[], options: CommunityAgentCatalogOptions) {
  if (!versionParts(options.runtimeApiVersion)) throw new TypeError("runtime API version must be semantic versioning");
  const seen = new Set<string>();
  const entries: DiscoveredCommunityAgent[] = releases.map((release) => {
    validateRelease(release);
    const key = `${release.id}@${release.version}`;
    if (seen.has(key)) throw new TypeError(`duplicate community agent release: ${key}`);
    seen.add(key);
    return {
      ...release,
      categories: [...release.categories],
      capabilities: [...release.capabilities],
      permissions: [...release.permissions],
      trust: options.trustedSources.includes(release.source) ? "TRUSTED_SOURCE" as const : "UNTRUSTED_SOURCE" as const,
      compatible: compatible(release.apiVersion, options.runtimeApiVersion),
    };
  }).sort((a, b) => a.id.localeCompare(b.id) || compareVersions(b.version, a.version));

  return Object.freeze({
    list(query: CommunityAgentQuery = {}): DiscoveredCommunityAgent[] {
      const text = query.text?.trim().toLocaleLowerCase("en-US");
      return entries.filter((entry) => (!text || `${entry.id} ${entry.name} ${entry.description} ${entry.publisher}`.toLocaleLowerCase("en-US").includes(text))
        && (!query.category || entry.categories.includes(query.category))
        && (!query.capability || entry.capabilities.includes(query.capability))
        && (query.compatibleOnly !== true || entry.compatible)).map((entry) => ({ ...entry, categories: [...entry.categories], capabilities: [...entry.capabilities], permissions: [...entry.permissions] }));
    },
    versions(id: string): DiscoveredCommunityAgent[] {
      return entries.filter((entry) => entry.id === id).map((entry) => ({ ...entry, categories: [...entry.categories], capabilities: [...entry.capabilities], permissions: [...entry.permissions] }));
    },
    latest(id: string): DiscoveredCommunityAgent | undefined {
      const candidates = entries.filter((entry) => entry.id === id && entry.compatible);
      const latest = candidates[0];
      return latest ? { ...latest, categories: [...latest.categories], capabilities: [...latest.capabilities], permissions: [...latest.permissions] } : undefined;
    },
  });
}
