import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { createConsoleAuth } from "./console-auth.js";
import { createOidcGroupMapper, createOidcSso, createOidcSsoRouter, type OidcSsoOptions } from "./oidc-sso.js";

const ISSUER = "https://login.example.test/tenant";
const CLIENT = "ases-console";
const FIXED_NOW = 1_800_000_000_000;
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicJwk = publicKey.export({ format: "jwk" });

function jwt(claims: Record<string, unknown>, kid = "key-1"): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const input = `${encode({ alg: "RS256", typ: "JWT", kid })}.${encode(claims)}`;
  return `${input}.${sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url")}`;
}

function fixture(claimOverrides: Record<string, unknown> = {}) {
  let tokenCalls = 0;
  let observedVerifier = "";
  let token = "";
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/.well-known/openid-configuration")) return Response.json({ issuer: ISSUER, authorization_endpoint: "https://login.example.test/authorize", token_endpoint: "https://login.example.test/token", jwks_uri: "https://login.example.test/keys" });
    if (url.pathname === "/token") {
      tokenCalls += 1;
      const body = new URLSearchParams(String(init?.body));
      assert.equal(body.get("grant_type"), "authorization_code");
      assert.equal(body.get("code_verifier")?.length, 43);
      observedVerifier = body.get("code_verifier")!;
      return Response.json({ id_token: token });
    }
    if (url.pathname === "/keys") return Response.json({ keys: [{ ...publicJwk, kid: "key-1", use: "sig", alg: "RS256" }] });
    throw new Error("unexpected URL");
  };
  const options: OidcSsoOptions = {
    issuer: ISSUER, clientId: CLIENT, clientSecret: "example-secret", redirectUri: "https://console.example.test/oidc/callback", fetcher,
    mapIdentity: (claims) => ({ principalId: `oidc-${String(claims.sub)}`, username: String(claims.email), displayName: String(claims.name), memberships: [{ organizationId: "acme", repositoryId: "ases", role: "admin" }] }),
  };
  const sso = createOidcSso(options);
  return {
    sso,
    async start() {
      const result = await sso.beginLogin(FIXED_NOW);
      const authUrl = new URL(result.authorizationUrl);
      assert.equal(authUrl.searchParams.get("response_type"), "code");
      assert.equal(authUrl.searchParams.get("code_challenge_method"), "S256");
      const claims = { iss: ISSUER, sub: "user-42", aud: CLIENT, exp: FIXED_NOW / 1000 + 300, iat: FIXED_NOW / 1000, nonce: authUrl.searchParams.get("nonce"), email: "user@example.test", name: "Eureka User", groups: ["ases-admin"], ...claimOverrides };
      token = jwt(claims);
      return { result, authUrl };
    },
    get tokenCalls() { return tokenCalls; },
    get observedVerifier() { return observedVerifier; },
  };
}

test("OIDC SSO uses authorization code + PKCE and validates the signed ID token", async () => {
  const testFixture = fixture();
  const { result, authUrl } = await testFixture.start();
  const identity = await testFixture.sso.completeLogin(authUrl.searchParams.get("state")!, result.browserBinding, "authorization-code", FIXED_NOW);
  assert.equal(identity.principalId, "oidc-user-42");
  assert.equal(identity.username, "user@example.test");
  assert.equal(identity.memberships[0]?.role, "admin");
  assert.equal(new URL(result.authorizationUrl).searchParams.get("code_challenge"), createHash("sha256").update(testFixture.observedVerifier).digest("base64url"));
  assert.equal(testFixture.tokenCalls, 1);
  assert.equal(testFixture.sso.getPendingCount(), 0);
});

test("OIDC SSO binds callback to the browser and consumes state before exchange", async () => {
  const testFixture = fixture();
  const { result, authUrl } = await testFixture.start();
  const mismatchedBrowserBinding = `${result.browserBinding.slice(0, -1)}${result.browserBinding.endsWith("A") ? "B" : "A"}`;
  await assert.rejects(testFixture.sso.completeLogin(authUrl.searchParams.get("state")!, mismatchedBrowserBinding, "authorization-code", FIXED_NOW), /browser binding/);
  assert.equal(testFixture.tokenCalls, 0);
  await assert.rejects(testFixture.sso.completeLogin(authUrl.searchParams.get("state")!, result.browserBinding, "authorization-code", FIXED_NOW), /expired or unknown/);
});

test("OIDC SSO rejects signed tokens with the wrong issuer and insecure provider configuration", async () => {
  const testFixture = fixture({ iss: "https://attacker.example.test" });
  const { result, authUrl } = await testFixture.start();
  await assert.rejects(testFixture.sso.completeLogin(authUrl.searchParams.get("state")!, result.browserBinding, "authorization-code", FIXED_NOW), /claims failed/);
  assert.throws(() => createOidcSso({ issuer: "http://login.example.test", clientId: CLIENT, redirectUri: "https://console.example.test/callback", mapIdentity: () => ({ principalId: "idp-user", username: "user@example.test", displayName: "User", memberships: [] }) }), /HTTPS/);
  assert.doesNotThrow(() => createOidcSso({ issuer: "https://login.example.test", clientId: CLIENT, redirectUri: "https://console.example.test/callback", mapIdentity: () => ({ principalId: "idp-user", username: "user@example.test", displayName: "User", memberships: [] }) }));
  const oldToken = fixture({ iat: FIXED_NOW / 1000 - 7_200 });
  const oldLogin = await oldToken.start();
  await assert.rejects(oldToken.sso.completeLogin(oldLogin.authUrl.searchParams.get("state")!, oldLogin.result.browserBinding, "authorization-code", FIXED_NOW), /claims failed/);
});

test("OIDC group policy defaults to no access and maps verified groups to exact repo roles", () => {
  const mapIdentity = createOidcGroupMapper({
    issuer: ISSUER,
    allowedEmailDomains: ["example.test"],
    policy: { schemaVersion: "1", groups: { "ases-readers": [{ organizationId: "acme", repositoryId: "ases", role: "reader" }], "ases-admins": [{ organizationId: "acme", repositoryId: "ases", role: "admin" }] } },
  });
  const identity = mapIdentity({ iss: ISSUER, sub: "person-1", aud: CLIENT, exp: 2_000_000_000, iat: 1_900_000_000, nonce: "n", email: "person@example.test", email_verified: true, groups: ["unknown", "ases-readers"] });
  assert.equal(identity.memberships.length, 1);
  assert.equal(identity.memberships[0]?.role, "reader");
  assert.throws(() => mapIdentity({ iss: ISSUER, sub: "person-2", aud: CLIENT, exp: 2_000_000_000, iat: 1_900_000_000, nonce: "n", email: "person@example.test", groups: ["ases-admins"] }), /verified email/);
  assert.throws(() => mapIdentity({ iss: ISSUER, sub: "person-3", aud: CLIENT, exp: 2_000_000_000, iat: 1_900_000_000, nonce: "n", email: "person@outside.test", email_verified: true, groups: ["ases-admins"] }), /domain is not allowed/);
  const conflict = createOidcGroupMapper({ issuer: ISSUER, policy: { schemaVersion: "1", groups: { readers: [{ organizationId: "acme", repositoryId: "ases", role: "reader" }], admins: [{ organizationId: "acme", repositoryId: "ases", role: "admin" }] } } });
  assert.throws(() => conflict({ iss: ISSUER, sub: "person-4", aud: CLIENT, exp: 2_000_000_000, iat: 1_900_000_000, nonce: "n", email: "person@example.test", email_verified: true, groups: ["readers", "admins"] }), /conflicting roles/);
});

test("OIDC router binds browser flow, sets secure cookies, and issues an RBAC session", async () => {
  const browserBinding = "b".repeat(43);
  const auth = createConsoleAuth([]);
  const router = createOidcSsoRouter({
    sso: {
      beginLogin: async () => ({ browserBinding, authorizationUrl: "https://login.example.test/authorize?state=state-value" }),
      completeLogin: async (state, binding, code) => {
        assert.equal(state, "state-value"); assert.equal(binding, browserBinding); assert.equal(code, "auth-code");
        return { principalId: "oidc-operator", username: "operator@example.test", displayName: "Operator", memberships: [{ organizationId: "acme", repositoryId: "ases", role: "admin" }] };
      },
      getPendingCount: () => 0,
    } as ReturnType<typeof createOidcSso>,
    auth,
  });
  const app = express();
  app.use("/auth/oidc", router);
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const start = await fetch(`${base}/auth/oidc/start`, { redirect: "manual" });
    assert.equal(start.status, 302);
    assert.equal(start.headers.get("location"), "https://login.example.test/authorize?state=state-value");
    const firstCookie = start.headers.get("set-cookie") ?? "";
    assert.match(firstCookie, /__Host-ases_oidc_flow=/);
    assert.match(firstCookie, /Secure/);
    assert.match(firstCookie, /HttpOnly/);
    assert.match(firstCookie, /SameSite=Lax/);
    const callback = await fetch(`${base}/auth/oidc/callback?state=state-value&code=auth-code`, { headers: { cookie: firstCookie.split(";")[0]! }, redirect: "manual" });
    assert.equal(callback.status, 303);
    const cookies = callback.headers.getSetCookie();
    const sessionCookie = cookies.find((value) => value.startsWith("ases_console=")) ?? "";
    assert.match(sessionCookie, /Secure/);
    assert.match(sessionCookie, /HttpOnly/);
    const token = sessionCookie.split(";")[0]!.slice("ases_console=".length);
    assert.equal(auth.getSession(token)?.principalId, "oidc-operator");
    assert.equal(auth.authorize(token, "acme", "ases", "admin"), "admin");
  } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
});
