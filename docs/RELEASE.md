# Release checklist — EUREKA42 ASES

Current candidate: `0.1.0-rc.1` (`next` dist-tag). No npm package or official host marketplace release has been published.

## Completed preparation

- The CLI package has public npm metadata, Node.js `>=22`, a release-candidate version, scoped package access `public`, and prerelease dist-tag `next`.
- `LICENSE`, `LICENSES.md`, `NOTICE`, and `TRADEMARKS.md` are included in the CLI tarball. Software code is Apache-2.0; the Eureka42 mark and source methodology have separate terms.
- The package README has source-checkout and post-publication instructions.
- The owner has confirmed distribution rights for the official repository. The unchanged source bundle is included in Git; it remains excluded from the CLI npm tarball and outside Apache-2.0.
- The CLI, MCP server and four host manifests share the same candidate version.
- The real tarball was installed in a temporary prefix and ran `ases --version` plus `ases welcome --color` successfully; the first packaging attempt's missing module list was corrected before that pass.
- Codex executed the green startup command in an authenticated ephemeral session; temporary plugin installation was removed afterward.

## Required before publishing

1. Confirm that Eureka42 AI has authority to license every code contribution under Apache-2.0 and approve the copyright-holder name used by the notices.
2. Owner confirmed distribution of the unmodified brand and source bundle with the official project. Their scope is documented in `LICENSES.md` and `TRADEMARKS.md`; the source files remain outside Apache-2.0.
3. Confirm the npm organization/scope `@eureka42` exists and the publishing account has permission. Latest `npm whoami` returned `ENEEDAUTH`; the machine is not logged in to npm.
4. ASES-300 remains a work conversion with editorial findings recorded in `evidence/SOURCES-2026-11-14-review-1.md`. ASES-500 is publicly included only as a reconstruction for validation; the independent original is absent and the file is not represented as homologated.
5. Finish host session tests: Codex startup and Kimi Skill passed; Codex auto-discovery/MCP remain unconfirmed; Claude lacks login and Gemini lacks a configured provider. Do not describe a host as supported solely from manifest validation.
6. Build from a clean checkout, inspect the exact tarball, run `npm publish --dry-run --access public --tag next`, then publish only after the remaining gates pass and the owner explicitly authorizes publication.

## Candidate package check

From the repository root:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm build
npm pack --dry-run ./packages/cli
```

`npm publish --dry-run` is intentionally a release-candidate gate and has not been run with registry authentication. No command in this checklist publishes a package.
