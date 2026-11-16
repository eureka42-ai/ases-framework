import type { TrackerBundle, TrackerTask } from "./tracker-exchange.js";

export interface RemoteTrackerOptions {
  /** Explicitly set true for every import to allow a network request. */
  enabled: boolean;
  token?: string;
  apiBaseUrl?: string;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number;
  perPage?: number;
  maxPages?: number;
  maxItems?: number;
}

export interface GitHubTrackerOptions extends RemoteTrackerOptions {
  owner: string;
  repository: string;
}

export interface GitLabTrackerOptions extends RemoteTrackerOptions {
  project: string | number;
}

export interface RemoteTrackerImport {
  provider: "github" | "gitlab";
  bundle: TrackerBundle;
  hasMore: boolean;
}

interface PageResult { items: unknown[]; hasMore: boolean }
interface PageRequestOptions extends Required<Pick<RemoteTrackerOptions, "perPage" | "maxPages" | "maxItems" | "timeoutMs">> {
  baseUrl: URL;
  path: string;
  provider: "github" | "gitlab";
  token?: string;
  fetcher: typeof fetch;
  signal?: AbortSignal;
}

const RESPONSE_LIMIT_BYTES = 2 * 1024 * 1024;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

function validateOptions(options: RemoteTrackerOptions): Required<Pick<RemoteTrackerOptions, "enabled" | "perPage" | "maxPages" | "maxItems" | "timeoutMs" | "fetcher">> & Pick<RemoteTrackerOptions, "token" | "apiBaseUrl" | "signal"> {
  if (options.enabled !== true) throw new Error("remote tracker import requires explicit enabled: true");
  const perPage = options.perPage ?? 100;
  const maxPages = options.maxPages ?? 5;
  const maxItems = options.maxItems ?? 500;
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!Number.isSafeInteger(perPage) || perPage < 1 || perPage > 100) throw new Error("perPage must be an integer from 1 to 100");
  if (!Number.isSafeInteger(maxPages) || maxPages < 1 || maxPages > 10) throw new Error("maxPages must be an integer from 1 to 10");
  if (!Number.isSafeInteger(maxItems) || maxItems < 1 || maxItems > 1_000) throw new Error("maxItems must be an integer from 1 to 1000");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60_000) throw new Error("timeoutMs must be an integer from 100 to 60000");
  if (options.token !== undefined && (!options.token.trim() || options.token.length > 2_000 || /[\r\n\0]/.test(options.token))) throw new Error("token must be non-empty and must not contain control characters");
  return { enabled: true, perPage, maxPages, maxItems, timeoutMs, fetcher: options.fetcher ?? fetch, ...(options.token !== undefined ? { token: options.token } : {}), ...(options.apiBaseUrl !== undefined ? { apiBaseUrl: options.apiBaseUrl } : {}), ...(options.signal ? { signal: options.signal } : {}) };
}

function apiBase(value: string | undefined, fallback: string): URL {
  let url: URL;
  try { url = new URL(value ?? fallback); } catch { throw new Error("tracker API base URL is invalid"); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error("tracker API base URL must be HTTPS without credentials, query, or fragment");
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url;
}

function webBase(api: URL, provider: "github" | "gitlab"): URL {
  const url = new URL(api);
  if (provider === "github" && url.hostname === "api.github.com") {
    url.hostname = "github.com";
    url.pathname = "";
  } else if (provider === "github") {
    url.pathname = url.pathname.replace(/\/api\/v3\/?$/, "");
  } else {
    url.pathname = url.pathname.replace(/\/api\/v4\/?$/, "");
  }
  return url;
}

function appendPath(base: URL, path: string, params: URLSearchParams): URL {
  const url = new URL(base);
  url.pathname = `${base.pathname.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  url.search = params.toString();
  return url;
}

async function responseJson(response: Response, provider: string): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error(`${provider} response had no body`);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > RESPONSE_LIMIT_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new Error(`${provider} response exceeded the 2 MiB page limit`);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; }
  catch { throw new Error(`${provider} response was not valid JSON`); }
}

async function fetchPages(options: PageRequestOptions): Promise<PageResult> {
  const items: unknown[] = [];
  const headers = new Headers({ Accept: "application/json" });
  if (options.provider === "github") {
    headers.set("Accept", "application/vnd.github+json");
    headers.set("X-GitHub-Api-Version", "2022-11-28");
    if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  } else if (options.token) headers.set("PRIVATE-TOKEN", options.token);
  let hasMore = false;
  for (let page = 1; page <= options.maxPages && items.length < options.maxItems; page += 1) {
    const params = new URLSearchParams({ state: "all", per_page: String(options.perPage), page: String(page) });
    const url = appendPath(options.baseUrl, options.path, params);
    const timeout = AbortSignal.timeout(options.timeoutMs);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
    let response: Response;
    try { response = await options.fetcher(url, { method: "GET", headers, signal }); }
    catch { throw new Error(`${options.provider} request failed; network details and credentials omitted`); }
    if (!response.ok) throw new Error(`${options.provider} API returned HTTP ${response.status}; response body and credentials omitted`);
    const parsed = await responseJson(response, options.provider);
    if (!Array.isArray(parsed) || parsed.some((item) => !item || typeof item !== "object" || Array.isArray(item))) throw new Error(`${options.provider} response had an invalid page shape`);
    if (parsed.length > options.perPage) throw new Error(`${options.provider} response exceeded the requested page size`);
    items.push(...parsed);
    if (parsed.length < options.perPage) return { items: items.slice(0, options.maxItems), hasMore: false };
    if (items.length >= options.maxItems) { hasMore = true; break; }
    if (page === options.maxPages) hasMore = true;
  }
  return { items: items.slice(0, options.maxItems), hasMore };
}

function record(value: unknown, provider: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${provider} item was not an object`);
  return value as Record<string, unknown>;
}

function boundedText(value: unknown, name: string, max: number): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string" || value.length > max) throw new Error(`tracker ${name} exceeded its ${max} character limit`);
  return value;
}

function labelsFrom(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 100) throw new Error("tracker labels were invalid or exceeded 100 entries");
  return value.map((label) => {
    const item = typeof label === "string" ? label : record(label, "label").name;
    if (typeof item !== "string" || item.length > 100) throw new Error("tracker label was invalid or too long");
    return item;
  });
}

function positiveNumber(value: unknown, name: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) throw new Error(`tracker ${name} was invalid`);
  return value as number;
}

function normalizedStatus(state: unknown): TrackerTask["status"] {
  if (state === "open" || state === "opened") return "open";
  if (state === "closed" || state === "merged") return "done";
  throw new Error("tracker state was unsupported");
}

function makeTask(options: { id: string; title: unknown; description: unknown; status: unknown; labels: unknown; system: string; sourceId: number; url: string }): TrackerTask {
  const title = boundedText(options.title, "title", 500);
  if (!title.trim()) throw new Error("tracker title must not be empty");
  return {
    id: options.id,
    title,
    description: boundedText(options.description, "description", 100_000),
    status: normalizedStatus(options.status),
    labels: labelsFrom(options.labels),
    source: { system: options.system, id: String(options.sourceId), url: options.url },
  };
}

function result(provider: RemoteTrackerImport["provider"], tasks: TrackerTask[], hasMore: boolean): RemoteTrackerImport {
  return { provider, hasMore, bundle: { schemaVersion: "1", format: "eureka42-tracker-tasks", exportedAt: new Date().toISOString(), tasks } };
}

function basePageOptions(provider: "github" | "gitlab", options: RemoteTrackerOptions, path: string, baseUrl: URL): PageRequestOptions {
  const common = validateOptions(options);
  return { provider, path, baseUrl, perPage: common.perPage, maxPages: common.maxPages, maxItems: common.maxItems, timeoutMs: common.timeoutMs, fetcher: common.fetcher, ...(common.token ? { token: common.token } : {}), ...(common.signal ? { signal: common.signal } : {}) };
}

function ownerRepo(owner: string, repository: string): string {
  if (!IDENTIFIER.test(owner) || !IDENTIFIER.test(repository)) throw new Error("GitHub owner and repository must be simple path identifiers");
  return `repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`;
}

function githubTasks(items: unknown[], kind: "issue" | "pull-request", web: URL, owner: string, repository: string): TrackerTask[] {
  return items.map((raw) => {
    const item = record(raw, "GitHub");
    const number = positiveNumber(item.number, "number");
    const path = `${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/${kind === "issue" ? "issues" : "pull"}/${number}`;
    const url = new URL(`${web.pathname.replace(/\/$/, "")}/${path}`, web.origin).toString();
    const id = `github-${kind === "issue" ? "issue" : "pr"}-${number}`;
    return makeTask({ id, title: item.title, description: item.body, status: item.state, labels: item.labels, system: `github-${kind === "issue" ? "issue" : "pr"}`, sourceId: number, url });
  });
}

/** Imports GitHub issues and pull requests with GET requests only; network access requires enabled: true. */
export async function importGitHubWorkItems(options: GitHubTrackerOptions): Promise<RemoteTrackerImport> {
  const base = apiBase(options.apiBaseUrl, "https://api.github.com");
  const web = webBase(base, "github");
  const repository = ownerRepo(options.owner, options.repository);
  const common = validateOptions(options);
  const issues = await fetchPages(basePageOptions("github", options, `${repository}/issues`, base));
  const issueOnly = issues.items.filter((item) => !Object.hasOwn(record(item, "GitHub"), "pull_request"));
  const tasks = githubTasks(issueOnly, "issue", web, options.owner, options.repository);
  let hasMore = issues.hasMore;
  if (tasks.length < common.maxItems) {
    const remaining = common.maxItems - tasks.length;
    const pullsOptions = { ...options, maxItems: remaining };
    const pulls = await fetchPages(basePageOptions("github", pullsOptions, `${repository}/pulls`, base));
    tasks.push(...githubTasks(pulls.items, "pull-request", web, options.owner, options.repository));
    hasMore ||= pulls.hasMore;
  } else hasMore = true;
  return result("github", tasks.slice(0, common.maxItems), hasMore);
}

function gitlabProject(value: string | number): string {
  const project = String(value);
  if (!/^(?:[1-9][0-9]{0,14}|[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*)$/.test(project) || project.split("/").some((part) => part === "." || part === "..")) throw new Error("GitLab project must be a numeric ID or a safe group/project path");
  return encodeURIComponent(project);
}

function gitlabTasks(items: unknown[], kind: "issue" | "merge-request", web: URL, projectPath: string): TrackerTask[] {
  return items.map((raw) => {
    const item = record(raw, "GitLab");
    const iid = positiveNumber(item.iid, "iid");
    const route = kind === "issue" ? "issues" : "merge_requests";
    let url: string;
    if (/^[1-9][0-9]{0,14}$/.test(projectPath)) {
      try {
        const remoteUrl = new URL(boundedText(item.web_url, "web_url", 2_000));
        if (remoteUrl.protocol !== "https:" || remoteUrl.origin !== web.origin) throw new Error();
        url = remoteUrl.toString();
      } catch { throw new Error("GitLab numeric project response did not include a safe same-host web_url"); }
    } else {
      url = new URL(`${web.pathname.replace(/\/$/, "")}/${projectPath}/-/${route}/${iid}`, web.origin).toString();
    }
    return makeTask({
      id: `gitlab-${kind === "issue" ? "issue" : "mr"}-${iid}`,
      title: item.title,
      description: item.description,
      status: kind === "merge-request" && item.state === "merged" ? "merged" : item.state,
      labels: item.labels,
      system: `gitlab-${kind === "issue" ? "issue" : "merge-request"}`,
      sourceId: iid,
      url,
    });
  });
}

/** Imports GitLab issues and merge requests with GET requests only; network access requires enabled: true. */
export async function importGitLabWorkItems(options: GitLabTrackerOptions): Promise<RemoteTrackerImport> {
  const base = apiBase(options.apiBaseUrl, "https://gitlab.com/api/v4");
  const web = webBase(base, "gitlab");
  const project = gitlabProject(options.project);
  const common = validateOptions(options);
  const issuePage = await fetchPages(basePageOptions("gitlab", options, `projects/${project}/issues`, base));
  const tasks = gitlabTasks(issuePage.items, "issue", web, String(options.project));
  let hasMore = issuePage.hasMore;
  if (tasks.length < common.maxItems) {
    const remaining = common.maxItems - tasks.length;
    const mergePage = await fetchPages(basePageOptions("gitlab", { ...options, maxItems: remaining }, `projects/${project}/merge_requests`, base));
    tasks.push(...gitlabTasks(mergePage.items, "merge-request", web, String(options.project)));
    hasMore ||= mergePage.hasMore;
  } else hasMore = true;
  return result("gitlab", tasks.slice(0, common.maxItems), hasMore);
}
