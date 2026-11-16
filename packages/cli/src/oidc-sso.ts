import { createHash, createPublicKey, randomBytes, verify as verifySignature, timingSafeEqual } from "node:crypto";
import { Router, type Request } from "express";
import type { ConsoleSession, TrustedConsoleIdentity } from "./console-auth.js";
import type { createConsoleAuth } from "./console-auth.js";

export interface OidcClaims extends Record<string, unknown> { iss: string; sub: string; aud: string | string[]; exp: number; iat: number; nonce: string }
export interface OidcIdentity { principalId: string; username: string; displayName: string; memberships: Array<{ organizationId: string; repositoryId: string; role: "reader" | "contributor" | "admin" }> }
export interface OidcGroupPolicy { schemaVersion: "1"; groups: Record<string, readonly OidcIdentity["memberships"][number][]> }
export interface OidcGroupMapperOptions { issuer: string; policy: OidcGroupPolicy; groupClaim?: string; allowedEmailDomains?: readonly string[]; requireVerifiedEmail?: boolean }
export interface OidcSsoOptions {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes?: string[];
  maxTokenAgeSeconds?: number;
  mapIdentity: (claims: OidcClaims) => OidcIdentity | Promise<OidcIdentity>;
  fetcher?: typeof fetch;
}
export interface OidcLoginStart { authorizationUrl: string; browserBinding: string }

interface Metadata { issuer: string; authorization_endpoint: string; token_endpoint: string; jwks_uri: string }
interface PendingLogin { browserBindingHash: Buffer; nonce: string; verifier: string; expiresAt: number }
const MAX_PENDING = 1_000;
const MAX_JSON_BYTES = 1024 * 1024;
const MAX_TOKEN_BYTES = 32 * 1024;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function httpsUrl(value: string, label: string, allowLoopbackHttp = false): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new TypeError(`${label} must be a valid URL`); }
  const loopback = allowLoopbackHttp && url.protocol === "http:" && ["127.0.0.1", "[::1]", "localhost"].includes(url.hostname);
  if ((url.protocol !== "https:" && !loopback) || url.username || url.password || url.search || url.hash) throw new TypeError(`${label} must use HTTPS without embedded credentials, query, or fragment`);
  return url;
}
async function boundedJson(response: Response, label: string): Promise<unknown> {
  if (!response.ok || !response.body) throw new Error(`${label} request failed`);
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_JSON_BYTES) throw new Error(`${label} response exceeds its size limit`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_JSON_BYTES) { await reader.cancel().catch(() => undefined); throw new Error(`${label} response exceeds its size limit`); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown; }
  catch { throw new Error(`${label} response is not valid JSON`); }
}
function decodePart(part: string): Buffer {
  if (!BASE64URL.test(part)) throw new Error("OIDC ID token is malformed");
  return Buffer.from(part, "base64url");
}
function parseJwt(token: string): { header: Record<string, unknown>; claims: Record<string, unknown>; signingInput: Buffer; signature: Buffer } {
  if (typeof token !== "string" || token.length > MAX_TOKEN_BYTES) throw new Error("OIDC ID token is invalid");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("OIDC ID token is malformed");
  try {
    const header: unknown = JSON.parse(decodePart(parts[0]!).toString("utf8"));
    const claims: unknown = JSON.parse(decodePart(parts[1]!).toString("utf8"));
    if (!isRecord(header) || !isRecord(claims)) throw new Error();
    return { header, claims, signingInput: Buffer.from(`${parts[0]}.${parts[1]}`), signature: decodePart(parts[2]!) };
  } catch { throw new Error("OIDC ID token is malformed"); }
}
function validateIdentity(value: OidcIdentity): OidcIdentity {
  if (!isRecord(value) || typeof value.principalId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:@+-]{1,127}$/.test(value.principalId)
    || typeof value.username !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._@+-]{1,127}$/.test(value.username)
    || typeof value.displayName !== "string" || !value.displayName.trim() || value.displayName.length > 120
    || !Array.isArray(value.memberships) || value.memberships.length > 500) throw new Error("OIDC identity mapping returned invalid identity data");
  const keys = new Set<string>();
  const memberships = value.memberships.map((item) => {
    if (!isRecord(item) || typeof item.organizationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(item.organizationId)
      || typeof item.repositoryId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(item.repositoryId)
      || !["reader", "contributor", "admin"].includes(String(item.role))) throw new Error("OIDC identity mapping returned invalid memberships");
    const key = `${item.organizationId}/${item.repositoryId}`;
    if (keys.has(key)) throw new Error("OIDC identity mapping returned duplicate memberships");
    keys.add(key);
    return { organizationId: item.organizationId, repositoryId: item.repositoryId, role: item.role as OidcIdentity["memberships"][number]["role"] };
  });
  return { principalId: value.principalId, username: value.username, displayName: value.displayName, memberships };
}

/** Maps verified IdP groups to exact repository roles; unmapped groups and principals receive no access. */
export function createOidcGroupMapper(options: OidcGroupMapperOptions): (claims: OidcClaims) => OidcIdentity {
  const issuer = httpsUrl(options.issuer, "OIDC issuer").href.replace(/\/$/, "");
  if (!isRecord(options.policy) || options.policy.schemaVersion !== "1" || !isRecord(options.policy.groups) || Object.keys(options.policy.groups).length > 500) throw new TypeError("OIDC group policy must be a version 1 document with at most 500 groups");
  const serializedPolicy = JSON.stringify(options.policy);
  if (typeof serializedPolicy !== "string" || Object.keys(options.policy).some((key) => key !== "schemaVersion" && key !== "groups") || Buffer.byteLength(serializedPolicy, "utf8") > 1024 * 1024) throw new TypeError("OIDC group policy contains unknown fields or exceeds 1 MiB");
  const groupClaim = options.groupClaim ?? "groups";
  if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(groupClaim)) throw new TypeError("OIDC group claim name is invalid");
  const domains = options.allowedEmailDomains?.map((domain) => domain.toLowerCase());
  if (domains && (!domains.length || domains.length > 100 || domains.some((domain) => !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) || new Set(domains).size !== domains.length)) throw new TypeError("allowed email domains are invalid");
  const groupRules = new Map<string, Array<OidcIdentity["memberships"][number]>>();
  let total = 0;
  for (const [group, memberships] of Object.entries(options.policy.groups)) {
    if (!group.trim() || group !== group.trim() || group.length > 256 || !Array.isArray(memberships) || memberships.length > 500) throw new TypeError("OIDC group policy entry is invalid");
    const validated = memberships.map((membership) => {
      if (!isRecord(membership) || Object.keys(membership).some((key) => !["organizationId", "repositoryId", "role"].includes(key)) || typeof membership.organizationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(membership.organizationId)
        || typeof membership.repositoryId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(membership.repositoryId)
        || !["reader", "contributor", "admin"].includes(String(membership.role))) throw new TypeError("OIDC group policy membership is invalid");
      total += 1;
      if (total > 5_000) throw new TypeError("OIDC group policy exceeds 5000 memberships");
      return { organizationId: membership.organizationId, repositoryId: membership.repositoryId, role: membership.role as OidcIdentity["memberships"][number]["role"] };
    });
    groupRules.set(group, validated);
  }
  const requireVerifiedEmail = options.requireVerifiedEmail ?? true;
  return (claims) => {
    const rawGroups = claims[groupClaim];
    if (!Array.isArray(rawGroups) || rawGroups.length > 500 || rawGroups.some((group) => typeof group !== "string" || !group || group.length > 256) || new Set(rawGroups).size !== rawGroups.length) throw new Error("OIDC principal has no valid group claim");
    if (typeof claims.email !== "string" || claims.email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claims.email) || (requireVerifiedEmail && claims.email_verified !== true)) throw new Error("OIDC principal has no verified email identity");
    const emailDomain = claims.email.slice(claims.email.lastIndexOf("@") + 1).toLowerCase();
    if (domains && !domains.includes(emailDomain)) throw new Error("OIDC principal email domain is not allowed");
    const memberships = new Map<string, OidcIdentity["memberships"][number]>();
    for (const group of rawGroups as string[]) for (const membership of groupRules.get(group) ?? []) {
      const key = `${membership.organizationId}/${membership.repositoryId}`;
      const previous = memberships.get(key);
      if (previous && previous.role !== membership.role) throw new Error("OIDC group policy grants conflicting roles");
      memberships.set(key, membership);
    }
    return validateIdentity({
      principalId: `oidc-${createHash("sha256").update(`${issuer}\0${claims.sub}`).digest("hex").slice(0, 40)}`,
      username: typeof claims.preferred_username === "string" && /^[A-Za-z0-9][A-Za-z0-9._@+-]{1,127}$/.test(claims.preferred_username) ? claims.preferred_username : claims.email,
      displayName: typeof claims.name === "string" && claims.name.trim() ? claims.name : claims.email,
      memberships: [...memberships.values()].sort((left, right) => `${left.organizationId}/${left.repositoryId}`.localeCompare(`${right.organizationId}/${right.repositoryId}`)),
    });
  };
}

/** Minimal OIDC Authorization Code + PKCE S256 client. The host owns callback routes, cookies, and final session storage. */
export function createOidcSso(options: OidcSsoOptions) {
  const issuer = httpsUrl(options.issuer, "OIDC issuer");
  const redirectUri = httpsUrl(options.redirectUri, "OIDC redirect URI", true);
  if ((issuer.pathname !== "/" && issuer.pathname.endsWith("/")) || !options.clientId || options.clientId.trim() !== options.clientId || options.clientId.length > 512 || /[\r\n\0]/.test(options.clientId)
    || (options.clientSecret !== undefined && (!options.clientSecret || options.clientSecret.length > 2_000 || /[\r\n\0]/.test(options.clientSecret)))
    || typeof options.mapIdentity !== "function") throw new TypeError("OIDC client configuration is invalid");
  const scopes = options.scopes ?? ["openid", "profile", "email"];
  if (!Array.isArray(scopes) || scopes.length > 20 || !scopes.includes("openid") || scopes.some((scope) => typeof scope !== "string" || !/^[A-Za-z0-9:_-]{1,64}$/.test(scope)) || new Set(scopes).size !== scopes.length) throw new TypeError("OIDC scopes must be unique, bounded, and include openid");
  const maxTokenAgeSeconds = options.maxTokenAgeSeconds ?? 3_600;
  if (!Number.isSafeInteger(maxTokenAgeSeconds) || maxTokenAgeSeconds < 60 || maxTokenAgeSeconds > 86_400) throw new TypeError("OIDC ID token age limit must be from 60 to 86400 seconds");
  const fetcher = options.fetcher ?? fetch;
  const pending = new Map<string, PendingLogin>();
  let metadataPromise: Promise<Metadata> | undefined;

  async function metadata(): Promise<Metadata> {
    metadataPromise ??= (async () => {
      const discoveryUrl = new URL(`${issuer.pathname.replace(/\/$/, "")}/.well-known/openid-configuration`, issuer.origin);
      let response: Response;
      try { response = await fetcher(discoveryUrl, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) }); }
      catch { throw new Error("OIDC discovery request failed"); }
      const value = await boundedJson(response, "OIDC discovery");
      if (!isRecord(value) || value.issuer !== options.issuer || typeof value.authorization_endpoint !== "string" || typeof value.token_endpoint !== "string" || typeof value.jwks_uri !== "string") throw new Error("OIDC discovery metadata is invalid");
      const auth = httpsUrl(value.authorization_endpoint, "OIDC authorization endpoint");
      const token = httpsUrl(value.token_endpoint, "OIDC token endpoint");
      const keys = httpsUrl(value.jwks_uri, "OIDC JWKS URI");
      return { issuer: value.issuer, authorization_endpoint: auth.href, token_endpoint: token.href, jwks_uri: keys.href };
    })().catch((error: unknown) => { metadataPromise = undefined; throw error; });
    return metadataPromise;
  }

  return Object.freeze({
    async beginLogin(now = Date.now()): Promise<OidcLoginStart> {
      for (const [state, flow] of pending) if (flow.expiresAt <= now) pending.delete(state);
      if (pending.size >= MAX_PENDING) throw new Error("too many pending OIDC logins");
      const provider = await metadata();
      const state = randomBytes(32).toString("base64url");
      const browserBinding = randomBytes(32).toString("base64url");
      const nonce = randomBytes(32).toString("base64url");
      const verifier = randomBytes(32).toString("base64url");
      const challenge = createHash("sha256").update(verifier).digest("base64url");
      const authorization = new URL(provider.authorization_endpoint);
      authorization.searchParams.set("client_id", options.clientId);
      authorization.searchParams.set("redirect_uri", redirectUri.href);
      authorization.searchParams.set("response_type", "code");
      authorization.searchParams.set("scope", scopes.join(" "));
      authorization.searchParams.set("state", state);
      authorization.searchParams.set("nonce", nonce);
      authorization.searchParams.set("code_challenge", challenge);
      authorization.searchParams.set("code_challenge_method", "S256");
      pending.set(state, { browserBindingHash: createHash("sha256").update(browserBinding).digest(), nonce, verifier, expiresAt: now + 10 * 60_000 });
      return { authorizationUrl: authorization.href, browserBinding };
    },

    async completeLogin(state: string, browserBinding: string, code: string, now = Date.now()): Promise<OidcIdentity> {
      if (typeof state !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(state) || typeof browserBinding !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(browserBinding) || typeof code !== "string" || code.length < 1 || code.length > 4_096 || /[\r\n\0]/.test(code)) throw new Error("OIDC callback parameters are invalid");
      const flow = pending.get(state);
      pending.delete(state);
      if (!flow || flow.expiresAt <= now) throw new Error("OIDC login state is expired or unknown");
      const actualBindingHash = createHash("sha256").update(browserBinding).digest();
      if (!timingSafeEqual(actualBindingHash, flow.browserBindingHash)) throw new Error("OIDC login browser binding did not match");

      const provider = await metadata();
      const form = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri.href, client_id: options.clientId, code_verifier: flow.verifier });
      const headers = new Headers({ accept: "application/json", "content-type": "application/x-www-form-urlencoded" });
      if (options.clientSecret) headers.set("authorization", `Basic ${Buffer.from(`${options.clientId}:${options.clientSecret}`).toString("base64")}`);
      let tokenResponse: Response;
      try { tokenResponse = await fetcher(provider.token_endpoint, { method: "POST", headers, body: form, signal: AbortSignal.timeout(10_000) }); }
      catch { throw new Error("OIDC token request failed"); }
      const tokens = await boundedJson(tokenResponse, "OIDC token");
      if (!isRecord(tokens) || typeof tokens.id_token !== "string") throw new Error("OIDC token response did not include an ID token");
      const parsed = parseJwt(tokens.id_token);
      if (parsed.header.alg !== "RS256" || parsed.header.typ && parsed.header.typ !== "JWT" || typeof parsed.header.kid !== "string" || parsed.header.kid.length > 256) throw new Error("OIDC ID token uses an unsupported signing algorithm or key");

      let keyResponse: Response;
      try { keyResponse = await fetcher(provider.jwks_uri, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) }); }
      catch { throw new Error("OIDC key request failed"); }
      const jwks = await boundedJson(keyResponse, "OIDC JWKS");
      if (!isRecord(jwks) || !Array.isArray(jwks.keys) || jwks.keys.length > 100) throw new Error("OIDC JWKS is invalid");
      const key = jwks.keys.find((candidate) => isRecord(candidate) && candidate.kid === parsed.header.kid && candidate.kty === "RSA" && candidate.use !== "enc" && (candidate.alg === undefined || candidate.alg === "RS256"));
      if (!isRecord(key) || typeof key.n !== "string" || key.n.length < 342 || typeof key.e !== "string") throw new Error("OIDC signing key is missing or below 2048 bits");
      const publicKey = createPublicKey({ key: { kty: "RSA", n: key.n, e: key.e }, format: "jwk" });
      if (!verifySignature("RSA-SHA256", parsed.signingInput, publicKey, parsed.signature)) throw new Error("OIDC ID token signature verification failed");

      const claims = parsed.claims;
      const audiences = typeof claims.aud === "string" ? [claims.aud] : claims.aud;
      if (claims.iss !== provider.issuer || !Array.isArray(audiences) || audiences.length < 1 || audiences.some((audience) => typeof audience !== "string" || !audience) || !audiences.includes(options.clientId)
        || (audiences.length > 1 && claims.azp !== options.clientId) || (claims.azp !== undefined && claims.azp !== options.clientId) || typeof claims.sub !== "string" || !claims.sub || claims.sub.length > 255
        || typeof claims.exp !== "number" || !Number.isFinite(claims.exp) || claims.exp <= Math.floor(now / 1000) - 60
        || (claims.nbf !== undefined && (typeof claims.nbf !== "number" || !Number.isFinite(claims.nbf) || claims.nbf > Math.floor(now / 1000) + 60))
        || typeof claims.iat !== "number" || !Number.isFinite(claims.iat) || claims.iat > Math.floor(now / 1000) + 60 || claims.iat < Math.floor(now / 1000) - maxTokenAgeSeconds - 60
        || claims.nonce !== flow.nonce) throw new Error("OIDC ID token claims failed issuer, audience, time, or nonce validation");
      return validateIdentity(await options.mapIdentity(claims as OidcClaims));
    },

    getPendingCount(): number { return pending.size; },
  });
}

export interface OidcSessionAuth { createTrustedSession(identity: TrustedConsoleIdentity, now?: number): { token: string; session: ConsoleSession } }
export interface OidcRouterOptions { sso: ReturnType<typeof createOidcSso>; auth: OidcSessionAuth; sessionCookieName?: string; successPath?: string }
const FLOW_COOKIE = "__Host-ases_oidc_flow";
function requestCookie(request: Request, name: string): string | undefined {
  for (const entry of (request.headers.cookie ?? "").split(";")) {
    const [key, ...value] = entry.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

/** Mounts OIDC start/callback routes on an HTTPS host application; the host retains server lifecycle and central membership mapping. */
export function createOidcSsoRouter(options: OidcRouterOptions) {
  const sessionCookieName = options.sessionCookieName ?? "ases_console";
  const successPath = options.successPath ?? "/";
  if (!options || !options.sso || !options.auth || !/^__[A-Za-z0-9_-]{1,64}$|^[A-Za-z0-9_-]{1,64}$/.test(sessionCookieName)
    || !successPath.startsWith("/") || successPath.startsWith("//") || successPath.includes("\\") || /[\r\n]/.test(successPath) || new URL(successPath, "https://console.invalid").origin !== "https://console.invalid") throw new TypeError("OIDC router configuration is invalid");
  const router = Router();
  router.use((_request, response, next) => { response.setHeader("Cache-Control", "no-store"); response.setHeader("Referrer-Policy", "no-referrer"); next(); });
  router.get("/start", async (_request, response) => {
    try {
      const login = await options.sso.beginLogin();
      response.cookie(FLOW_COOKIE, login.browserBinding, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 10 * 60_000 });
      return response.redirect(302, login.authorizationUrl);
    } catch { return response.status(503).type("text").send("Single sign-on is temporarily unavailable."); }
  });
  router.get("/callback", async (request, response) => {
    try {
      const state = request.query.state;
      const code = request.query.code;
      if (typeof state !== "string" || typeof code !== "string") throw new Error("invalid callback");
      const browserBinding = requestCookie(request, FLOW_COOKIE);
      if (!browserBinding) throw new Error("missing browser binding");
      const identity = await options.sso.completeLogin(state, browserBinding, code);
      const login = options.auth.createTrustedSession(identity);
      response.clearCookie(FLOW_COOKIE, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
      response.cookie(sessionCookieName, login.token, { httpOnly: true, secure: true, sameSite: "strict", path: "/", expires: new Date(login.session.expiresAt) });
      return response.redirect(303, successPath);
    } catch {
      response.clearCookie(FLOW_COOKIE, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
      return response.status(401).type("text").send("Single sign-on could not verify this login.");
    }
  });
  return router;
}
