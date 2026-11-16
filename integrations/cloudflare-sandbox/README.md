# Eureka42 remote execution for Cloudflare Containers

This reference Worker connects the CLI's `createRemoteExecutionClient()` to a one-shot Cloudflare Durable Object Container job. It is opt-in, protected by a Worker secret, starts a fresh Durable Object per request, runs a digest-pinned image in a microVM with outbound Internet disabled, and destroys the container after the job. It accepts only explicit argv and caller-selected UTF-8 files; it does not forward environment variables or credentials into the sandbox.

## Deploy the Worker

Cloudflare Containers require an eligible Workers plan and account. In an authenticated Cloudflare deployment environment with Wrangler installed, generate a long random bearer secret and store it as a Worker secret:

```sh
pnpm dlx wrangler secret put ASES_SANDBOX_TOKEN
pnpm dlx wrangler deploy
```

Apply account-level rate limits to `POST /v1/execute` and monitor the configured ten-container cap and provider billing. Keep the secret in a server-side secret manager; never put it in a CLI argument, repository, project file, or sandbox input. The Worker deliberately enables no CORS and returns sanitized errors.

## Invoke from the host application

```ts
import { createRemoteExecutionClient } from "@eureka42/ases-cli";

const sandbox = createRemoteExecutionClient({
  enabled: true,
  endpoint: process.env.ASES_SANDBOX_URL!, // https://<worker-host>/v1/execute
  token: process.env.ASES_SANDBOX_TOKEN!,
  requestTimeoutMs: 190_000,
});

const result = await sandbox.execute({
  enabled: true,
  argv: ["node", "scripts/check.js"],
  cwd: "project",
  files: [{ path: "project/scripts/check.js", content: "console.log('isolated')" }],
  timeoutMs: 120_000,
});
```

`argv` runs directly without an implicit shell; callers may still deliberately invoke a shell inside the isolated VM. Limits are 64 arguments, 100 text files / 3 MiB input, 240 seconds command time, 128 KiB each of stdout/stderr, and 300 seconds total setup plus execution. Common `.git`, `.env`, `.ssh`, `.aws`, `.npmrc`, `.pypirc`, `.netrc`, and `.secrets` paths are rejected. Review all submitted project files and remove private source, tokens, and credentials before sending them.

Cloudflare documents each Container as a Linux VM with its own kernel and network, and states that a container can start with outbound Internet disabled. The reference uses the Durable Object Container API's direct argv execution, caps global container instances, and destroys every one-shot instance. Files inside a single job remain mutually visible to commands in that job. Never run two tenants' work in one job. See the [Container API](https://developers.cloudflare.com/containers/api/durable-object-container/), [execution guide](https://developers.cloudflare.com/containers/guides/execute-commands/), [sandbox overview](https://developers.cloudflare.com/sandbox/) and [security model](https://developers.cloudflare.com/sandbox/concepts/security/).

## Operations and verification boundary

`wrangler dev` runs containers locally through Docker; deployment creates Cloudflare-managed VM instances. This repository validates the Worker contract and client using local tests/mocks. Deploying and exercising a live Worker requires the organization's Cloudflare account, billing plan, secret provisioning, and external endpoint; no account was contacted by the local build.
