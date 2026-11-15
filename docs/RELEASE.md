# Release checklist — EUREKA42 ASES

Current candidate: `0.1.0-rc.1` (`next` dist-tag). No npm package or official host marketplace release has been published.

## Completed preparation

- The CLI package has public npm metadata, Node.js `>=22`, a release-candidate version, scoped package access `public`, and prerelease dist-tag `next`.
- `LICENSE`, `LICENSES.md`, `NOTICE`, and `TRADEMARKS.md` are included in the CLI tarball. Software code is Apache-2.0; the Eureka42 mark and source methodology have separate terms.
- The package README has source-checkout and post-publication instructions.
- Root source materials are excluded from Git and the npm tarball.
- The CLI, MCP server and four host manifests share the same candidate version.
- The real tarball was installed in a temporary prefix and ran `ases --version` plus `ases welcome --color` successfully; the first packaging attempt's missing module list was corrected before that pass.
- Codex executed the green startup command in an authenticated ephemeral session; temporary plugin installation was removed afterward.

## Required before publishing

1. Confirm that Eureka42 AI has authority to license every code contribution under Apache-2.0 and approve the copyright-holder name used by the notices.
2. Confirm trademark ownership and the limited permission for the logo files bundled in official integrations.
3. Confirm the npm organization/scope `@eureka42` exists and the publishing account has permission. `npm whoami` returned `ENEEDAUTH`, and the unauthenticated package lookup returned 404 (availability versus access remains ambiguous).
4. Complete ASES-300 editorial review and decide whether the ASES-500 reconstruction is approved for distribution. Those documents are not included in the CLI package.
5. Finish host session tests: Codex startup passed, but Skill auto-discovery/MCP are unconfirmed; Claude lacks login, Gemini lacks a configured provider and prior trust was declined, and Kimi startup failed with `EMFILE`. Do not describe a host as supported solely from manifest validation.
6. Build from a clean checkout, inspect the exact tarball, run `npm publish --dry-run --access public --tag next`, then publish only after those gates pass.

## Candidate package check

From the repository root:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm build
npm pack --dry-run ./packages/cli
```

`npm publish --dry-run` is intentionally a release-candidate gate and has not been run with registry authentication. No command in this checklist publishes a package.
