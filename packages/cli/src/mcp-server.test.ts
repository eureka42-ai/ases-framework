import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import type { OAuthMetadata } from "@modelcontextprotocol/server";
import { createIntrospectionVerifier, createMcpHttpApp } from "./mcp-server.js";

const resourceUrl = new URL("https://ases.example.test/mcp");
const config = {
  introspectionUrl: new URL("https://identity.example.test/oauth/introspect"),
  clientId: "ases-resource-server",
  clientSecret: "test-secret",
  resourceUrl
};

test("MCP OAuth introspection accepts only active, unexpired tokens bound to this resource", async () => {
  let request: Request | undefined;
  const verifier = createIntrospectionVerifier(config, async (input, init) => {
    request = new Request(input, init);
    return Response.json({ active: true, exp: Math.floor(Date.now() / 1000) + 60, aud: resourceUrl.href, client_id: "claude", scope: "mcp:read other" });
  });
  const info = await verifier.verifyAccessToken("bearer-value");
  assert.equal(info.token, "bearer-value");
  assert.equal(info.clientId, "claude");
  assert.deepEqual(info.scopes, ["mcp:read", "other"]);
  assert.equal(info.resource?.href, resourceUrl.href);
  assert.equal(request?.method, "POST");
  assert.equal(request?.headers.get("content-type"), "application/x-www-form-urlencoded");
  assert.equal(await request?.text(), "token=bearer-value");
  assert.match(request?.headers.get("authorization") ?? "", /^Basic /);
});

test("MCP OAuth introspection rejects inactive, expired, wrong-audience and identity-free tokens", async () => {
  for (const payload of [
    { active: false, exp: Date.now() / 1000 + 60, aud: resourceUrl.href, client_id: "cli" },
    { active: true, exp: 1, aud: resourceUrl.href, client_id: "cli" },
    { active: true, exp: Date.now() / 1000 + 60, aud: "https://other.example.test/mcp", client_id: "cli" },
    { active: true, exp: Date.now() / 1000 + 60, aud: resourceUrl.href }
  ]) {
    const verifier = createIntrospectionVerifier(config, async () => Response.json(payload));
    await assert.rejects(verifier.verifyAccessToken("invalid"));
  }
});

test("MCP OAuth introspection fails closed when the authorization server is unavailable", async () => {
  const verifier = createIntrospectionVerifier(config, async () => Response.json({ active: true }, { status: 503 }));
  await assert.rejects(verifier.verifyAccessToken("token"), /introspection failed/);
});

test("MCP OAuth introspection rejects malformed and oversized provider responses", async () => {
  for (const response of [new Response("not-json"), new Response("x".repeat(65 * 1024))]) {
    const verifier = createIntrospectionVerifier(config, async () => response);
    await assert.rejects(verifier.verifyAccessToken("token"));
  }
});

test("MCP Streamable HTTP advertises OAuth metadata and rejects unauthenticated calls", async () => {
  const app = createMcpHttpApp(process.cwd(), {
    host: "127.0.0.1",
    port: 0,
    metadataUrl: new URL("https://identity.example.test/.well-known/oauth-authorization-server"),
    ...config,
    requiredScopes: ["mcp:read"]
  }, { issuer: "https://identity.example.test" } as OAuthMetadata);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const metadata = await fetch(`${base}/.well-known/oauth-protected-resource/mcp`);
    assert.equal(metadata.status, 200);
    assert.deepEqual((await metadata.json()).authorization_servers, ["https://identity.example.test"]);

    const response = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server/discover", params: {} }) });
    assert.equal(response.status, 401);
    assert.match(response.headers.get("www-authenticate") ?? "", /resource_metadata=/);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("MCP Streamable HTTP verifies bearer auth, resource audience and required scopes before dispatch", async () => {
  const app = createMcpHttpApp(process.cwd(), {
    host: "127.0.0.1",
    port: 0,
    metadataUrl: new URL("https://identity.example.test/.well-known/oauth-authorization-server"),
    ...config,
    requiredScopes: ["mcp:read"]
  }, { issuer: "https://identity.example.test" } as OAuthMetadata, {
    async verifyAccessToken(token) {
      if (!["valid-token", "insufficient-scope"].includes(token)) throw new Error("invalid token");
      return { token, clientId: "integration-test", scopes: token === "valid-token" ? ["mcp:read"] : [], expiresAt: Math.floor(Date.now() / 1000) + 60, resource: resourceUrl };
    }
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
      method: "POST",
      headers: { authorization: "Bearer valid-token", "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2026-07-28", "mcp-method": "server/discover" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server/discover", params: { _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} } } })
    });
    const eventStream = await response.text();
    assert.equal(response.status, 200, eventStream);
    const data = eventStream.split("\n").find((line) => line.startsWith("data: "));
    const body = response.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(eventStream)
      : JSON.parse((data ?? "").slice("data: ".length));
    assert.ok(Array.isArray(body.result?.supportedVersions), JSON.stringify(body));

    const insufficient = await fetch(`http://127.0.0.1:${address.port}/mcp`, {
      method: "POST",
      headers: { authorization: "Bearer insufficient-scope", "content-type": "application/json", accept: "application/json", "mcp-protocol-version": "2026-07-28", "mcp-method": "server/discover" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "server/discover", params: { _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} } } })
    });
    assert.equal(insufficient.status, 403);
    assert.match(insufficient.headers.get("www-authenticate") ?? "", /insufficient_scope/);
  } finally {
    server.close();
    await once(server, "close");
  }
});
