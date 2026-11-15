# Security policy and command authorization

`SecurityPolicyEngine` applies deny-by-default authorization. A request is permitted only when an explicit `allow` rule matches its action plus any actor/resource constraints; any matching `deny` rule overrides matching allows. An empty policy permits nothing.

```ts
import { SecurityPolicyEngine, executeTool } from "@eureka42/ases-cli";

const policy = new SecurityPolicyEngine([
  { effect: "allow", action: "tool.execute", actorId: "review-agent", resource: "read-requirements" },
]);
await executeTool(tool, input, { policy, actorId: "review-agent" });
```

All runtime tools now require an explicit decision, including read-only tools. A callback can still be supplied by an embedding host, but callers should prefer the shared engine so rule matching and deny precedence remain consistent.

Tools can optionally declare function capabilities such as `repository.search` or `file.read`. `rankToolsByCapabilities(tools, required)` returns deterministic match metadata (coverage score, matched/missing capabilities, compatibility and side-effect flag) so an agent or host can select a candidate before asking for authorization. It does not execute a tool or grant permission; the selected tool still must pass through `executeTool()`.

```ts
import { rankToolsByCapabilities, executeTool, SecurityPolicyEngine } from "@eureka42/ases-cli";

const candidates = rankToolsByCapabilities(tools, ["repository.search", "file.read"]);
const selected = candidates.find((candidate) => candidate.compatible);
// Resolve the named tool, then explicitly authorize it with executeTool().
```

Capability declarations must be unique lowercase identifiers. Partial matches remain visible below compatible tools so the host can explain why a candidate cannot fulfill the full request. Tool names must be unique in the supplied discovery set.

`authorizeCommand()` returns a validated command plan; it does not spawn a process. Command rules require an exact signature from `commandPolicyResource(executable, args)`; broad command allow rules do not match. Shell executables and dynamic interpreter evaluation flags are rejected even when explicitly allowlisted. Arguments with parent traversal are rejected, and the working directory must exist inside the canonical workspace without symlink escape.

If a future runner executes the returned plan, it must use a no-shell process API, a controlled environment, time/output limits, and revalidate authorization immediately before dispatch. This module does not implement process execution.
