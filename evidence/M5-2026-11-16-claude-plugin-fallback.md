# M5 progress — Claude Code bundled welcome fallback

Date: 2026-11-16

## Change

- Added `integrations/claude-code/scripts/welcome.mjs`, a dependency-free Node script bundled with the plugin. It prints the same ASCII mark and RGB colors as `packages/cli/src/brand.ts`; `--color` forces green output when stdout is captured.
- Updated the Claude command and shared onboarding Skill to use the installed `ases welcome --color` command first, then the plugin-local script when running from the Claude plugin and the package is unavailable.
- Synchronized the shared Skill copies across all supported host directories.
- Updated the marketplace review hashes and scope to include this static welcome script.

## Local verification

- `node --check integrations/claude-code/scripts/welcome.mjs`: PASS.
- `node integrations/claude-code/scripts/welcome.mjs --color`: PASS; captured output includes ANSI RGB foreground `38;2;0;190;130` and the Eureka42 mark.
- `claude plugin validate integrations/claude-code --strict`: PASS.
- `git diff --check`: PASS.
- `pnpm integrations:validate`: PASS after updating the review record hashes.
- `pnpm lint`: PASS.
- Local Claude Code CLI reports version 2.1.325, but `claude auth status` reports `loggedIn: false`; a real conversation smoke cannot run in this session.

## Remaining proof

Claude Code 2.1.325 / Opus 5.5 report supplied by the project owner confirms the Skill was read manually and the first application-type question appeared, but the plugin was not installed or loaded, the CLI package was unavailable, and green logo rendering was not verified. This is external report evidence, not a locally reproduced session. Start an authenticated session with `claude --plugin-dir ./integrations/claude-code`, invoke `/eureka42-ases:ases-start`, and confirm the bundled fallback runs before the interview question. AFR-031 remains `PENDING` until that real session smoke is recorded.
