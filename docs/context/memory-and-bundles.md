# Local memory and ContextBundle

## Memory

Memory is stored only inside the selected workspace at `.ases/memory/<scope>/`. `remember()` requires explicit consent, a `session` or `project` scope, a TTL from one second through one year, and an origin reference. Files are created exclusively with mode `0600`; symlinked storage directories and entry files are rejected. The value has a SHA-256 integrity digest.

```ts
const saved = await remember(workspace, {
  scope: "project",
  value: "Use PostgreSQL for new services",
  ttlMs: 30 * 24 * 60 * 60 * 1000,
  consent: true,
  origin: { kind: "user-confirmed", reference: "decision-42" },
});

const visible = await inspectMemory(workspace, "project");
await forgetMemory(workspace, "project", saved.id);
```

Inspection hides expired entries by default. `includeExpired: true` is available for review before deletion. `forgetMemory()` removes the stored file and reports whether an entry existed. There is no implicit cloud sync or cross-project lookup.

## ContextBundle

`createContextBundle()` exports only explicitly supplied decisions, requirements, and checkpoints. Each source content must match its supplied SHA-256 before export. Recognized API/provider tokens, JWTs, bearer credentials, credential-bearing URLs, private-key blocks, and credential assignments are redacted; the bundle includes the redaction count and an integrity hash. `verifyContextBundle()` rejects changes after export. Secret detection is pattern-based, so review the preview before sharing a bundle.

The bundle hash detects accidental or malicious mutation when the hash is not also replaced; it is not a digital signature and does not establish who created the bundle. Source paths and hashes remain provenance references, and importing a bundle should still require a preview and conflict check.
