---
name: ases-project-start
description: Start or assess a software project with EUREKA42 ASES. Use when a user starts an app or asks for stack recommendations; gather application type, language, hosting and database, evaluate existing choices, and propose missing choices without silently confirming them.
---

# EUREKA42 ASES Project Start

Begin with the EUREKA42 ASES identity before asking anything. If the `ases` CLI is available, run `ases interview` first: it renders the teal/green terminal identity, safely inspects known project manifests and begins the interview. For a JSON-driven interview, pass an answers file; never make up answers or inspect `.env` files. State that all recommendations remain `PROPOSED` until the user confirms them.

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

