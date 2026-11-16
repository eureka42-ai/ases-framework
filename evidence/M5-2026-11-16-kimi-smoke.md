# M5 — Kimi Code CLI smoke report

Date: 2026-11-16

## Report supplied by the owner

- Kimi Code CLI 2.5.3 on macOS arm64, Node.js 26.13.1.
- The agent read the Skill from the repository clone and followed its interview in the active conversation. No Kimi plugin was installed; no user-global Skill existed at startup.
- A project-level copy was prepared in the temporary workspace at `/tmp/ases-kimi-smoke/ws/.agents/skills/ases-project-start/` after the current session had already started. The owner explicitly reports that discovery on a fresh session was not confirmed by this run.
- A temporary shim called the locally built `ases` executable; `ases welcome --color` returned exit code 0 before the first question. Captured output confirmed ANSI RGB `38;2;0;190;130` on the EUREKA42 wordmark.
- The first question asked the application type. The workspace was empty and temporary; no repository files, credentials, or `.env` files were touched.
- The Kimi `/plugins` lifecycle remains untested. The report confirms it is unavailable as a shell subcommand in Kimi 2.5.3, so native plugin installation must be tested from the TUI if desired.

## Interpretation

This is a successful authenticated Skill-guided interview and green CLI banner smoke, with no project changes. It does not prove that `.agents/skills` was auto-discovered by the already-running session because the Skill was also read manually and the workspace copy was created after startup. Earlier evidence `M5-2026-11-15-progress-25.md` separately records loading through `--skills-dir` in a real Kimi session. Both runs report that the `EMFILE` issue did not prevent the current smoke (the new report needed no workaround).

AFR-032 remains implemented for the portable Skill and tested `--skills-dir` workflow. Per-user native plugin installation and fresh-session project-level auto-discovery remain optional validation items.
