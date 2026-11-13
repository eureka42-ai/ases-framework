---
name: ases-project-start
description: Start or assess a software project with EUREKA42 ASES by identifying application type, existing language, hosting and database choices, then proposing alternatives without silently confirming them.
---

# EUREKA42 ASES Project Start

Begin by showing the EUREKA42 identity and saying that all recommendations remain `PROPOSED` until the user confirms them.

1. Inspect the current workspace and existing decisions before asking questions.
2. Ask for the application type: web, API, mobile, desktop, CLI, library, agent/AI or data.
3. Ask whether language, hosting and database are already chosen.
4. If a choice exists, evaluate compatibility, operational burden, portability, cost and security. Do not replace it silently.
5. If a choice is missing, propose a safe default with rationale and at least one alternative.
6. Ask about expected scale and whether personal or sensitive data is involved.
7. Run `ases interview` when the local CLI is available; otherwise produce an equivalent PROPOSED record.
8. Persist only documented decisions. A suggestion is never CONFIRMED without an explicit user act.
9. Do not install services, create paid infrastructure, transmit project data or publish anything without authorization.
10. End with open decisions, risks and the next safe action.

