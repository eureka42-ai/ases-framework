import { realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { stderr, stdin } from "node:process";
import { McpServer } from "@modelcontextprotocol/server";
import type { AuthInfo, OAuthMetadata, OAuthTokenVerifier } from "@modelcontextprotocol/server";
import { createMcpHandler, OAuthError, OAuthErrorCode } from "@modelcontextprotocol/server";
import { createMcpExpressApp, getOAuthProtectedResourceMetadataUrl, mcpAuthMetadataRouter, requireBearerAuth } from "@modelcontextprotocol/express";
import { toNodeHandler } from "@modelcontextprotocol/node";
import type { Express } from "express";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod/v4";
import { readCatalog } from "./catalog.js";
import { VERSION } from "./version.js";

const PRODUCT_ID = /^[a-z0-9][a-z0-9-]*$/;
const REQUIREMENT_ID = /^REQ-\d{3}$/;

function makeServer(workspace: string): McpServer {
  const server = new McpServer({ name: "eureka42-ases", version: VERSION }, { capabilities: { tools: {} } });
  const catalogArgs = z.object({ productId: z.string().regex(PRODUCT_ID).optional() });
  const itemArgs = z.object({ id: z.string().regex(REQUIREMENT_ID), productId: z.string().regex(PRODUCT_ID).optional() });

  server.registerTool("requirements_list", {
    title: "List ASES requirements",
    description: "List requirements from the imported ASES-300 or an isolated product catalog in the configured workspace. Read-only.",
    inputSchema: catalogArgs
  }, async ({ productId }) => {
    try {
      const catalog = await readCatalog(workspace, productId);
      const result = { catalog: catalog.catalog, productId: catalog.productId, status: catalog.status, requirements: catalog.requirements.map(({ id, title, priority, status, decision }) => ({ id, title, priority, status, decision: decision?.status })) };
      return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result };
    } catch {
      return { isError: true, content: [{ type: "text", text: "Catálogo não encontrado ou inválido no workspace configurado." }] };
    }
  });

  server.registerTool("requirements_show", {
    title: "Show an ASES requirement",
    description: "Read one requirement and its recorded status, decisions and evidence from the configured workspace. Read-only.",
    inputSchema: itemArgs
  }, async ({ id, productId }) => {
    try {
      const catalog = await readCatalog(workspace, productId);
      const requirement = catalog.requirements.find((item) => item.id === id);
      if (!requirement) return { isError: true, content: [{ type: "text", text: "Requisito não encontrado no catálogo selecionado." }] };
      const result = { catalog: catalog.catalog, productId: catalog.productId, requirement };
      return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result };
    } catch {
      return { isError: true, content: [{ type: "text", text: "Catálogo não encontrado ou inválido no workspace configurado." }] };
    }
  });

  server.registerTool("requirements_trace", {
    title: "Trace an ASES requirement",
    description: "Read implementation status, decision references, test references, evidence integrity and blockers for one requirement. Read-only.",
    inputSchema: itemArgs
  }, async ({ id, productId }) => {
    try {
      const catalog = await readCatalog(workspace, productId);
      const requirement = catalog.requirements.find((item) => item.id === id);
      if (!requirement) return { isError: true, content: [{ type: "text", text: "Requisito não encontrado no catálogo selecionado." }] };
      const result = { id, status: requirement.status, decision: requirement.decision, traceability: requirement.traceability, evidence: requirement.evidence, blocker: requirement.blocker, waiver: requirement.waiver, history: requirement.history };
      return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result };
    } catch {
      return { isError: true, content: [{ type: "text", text: "Catálogo não encontrado ou inválido no workspace configurado." }] };
    }
  });
  return server;
}

export async function startMcpServer(workspacePath: string): Promise<void> {
  const workspace = await realpath(resolve(workspacePath));
  const handle = serveStdio(() => makeServer(workspace), {
    legacy: "serve",
    onerror: () => { stderr.write("[ases-mcp] Erro de transporte MCP; detalhes omitidos.\n"); }
  });
  if (!stdin.readableEnded) await new Promise<void>((resolveEnd, reject) => {
    stdin.once("end", resolveEnd);
    stdin.once("error", reject);
  });
  await handle.close();
}

export type RemoteMcpConfig = {
  host: string;
  port: number;
  resourceUrl: URL;
  metadataUrl: URL;
  introspectionUrl: URL;
  clientId: string;
  clientSecret: string;
  requiredScopes: string[];
};

function requiredUrl(name: string): URL {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  const url = new URL(value);
  if (url.username || url.password || url.hash) throw new Error(`${name} must not contain userinfo or a fragment`);
  if (url.protocol !== "https:" && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) throw new Error(`${name} must use HTTPS outside localhost`);
  return url;
}

function readRemoteConfig(): RemoteMcpConfig {
  const host = process.env.ASES_MCP_HOST ?? "127.0.0.1";
  const port = Number(process.env.ASES_MCP_PORT ?? "3333");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("ASES_MCP_PORT must be a valid TCP port");
  const resourceUrl = requiredUrl("ASES_MCP_RESOURCE_URL");
  if (resourceUrl.pathname !== "/mcp" || resourceUrl.search) throw new Error("ASES_MCP_RESOURCE_URL must be the /mcp endpoint without a query string");
  const metadataUrl = requiredUrl("ASES_MCP_AUTHORIZATION_METADATA_URL");
  const introspectionUrl = requiredUrl("ASES_MCP_INTROSPECTION_URL");
  const clientId = process.env.ASES_MCP_CLIENT_ID;
  const secretName = process.env.ASES_MCP_CLIENT_SECRET_ENV;
  const clientSecret = secretName ? process.env[secretName] : undefined;
  if (!clientId || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(secretName ?? "") || !clientSecret) throw new Error("Set ASES_MCP_CLIENT_ID, ASES_MCP_CLIENT_SECRET_ENV and the referenced secret environment variable");
  const requiredScopes = (process.env.ASES_MCP_REQUIRED_SCOPES ?? "mcp:read").split(/\s+/).filter(Boolean);
  if (!requiredScopes.length || requiredScopes.some((scope) => !/^[\x21-\x7e]+$/.test(scope))) throw new Error("ASES_MCP_REQUIRED_SCOPES must contain valid OAuth scopes");
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(host);
  if (!local && resourceUrl.protocol !== "https:") throw new Error("Non-loopback MCP listeners require an HTTPS resource URL and a TLS-terminating reverse proxy");
  if (local && resourceUrl.protocol !== "https:" && !["127.0.0.1", "localhost", "[::1]"].includes(resourceUrl.hostname)) throw new Error("Local HTTP resource URLs must use loopback");
  return { host, port, resourceUrl, metadataUrl, introspectionUrl, clientId, clientSecret, requiredScopes };
}

async function readJsonLimited(response: Response, label: string): Promise<unknown> {
  const maxBytes = 64 * 1024;
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error(`${label} response is too large`);
  if (!response.body) throw new Error(`${label} response is empty`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error(`${label} response is too large`);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

function validateOAuthMetadata(value: unknown): OAuthMetadata {
  if (!value || typeof value !== "object") throw new Error("OAuth authorization server metadata is invalid");
  const metadata = value as Record<string, unknown>;
  for (const key of ["issuer", "authorization_endpoint", "token_endpoint"]) {
    if (typeof metadata[key] !== "string") throw new Error("OAuth authorization server metadata is incomplete");
    const url = new URL(metadata[key] as string);
    if (url.protocol !== "https:" && !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) throw new Error("OAuth authorization server metadata endpoints must use HTTPS outside localhost");
  }
  return value as OAuthMetadata;
}

export function createIntrospectionVerifier(config: Pick<RemoteMcpConfig, "introspectionUrl" | "clientId" | "clientSecret" | "resourceUrl">, fetchImpl: typeof fetch = fetch): OAuthTokenVerifier {
  return {
    async verifyAccessToken(token): Promise<AuthInfo> {
      const response = await fetchImpl(config.introspectionUrl, {
        method: "POST",
        headers: {
          authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
          "content-type": "application/x-www-form-urlencoded",
          accept: "application/json"
        },
        body: new URLSearchParams({ token }),
        signal: AbortSignal.timeout(5000),
        redirect: "error"
      });
      if (!response.ok) throw new Error("OAuth token introspection failed");
      const body = await readJsonLimited(response, "OAuth token introspection");
      if (!body || typeof body !== "object") throw new Error("OAuth token introspection response was invalid");
      const data = body as Record<string, unknown>;
      const exp = data["exp"];
      const aud = data["aud"];
      const audiences = Array.isArray(aud) ? aud : [aud];
      const resource = audiences.includes(config.resourceUrl.href)
        ? config.resourceUrl
        : undefined;
      const scope = typeof data["scope"] === "string" ? data["scope"].split(/\s+/).filter(Boolean) : [];
      if (data["active"] !== true || typeof exp !== "number" || exp <= Date.now() / 1000 || !resource) {
        throw new OAuthError(OAuthErrorCode.InvalidToken, "Access token is inactive, expired, or has the wrong audience");
      }
      const client = data["client_id"] ?? data["sub"];
      if (typeof client !== "string" || !client) throw new OAuthError(OAuthErrorCode.InvalidToken, "Access token has no client identity");
      return { token, clientId: client, scopes: scope, expiresAt: exp, resource };
    }
  };
}

export async function startMcpHttpServer(workspacePath: string): Promise<void> {
  const config = readRemoteConfig();
  const metadataResponse = await fetch(config.metadataUrl, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(5000), redirect: "error" });
  if (!metadataResponse.ok) throw new Error("OAuth authorization server metadata is unavailable");
  const metadata = validateOAuthMetadata(await readJsonLimited(metadataResponse, "OAuth authorization server metadata"));
  const workspace = await realpath(resolve(workspacePath));
  const app = createMcpHttpApp(workspace, config, metadata);
  const server = app.listen(config.port, config.host);
  await new Promise<void>((resolveListen, reject) => {
    server.once("listening", resolveListen);
    server.once("error", reject);
  });
  stderr.write(`[ases-mcp] MCP HTTP autenticado ativo em ${config.host}:${config.port}/mcp\n`);
  await new Promise<void>((resolveStop) => {
    const stop = (): void => { server.close(() => resolveStop()); };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  });
}

export function createMcpHttpApp(workspace: string, config: RemoteMcpConfig, metadata: OAuthMetadata, verifier: OAuthTokenVerifier = createIntrospectionVerifier(config)): Express {
  const app = createMcpExpressApp({ host: config.host, allowedHosts: [config.resourceUrl.hostname, "localhost", "127.0.0.1", "[::1]"] });
  app.use(mcpAuthMetadataRouter({ oauthMetadata: metadata, resourceServerUrl: config.resourceUrl }));
  const auth = requireBearerAuth({
    verifier,
    requiredScopes: config.requiredScopes,
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(config.resourceUrl),
    expectedResource: config.resourceUrl
  });
  const nodeHandler = toNodeHandler(createMcpHandler(() => makeServer(workspace)), {
    onerror: () => stderr.write("[ases-mcp] Erro de transporte MCP HTTP; detalhes omitidos.\n")
  });
  app.all("/mcp", auth, (req, res) => { void nodeHandler(req, res, req.body); });
  return app;
}
