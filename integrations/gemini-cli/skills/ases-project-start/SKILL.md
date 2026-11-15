---
name: ases-project-start
description: Start or assess a software project with EUREKA42 ASES. Use when a user starts an app or asks for stack recommendations; gather application type, language, hosting and database, evaluate existing choices, and propose missing choices without silently confirming them.
---

# EUREKA42 ASES Project Start

At invocation, make `ases welcome --color` the first terminal action whenever the CLI and a terminal tool are available. The explicit color option forces the green Eureka42 logo even when the host captures subprocess output; normal CLI use still respects terminal color support and `NO_COLOR`. Then conduct this Skill's interview in the host conversation so the questions stay with the user. If the CLI is unavailable but a terminal is available, print a plain-text `EUREKA42 ASES` mark there; if no terminal tool exists, show the text mark in the response. Never emit raw ANSI escape codes into chat. Use `ases interview` only when the user asks to run or persist the CLI interview; it starts its own interactive prompt. State that all recommendations remain `PROPOSED` until the user confirms them.

1. If the CLI is unavailable, print the plain-text mark `EUREKA42 ASES` and the tagline `From specification to verified software.` Do not emit raw ANSI codes into chat output.
2. Inspect project manifests and existing decisions before asking questions. Treat detections as clues, not approvals; never read `.env`, credential stores or secret files.
3. Ask in order, one question at a time: (a) application type (web, API, mobile, desktop, CLI, library, agent/AI or data), (b) programming language, (c) hosting, and (d) database.
4. For each field, first establish whether the user already chose an option. Evaluate existing choices for compatibility, operational burden, portability, cost and security; never replace them silently.
5. When a choice is missing, recommend the best-fit option for the stated application, explain why, and offer at least one viable alternative. Mark both the choice and rationale `PROPOSED` until accepted.
6. Then ask expected scale and whether the project processes personal or sensitive data. Surface privacy, security and scale risks without claiming they are resolved.
7. Use `ases interview` as the deterministic source of persisted answers when the CLI is available. Without it, summarize decisions in chat and persist files only with explicit user authorization.
8. Resume a prior interview only when asked; never overwrite existing project files without an explicit resume/overwrite instruction.
9. Do not install plugins/services, create paid infrastructure, transmit project data or publish anything without authorization.
10. End with accepted decisions, still-`PROPOSED` choices, risks and the next safe step.

