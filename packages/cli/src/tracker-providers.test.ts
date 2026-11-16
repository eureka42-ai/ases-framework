import assert from "node:assert/strict";
import test from "node:test";
import { importGitHubWorkItems, importGitLabWorkItems } from "./tracker-providers.js";

function page(items: unknown[]): Response { return new Response(JSON.stringify(items), { status: 200, headers: { "content-type": "application/json" } }); }

test("remote tracker imports require explicit opt-in and make no request otherwise", async () => {
  let called = false;
  await assert.rejects(importGitHubWorkItems({ enabled: false, owner: "eureka42", repository: "ases", fetcher: async () => { called = true; return page([]); } }), /enabled: true/);
  assert.equal(called, false);
});

test("GitHub import separates issues from pull requests and only sends GET", async () => {
  const requests: Array<{ url: URL; init: RequestInit | undefined }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input)); requests.push({ url, init });
    return url.pathname.endsWith("/issues") ? page([
      { number: 3, title: "Issue", body: "details", state: "open", labels: [{ name: "bug" }] },
      { number: 4, title: "PR excluded from issues endpoint", body: null, state: "closed", labels: [], pull_request: { url: "https://api.github.com" } },
    ]) : page([{ number: 5, title: "Pull request", body: "change", state: "closed", labels: [] }]);
  };
  const result = await importGitHubWorkItems({ enabled: true, owner: "eureka42", repository: "ases", token: "secret-token", perPage: 10, fetcher });
  assert.deepEqual(result.bundle.tasks.map((task) => [task.id, task.status, task.source.url]), [
    ["github-issue-3", "open", "https://github.com/eureka42/ases/issues/3"],
    ["github-pr-5", "done", "https://github.com/eureka42/ases/pull/5"],
  ]);
  assert.equal(requests.length, 2);
  assert.ok(requests.every(({ init }) => init?.method === "GET"));
  assert.equal((requests[0]?.init?.headers as Headers).get("Authorization"), "Bearer secret-token");
  assert.equal((requests[0]?.init?.headers as Headers).get("X-GitHub-Api-Version"), "2022-11-28");
});

test("GitHub pagination and item caps are bounded and disclose truncation", async () => {
  const urls: URL[] = [];
  const result = await importGitHubWorkItems({ enabled: true, owner: "owner", repository: "repo", perPage: 1, maxPages: 1, maxItems: 1, fetcher: async (input) => { urls.push(new URL(String(input))); return page([{ number: 1, title: "One", body: "", state: "open", labels: [] }]); } });
  assert.equal(result.bundle.tasks.length, 1);
  assert.equal(result.hasMore, true);
  assert.equal(urls[0]?.searchParams.get("per_page"), "1");
  assert.equal(urls[0]?.searchParams.get("page"), "1");
});

test("GitLab import supports subgroup paths, issue and merged MR mapping", async () => {
  const requests: URL[] = [];
  const result = await importGitLabWorkItems({ enabled: true, project: "eureka42/platform/ases", apiBaseUrl: "https://gitlab.com/api/v4", fetcher: async (input) => {
    const url = new URL(String(input)); requests.push(url);
    return url.pathname.endsWith("/issues") ? page([{ iid: 8, title: "Issue", description: "desc", state: "opened", labels: ["bug"] }]) : page([{ iid: 9, title: "MR", description: "merged", state: "merged", labels: [] }]);
  } });
  assert.equal(requests[0]?.pathname, "/api/v4/projects/eureka42%2Fplatform%2Fases/issues");
  assert.deepEqual(result.bundle.tasks.map((task) => [task.id, task.status, task.source.url]), [
    ["gitlab-issue-8", "open", "https://gitlab.com/eureka42/platform/ases/-/issues/8"],
    ["gitlab-mr-9", "done", "https://gitlab.com/eureka42/platform/ases/-/merge_requests/9"],
  ]);
});

test("GitLab self-managed HTTPS endpoint and private token header are honored", async () => {
  let request: { url: URL; init: RequestInit | undefined } | undefined;
  await importGitLabWorkItems({ enabled: true, project: 42, apiBaseUrl: "https://git.example.test/gitlab/api/v4", token: "gitlab-secret", fetcher: async (input, init) => { request = { url: new URL(String(input)), init }; return page([]); } });
  assert.equal(request?.url.origin, "https://git.example.test");
  assert.equal((request?.init?.headers as Headers).get("PRIVATE-TOKEN"), "gitlab-secret");
});

test("GitLab numeric project links come from same-host API web_url", async () => {
  const result = await importGitLabWorkItems({ enabled: true, project: 42, fetcher: async (input) => new URL(String(input)).pathname.endsWith("/issues")
    ? page([{ iid: 2, title: "Issue", description: "", state: "opened", labels: [], web_url: "https://gitlab.com/group/project/-/issues/2" }])
    : page([]) });
  assert.equal(result.bundle.tasks[0]?.source.url, "https://gitlab.com/group/project/-/issues/2");
  await assert.rejects(importGitLabWorkItems({ enabled: true, project: 42, fetcher: async (input) => new URL(String(input)).pathname.endsWith("/issues")
    ? page([{ iid: 2, title: "Issue", description: "", state: "opened", labels: [], web_url: "https://attacker.invalid/x" }])
    : page([]) }), /same-host/);
});

test("provider errors omit response body and reject insecure or malformed configuration", async () => {
  await assert.rejects(importGitHubWorkItems({ enabled: true, owner: "owner", repository: "repo", apiBaseUrl: "http://api.github.com" }), /HTTPS/);
  await assert.rejects(importGitHubWorkItems({ enabled: true, owner: "../owner", repository: "repo" }), /identifiers/);
  await assert.rejects(importGitLabWorkItems({ enabled: true, project: "../secret" }), /safe group\/project/);
  await assert.rejects(importGitHubWorkItems({ enabled: true, owner: "owner", repository: "repo", fetcher: async () => new Response("private error detail", { status: 403 }) }), (error: Error) => error.message.includes("HTTP 403") && !error.message.includes("private error detail"));
});

test("provider response limits and malformed task shapes fail closed", async () => {
  await assert.rejects(importGitHubWorkItems({ enabled: true, owner: "owner", repository: "repo", fetcher: async () => page([{ number: 1, title: "", body: "", state: "open", labels: [] }]) }), /title/);
  await assert.rejects(importGitLabWorkItems({ enabled: true, project: 1, fetcher: async () => new Response("x".repeat(2 * 1024 * 1024 + 1)) }), /2 MiB/);
});
