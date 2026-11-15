# EUREKA42 ASES Framework

**From specification to verified software.** The ASES Framework is a local-first, vendor-neutral toolkit for agent-assisted software engineering. It connects requirements, decisions, implementation tasks, test results, and verifiable evidence through a CLI, read-only MCP server, and project-level host integrations.

> **Development release:** `0.1.0-rc.1`. The npm package has not been published. Host integrations are experimental and are not declared officially supported. ASES-300 source homologation and release rights approval remain open. See [project status](STATUS.md), [roadmap](docs/ROADMAP.md), and [release gates](docs/RELEASE.md).

## Requirements

- Node.js 22 or newer (the local authoring environment is macOS arm64 with Node.js 26.8.1).
- Git.
- Corepack-enabled Node.js and the pinned pnpm version, 10.20.0.

The declared Node.js floor is exercised by the CI matrix, but the new workflow revision must pass remotely before those matrix results count as evidence.

## Install from source

The public package is not available yet. Clone the public Eureka42 repository and build locally:

```bash
git clone https://github.com/eureka42-ai/ases-framework.git
cd ases-framework
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
corepack pnpm test:unit
corepack pnpm integrations:validate
corepack pnpm smoke
```

The aggregate `corepack pnpm test` also builds, runs the complete test suite, and validates integrations.

Run the built CLI directly:

```bash
node packages/cli/dist/bin.js --version
node packages/cli/dist/bin.js help
node packages/cli/dist/bin.js welcome
```

To create an isolated global-style install without changing your system npm prefix, use a dedicated prefix:

```bash
npm install --global --prefix /path/to/ases-cli-prefix ./packages/cli
/path/to/ases-cli-prefix/bin/ases --version
```

This local-package install flow was exercised with a temporary prefix and offline npm mode. A package downloaded from npm cannot be installed until the public release is approved and published.

## First project

```bash
ases doctor
ases init ./my-project
ases interview ./my-project
```

The interview inspects common project manifests, asks about the application type, language, hosting, and database, recommends missing choices, and records decisions as proposals. Review generated files and recommendations before treating any proposal as approved.

Use `--dry-run` for a read-only plan and `--json` for machine-readable output. Initialization is idempotent and does not overwrite existing project files.

## Host integrations

Codex, Claude Code, Kimi Code CLI, and Gemini CLI have experimental project-level integrations. They require a local host installation for live discovery; the framework does not install into global host configuration automatically.

```bash
ases host list
ases host plan claude-code ./my-project
ases host apply claude-code ./my-project --apply
ases host update claude-code ./my-project --apply
ases host restore claude-code <backup-id> ./my-project
ases host uninstall claude-code ./my-project --apply
```

Plans are read-only. Apply/update/uninstall require `--apply`; ownership manifests and hashes protect modified or unrelated files. See each host guide under [`integrations/`](integrations/).

The restore command also defaults to a read-only plan; add `--apply` to restore a verified snapshot. See the [backup guide](docs/cli/backups.md).

## Core commands

| Command | Purpose |
|---|---|
| `ases help` | List commands and options |
| `ases welcome` | Show the Eureka42 wordmark, green on capable interactive terminals |
| `ases doctor [workspace]` | Check local prerequisites and suggest fixes, without remote calls |
| `ases init [workspace]` | Initialize ASES project metadata |
| `ases interview [workspace]` | Propose an initial application profile and stack |
| `ases config validate [file]` | Validate the bootstrap JSON configuration |
| `ases config explain [file]` | Resolve config sources without revealing unrelated secrets |
| `ases requirements list\|show\|trace\|graph` | Inspect requirements, evidence, or export a Mermaid traceability graph |
| `ases dashboard [workspace] [--product id] [--json]` | Generate a local HTML snapshot of requirements, workflow checkpoints, evidence integrity and recorded costs |
| `ases host list\|plan\|apply\|update\|uninstall` | Inspect or manage project-level host integrations |
| `ases plugin remove <id> [workspace]` | Plan safe removal; add `--apply` after reviewing |
| `ases mcp [workspace]` | Start the local read-only MCP server over stdio |
| `ases mcp [workspace] --http` | Start authenticated Streamable HTTP MCP using OAuth bearer introspection |

The MCP server defaults to local stdio. Optional Streamable HTTP mode acts as an OAuth resource server and requires an external authorization server with token introspection; it never issues tokens. Configure `ASES_MCP_RESOURCE_URL`, `ASES_MCP_AUTHORIZATION_METADATA_URL`, `ASES_MCP_INTROSPECTION_URL`, `ASES_MCP_CLIENT_ID`, `ASES_MCP_CLIENT_SECRET_ENV`, and the named secret environment variable before running `ases mcp [workspace] --http`. The default listener is loopback. Network exposure requires an HTTPS resource URL behind a trusted TLS-terminating proxy. See the [Portuguese setup guide](README.md#mcp-remoto-autenticado-opcional), [security policy](docs/security/policy-engine.md), [safe logging](docs/security/safe-logging.md), and [telemetry/evaluation behavior](docs/security/observability.md).

For structured failure codes and recovery steps, see the [CLI error reference](docs/cli/errors.md).

The CI dependency audit, license allowlist, SPDX SBOM, and GitHub provenance workflow are described in the [supply-chain guide](docs/security/supply-chain.md).

## Data and privacy

- Project config defaults to local-only privacy.
- RAG indexes local Markdown/text with citations and source hashes.
- Memory requires consent and supports inspection/deletion.
- Remote telemetry is disabled by default and requires explicit, revocable HTTPS consent; nothing sends automatically.
- Tool and command execution require explicit policy authorization.
- Do not treat model suggestions, imported requirements, or a `VERIFIED` label as external certification. Evidence and source homologation remain reviewable gates.
- Database choices for the generated application are advisory; the framework itself has no database migration system yet. See the [data and migration boundary](docs/architecture/data-migrations.md).

## Development and contribution

The GitHub Actions workflow runs lint, typecheck, build, unit/E2E tests, integration validation, and CLI smoke checks on Node.js 22 and 24. The local lint gate currently checks tracked trailing whitespace and JavaScript script syntax; TypeScript typechecking and tests provide the language and behavior checks.

Contributions should include the relevant requirement ID, tests/evidence, and documentation updates. Keep product-specific requirements in separate catalogs rather than mixing them into the general ASES-300 catalog. See [the project charter](docs/PROJECT-CHARTER.md).

## License and brand

Framework code is licensed under Apache-2.0. ASES source materials, methodology, and Eureka42 marks have separate rights and approval gates. See [`LICENSES.md`](LICENSES.md), [`NOTICE`](NOTICE), [`TRADEMARKS.md`](TRADEMARKS.md), and [`docs/RELEASE.md`](docs/RELEASE.md).

Read the Portuguese guide at [`README.md`](README.md).
