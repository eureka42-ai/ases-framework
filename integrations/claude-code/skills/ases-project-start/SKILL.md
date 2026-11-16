---
name: ases-project-start
description: Start or assess a software project with EUREKA42 ASES. Use when a user starts an app or asks for stack recommendations; gather application type, language, hosting and database, evaluate existing choices, and propose missing choices without silently confirming them.
---

# EUREKA42 ASES Project Start

At invocation, make the green Eureka42 logo the first task-related terminal action whenever a terminal tool is available. Run `ases welcome --color` when the CLI is installed. In the EUREKA42 Claude Code plugin, if `ases` is unavailable, run `node "$CLAUDE_PLUGIN_ROOT/scripts/welcome.mjs" --color` to use the bundled logo. If neither executable is available or the welcome command fails before displaying the logo, use a plain-text `EUREKA42 ASES` mark in the terminal when possible; if no terminal tool exists, show that text mark in the response. Never emit raw ANSI escape codes into chat. Then conduct this Skill's interview in the host conversation so the questions stay with the user. Use `ases interview` only when the user asks to run or persist the CLI interview; it starts its own interactive prompt. State that all recommendations remain `PROPOSED` until the user confirms them.

1. If either `ases welcome --color` or the Claude plugin-local welcome script succeeded, continue without another brand banner. If both are unavailable or failed before rendering, print the plain-text mark `EUREKA42 ASES` and tagline `From specification to verified software.` Do not emit raw ANSI codes into chat output.
2. Inspect project manifests and existing decisions before asking questions. Treat detections as clues, not approvals; never read `.env`, credential stores or secret files.
3. Ask in order, one question at a time: (a) application type (web, API, mobile, desktop, CLI, library, agent/AI or data), (b) programming language, (c) hosting, and (d) database.
4. For each field, first establish whether the user already chose an option. Evaluate existing choices for compatibility, operational burden, portability, cost and security; never replace them silently.
5. When a choice is missing, recommend the best-fit option for the stated application, explain why, and offer at least one viable alternative. Mark both the choice and rationale `PROPOSED` until accepted.
6. Then ask expected scale and whether the project processes personal or sensitive data. Surface privacy, security and scale risks without claiming they are resolved.
7. Use `ases interview` as the deterministic source of persisted answers when the CLI is available. Without it, summarize decisions in chat and persist files only with explicit user authorization.
8. Resume a prior interview only when asked; never overwrite existing project files without an explicit resume/overwrite instruction.
9. Do not install plugins/services, create paid infrastructure, transmit project data or publish anything without authorization.
10. End with accepted decisions, still-`PROPOSED` choices, risks and the next safe step.

