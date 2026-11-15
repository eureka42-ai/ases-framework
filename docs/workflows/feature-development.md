# Feature development workflow

`createFeatureWorkflow()` in `packages/cli/src/workflows.ts` provides a serial, validated starting point for feature work. `executeFeatureWorkflow()` dispatches typed handlers and fails with `APPROVAL_REQUIRED` unless the final review returns explicit approval from an independent reviewer:

```text
analyze → plan → implement → test → evidence → review
```

The workflow engine validates dependencies and ordering. A host supplies the handler for each step; handlers are responsible for actual repository operations. The `test` handler must run the project's relevant checks. The `evidence` handler should persist the command, outcome, timestamp, and a SHA-256 digest of the captured output in the project workspace. `executeFeatureWorkflow()` checks the `review` handler's returned decision and fails closed unless the decision is explicitly `APPROVED` by a different reviewer.

The included integration test exercises all six stages, writes a temporary evidence artifact from the test result, verifies its digest, and checks both independent approval and self-approval rejection. It does not claim that the generic workflow engine itself edits code or starts project-specific tests; those actions belong to the configured handlers.

## Minimal usage

```ts
import { executeFeatureWorkflow } from "@eureka42/ases-cli";

await executeFeatureWorkflow({
  analyze: async () => {},
  plan: async () => {},
  implement: async () => {},
  test: async () => {},
  evidence: async () => {},
  review: async () => ({ status: "PENDING", authorId: "agent-1" }),
}, { dryRun: true, featureId: "add-user-profile" });
```

Start with `dryRun: true` to inspect the order without invoking handlers. Provide workspace-scoped handlers and real author/reviewer identities before running with `dryRun: false`.
