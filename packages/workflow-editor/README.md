# ASES Workflow Editor

The visual editor lets you compose a bounded workflow DAG with agent/tool/approval/condition steps, names, agent IDs, dependency links, timeouts and declared permissions. It saves drafts in browser-local storage, imports/exports JSON, and validates a deterministic execution order in preview mode.

## Run locally

```sh
pnpm install
pnpm --filter @eureka42/ases-workflow-editor dev --host 127.0.0.1
```

Open the local URL printed by Vite. For production assets, run `pnpm --filter @eureka42/ases-workflow-editor build`; output goes to `dist/`.

The editor is browser-only and makes no network requests. Drafts stay in that browser profile until cleared. “Run preview” validates ordering and shows the plan; it does not call agents or execute tools. Exported definitions preserve `name`, `agentId`, `timeoutMinutes` and `permissions` as workflow step metadata. The host receives this configuration through the workflow execution context and remains responsible for enforcing permissions and timeouts.

Design concept: [`../../docs/design/workflow-editor-concept.png`](../../docs/design/workflow-editor-concept.png).
