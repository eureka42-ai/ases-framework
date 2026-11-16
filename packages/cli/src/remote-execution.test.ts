import assert from "node:assert/strict";
import test from "node:test";
import { createRemoteExecutionClient } from "./remote-execution.js";

const token = "t".repeat(48);

test("remote execution is disabled until explicitly enabled at construction and invocation", async () => {
  assert.throws(() => createRemoteExecutionClient({ enabled: false as true, endpoint: "https://sandbox.example.test/run", token }), /explicit enabled/);
  let calls = 0;
  const client = createRemoteExecutionClient({ enabled: true, endpoint: "https://sandbox.example.test/run", token, fetcher: async () => { calls += 1; return Response.json({ stdout: "", stderr: "", exitCode: 0, durationMs: 1 }); } });
  await assert.rejects(client.execute({ enabled: false as true, argv: ["node", "-v"] }), /explicit enabled/);
  assert.equal(calls, 0);
});

test("remote execution sends argv and reviewed files as structured input and validates bounded output", async () => {
  let observed: { url: string; init?: RequestInit } | undefined;
  const client = createRemoteExecutionClient({
    enabled: true, endpoint: "https://sandbox.example.test/v1/execute", token,
    fetcher: async (input, init) => { observed = init ? { url: String(input), init } : { url: String(input) }; return Response.json({ stdout: "hello", stderr: "", exitCode: 0, durationMs: 23 }); },
  });
  const result = await client.execute({ enabled: true, argv: ["node", "scripts/check.js", "--safe"], cwd: "project", files: [{ path: "project/scripts/check.js", content: "console.log('hello')" }], timeoutMs: 20_000 });
  assert.deepEqual(result, { stdout: "hello", stderr: "", exitCode: 0, durationMs: 23 });
  assert.equal(observed?.url, "https://sandbox.example.test/v1/execute");
  const headers = new Headers(observed?.init?.headers);
  assert.equal(headers.get("authorization"), `Bearer ${token}`);
  const payload = JSON.parse(String(observed?.init?.body));
  assert.deepEqual(Object.keys(payload).sort(), ["argv", "cwd", "files", "timeoutMs"]);
  assert.deepEqual(payload.argv, ["node", "scripts/check.js", "--safe"]);
  assert.equal(payload.files[0].path, "project/scripts/check.js");
  assert.equal(payload.timeoutMs, 20_000);
});

test("remote execution rejects path traversal, oversized inputs, insecure endpoints, and malformed provider results", async () => {
  assert.throws(() => createRemoteExecutionClient({ enabled: true, endpoint: "http://sandbox.example.test/run", token }), /HTTPS/);
  let calls = 0;
  const client = createRemoteExecutionClient({ enabled: true, endpoint: "https://sandbox.example.test/run", token, fetcher: async () => { calls += 1; return Response.json({ stdout: "x".repeat(140_000), stderr: "", exitCode: 0, durationMs: 1 }); } });
  await assert.rejects(client.execute({ enabled: true, argv: ["node"], files: [{ path: "../secret", content: "x" }] }), /safe relative/);
  await assert.rejects(client.execute({ enabled: true, argv: ["node"], files: [{ path: "ok.txt", content: "x".repeat(3 * 1024 * 1024 + 1) }] }), /exceed 3 MiB/);
  await assert.rejects(client.execute({ enabled: true, argv: ["node"], files: [{ path: ".env", content: "secret" }] }), /common secret/);
  await assert.rejects(client.execute({ enabled: true, argv: ["node"] }), /response is invalid or exceeds limits/);
  assert.equal(calls, 1);
});

test("remote execution sanitizes network and provider errors", async () => {
  const network = createRemoteExecutionClient({ enabled: true, endpoint: "https://sandbox.example.test/run", token, fetcher: async () => { throw new Error("secret provider detail"); } });
  await assert.rejects(network.execute({ enabled: true, argv: ["node"] }), (error: unknown) => error instanceof Error && /endpoint and credentials omitted/.test(error.message) && !error.message.includes("secret provider detail"));
  const provider = createRemoteExecutionClient({ enabled: true, endpoint: "https://sandbox.example.test/run", token, fetcher: async () => new Response("private provider error", { status: 500 }) });
  await assert.rejects(provider.execute({ enabled: true, argv: ["node"] }), (error: unknown) => error instanceof Error && /HTTP 500/.test(error.message) && !error.message.includes("private provider error"));
});
