# CI progress 9 — release candidate and launch preparation

Date: 2026-11-14 (America/Sao_Paulo)

Commit: `0d053958445bad073dc548f1df3a9915ff15c409`

Workflow: [GitHub Actions run 43667732926](https://github.com/eureka42-ai/ases-framework/actions/runs/43667732926)

## Result

- Node.js 22: PASS.
- Node.js 24: PASS.
- Both jobs completed build and offline checks successfully.
- Local `pnpm test`: PASS, 82/82 automated tests and integration validation.
- Final npm tarball was installed in a temporary prefix; CLI version, green welcome output, and read-only Codex host plan succeeded.
- `git diff --check`: PASS before the code/evidence commit.

Registry authentication and package-scope ownership are not established. This CI run does not publish anything or clear the legal, source-homologation, or remaining host-session gates.
