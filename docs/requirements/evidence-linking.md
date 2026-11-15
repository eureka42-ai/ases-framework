# Evidence linking and verification eligibility

Mark a requirement `VERIFIED` only after placing the evidence file inside the workspace and recording a concise execution description:

```sh
ases requirements set-status ./my-project REQ-001 VERIFIED \
  --evidence evidence/req-001-test.txt \
  --execution-context "pnpm test --filter api on Node 22" \
  --test packages/api/test/req-001.test.ts
```

The CLI stores the evidence SHA-256, capture time, execution description, Node version, platform, and test references. An optional `--evidence-expires-at <ISO-8601>` sets a future expiry. `show`, `list`, and `trace` re-check the file hash and expiry on every read and report `verificationEligibility`; stale, missing, expired, outside-workspace, or unverifiable evidence cannot make a requirement eligible. `trace` shows each evidence integrity state and the eligibility decision.

`VERIFIED` is the recorded implementation status; `verificationEligibility` is the current evidence gate. Consumers that make approval decisions must check `verificationEligibility.eligible`, not status alone. Replacing a stale or expired file with the same bytes does not silently refresh its hash; link it again with a new context and trace entry.
