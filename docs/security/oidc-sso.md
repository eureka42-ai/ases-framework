# OIDC SSO and centralized access mapping

The SDK provides an embeddable OpenID Connect Authorization Code flow for enterprise hosts. `createOidcSso()` discovers the issuer metadata, uses PKCE S256, validates a one-time state bound to an HttpOnly browser cookie, exchanges the code over HTTPS, and validates the RS256 ID-token signature and issuer, audience/authorized party, time, and nonce claims. ID tokens older than one hour are rejected by default; configure `maxTokenAgeSeconds` from 60 seconds through 24 hours when the provider's token lifetime requires it. Providers using other JWT signing algorithms are rejected explicitly.

`createOidcSsoRouter()` mounts `/start` and `/callback` handlers into a host-owned Express application. It issues `Secure`, `HttpOnly`, `SameSite` cookies, creates an in-memory RBAC session only after token validation, and never accepts a redirect destination from the browser. Mount the callback at the exact `redirectUri` registered with the identity provider. Deploy only behind HTTPS; local-password console startup remains loopback-only.

The organization owns the identity provider, client registration, client secret, TLS termination, session persistence/replication, and central policy distribution. Map IdP groups through a centrally managed, versioned policy. The provided `createOidcGroupMapper()` applies exact group-to-repository role mappings, optional email-domain allowlists, and verified-email requirements; unmapped users receive no memberships, and conflicting roles fail closed. The mapped memberships are carried into the same `createConsoleAuth().authorize()` RBAC checks used by local accounts. Apply `createTeamPolicyEngine()` to each protected action as well as checking the active console session. Policy refresh and distribution are host responsibilities; do not cache revoked group grants beyond the host's approved refresh interval.

```ts
import express from "express";
import { createConsoleAuth, createOidcGroupMapper, createOidcSso, createOidcSsoRouter } from "@eureka42/ases-cli";
import { enterpriseAccessPolicy } from "./centrally-managed-policy.js";

const auth = createConsoleAuth([]);
const sso = createOidcSso({
  issuer: process.env.ASES_OIDC_ISSUER!,
  clientId: process.env.ASES_OIDC_CLIENT_ID!,
  clientSecret: process.env.ASES_OIDC_CLIENT_SECRET!,
  redirectUri: "https://console.example.test/auth/oidc/callback",
  mapIdentity: createOidcGroupMapper({
    issuer: process.env.ASES_OIDC_ISSUER!,
    allowedEmailDomains: ["example.test"],
    policy: enterpriseAccessPolicy,
  }),
});

const app = express();
app.use("/auth/oidc", createOidcSsoRouter({ sso, auth }));
// Protected routes check auth.authorize(sessionToken, org, repo, action)
// and the current centrally supplied team policy before performing work.
```

Do not put provider secrets, central policy credentials, tokens, authorization codes, or ID-token content into logs. The API stores pending states and sessions in process memory; deploy a shared store or an affinity-backed host if the application runs multiple instances. The auth-code state map is bounded and expires after ten minutes. Cookie and session revocation behavior must be aligned with the host's central identity lifecycle.

This integration follows [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) for authorization-code ID-token validation, [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html) for issuer metadata, and [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) / [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html) for current OAuth security and PKCE S256 requirements. Test provider interoperability against the organization's actual issuer before deployment.
