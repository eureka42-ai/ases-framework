# Release checklist — EUREKA42 ASES

Current candidate: `0.1.0-rc.1` (`next` dist-tag). No npm package or official host marketplace release has been published.

## Completed preparation

- The CLI package has public npm metadata, Node.js `>=22`, a release-candidate version, scoped package access `public`, and prerelease dist-tag `next`.
- `LICENSE`, `LICENSES.md`, `NOTICE`, and `TRADEMARKS.md` are included in the CLI tarball. Software code is Apache-2.0; the Eureka42 mark and source methodology have separate terms.
- The package README has source-checkout and post-publication instructions.
- The owner has confirmed distribution rights for the official repository. The unchanged source bundle is included in Git; it remains excluded from the CLI npm tarball and outside Apache-2.0.
- The CLI, MCP server and host adapters share the same candidate version; Antigravity also has a native plugin manifest and bundled logo.
- The real tarball was installed in a temporary prefix and ran `ases --version` plus `ases welcome --color` successfully; the first packaging attempt's missing module list was corrected before that pass.
- Codex executed the green startup command in an authenticated ephemeral session; temporary plugin installation was removed afterward.

## Release status and remaining external gates

The owner explicitly authorized completion and npm publication on 2026-11-16; see `evidence/LAUNCH-2026-11-16-owner-authorization.md`. The authorization gate (AFR-104) is satisfied. Publication is not yet possible from this machine: `npm whoami` returned `ENEEDAUTH`, and the unauthenticated registry lookup returned 404. No token has been read or requested. The release can be published as soon as an authorized npm identity is logged in and has access to `@eureka42`.

Remaining validation is recorded without treating it as a registry credential:

1. Claude Code needs an authenticated interactive smoke for `/eureka42-ases:ases-start` (AFR-031). Its plugin passes strict structural validation and includes a local green-logo fallback.
2. Codex Skill auto-discovery and MCP connectivity remain unconfirmed. Codex startup passed in an authenticated ephemeral session.
3. ASES-300 editorial findings are recorded in `evidence/SOURCES-2026-11-14-review-1.md`. ASES-500 is included only as a reconstruction for validation; the independent original is absent and the file is not represented as homologated.
4. After npm authentication is available, verify scope write access, inspect the exact tarball, run the authenticated publish dry-run, and publish the authorized release with the `next` tag.

Antigravity CLI 1.5.9 passed strict plugin validation and a real conversational smoke in a temporary empty workspace; Kimi passed a guided Skill smoke and green-logo check. See the M5 evidence files.

## Candidate package check

From the repository root:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm build
npm pack --dry-run ./packages/cli
```

`npm publish --dry-run` must be repeated with registry authentication available. The owner's explicit authorization is on record; the npm login and scope permission are external account state.
