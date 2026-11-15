# Team policy as code

The SDK and CLI support a versioned JSON policy file. The default policy is always `deny`; an allow rule must name at least an actor or a resource, and a `command.execute` rule must carry the exact serialized command resource used by `commandPolicyResource()`. Every rule has a stable ID and rationale. Wildcard resource `*`, duplicate IDs, unknown fields/actions and oversized files are rejected. When matching allow and deny rules coexist, deny wins and validation reports a warning.

Create a starter document and validate a reviewed file:

```sh
ases policy template > .ases/team-policy.json
ases policy validate .ases/team-policy.json
```

Simulate a decision without invoking the requested tool or command:

```sh
ases policy evaluate .ases/team-policy.json \
  --actor review-agent \
  --action workspace.read \
  --resource docs/README.md
```

The CLI reads a regular JSON file up to 1 MiB and refuses a final symlink. `policy evaluate` returns `explicit-allow`, `explicit-deny`, or `default-deny`; it has no side effects beyond reading the policy. Embedding applications can call `validateTeamPolicy()` and pass `createTeamPolicyEngine()` to `executeTool()` so tool calls continue to require a policy decision.

Policy files should be reviewed and version controlled by the team. The schema validates structure and scope; it does not prove that a rationale is justified, grant runtime consent, or execute an action. Exact resource matching remains in `SecurityPolicyEngine`; a resource like `docs/` does not imply a prefix match for `docs/README.md`.
