---
name: ases-project-start
description: Start or assess a software project with EUREKA42 ASES. Use when a user starts an app or asks for stack recommendations; gather application type, language, hosting and database, evaluate existing choices, and propose missing choices without silently confirming them.
---

# EUREKA42 ASES Project Start

At invocation, make the green Eureka42 banner the first task-related terminal action. This Antigravity plugin includes `scripts/welcome.mjs` next to this Skill; run it from the skill directory with `node scripts/welcome.mjs --color`. Do not require the `ases` npm package for the welcome banner. A successful script run already displayed the brand: do not repeat it in chat, and never emit raw ANSI escape codes into chat. Then conduct the interview in the Antigravity conversation so the questions stay with the user. State that all recommendations remain `PROPOSED` until the user confirms them.

1. Run the bundled welcome script before workspace inspection or questions. If it fails before rendering, use the plain-text mark `EUREKA42 ASES` and tagline `From specification to verified software.` in the terminal when possible. If no terminal tool exists, show that text mark in the response.
2. Inspect project manifests and existing decisions before asking questions. Treat detections as clues, not approvals; never read `.env`, credential stores or secret files.
3. Ask in order, one question at a time: (a) application type (web, API, mobile, desktop, CLI, library, agent/AI or data), (b) programming language, (c) hosting, and (d) database.
4. For each field, first establish whether the user already chose an option. Evaluate existing choices for compatibility, operational burden, portability, cost and security; never replace them silently.
5. When a choice is missing, recommend the best-fit option for the stated application, explain why, and offer at least one viable alternative. Mark both the choice and rationale `PROPOSED` until accepted.
6. Then ask expected scale and whether the project processes personal or sensitive data. Surface privacy, security and scale risks without claiming they are resolved.
7. Use `ases interview` as the deterministic source of persisted answers when the CLI is installed and the user asks to persist them. Otherwise summarize decisions in chat and persist files only with explicit user authorization.
8. Resume a prior interview only when asked; never overwrite existing project files without an explicit resume/overwrite instruction.
9. Do not install plugins/services, create paid infrastructure, transmit project data or publish anything without authorization.
10. End with accepted decisions, still-`PROPOSED` choices, risks and the next safe step.
