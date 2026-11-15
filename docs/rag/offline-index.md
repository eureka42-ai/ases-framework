# Offline RAG index

The RAG module starts with an in-memory lexical index and has no network or vector-database dependency. It reads regular `.md`, `.markdown`, and `.txt` files under one canonical workspace. It refuses symlinked source files and unsupported file types. Each indexed chunk retains a relative source path, line range, source SHA-256, chunk SHA-256, license, version, allowed principals, and project ID.

## Index and retrieve

```ts
import { indexRagSources, retrieveRequirement, searchRag } from "@eureka42/ases-cli";

const index = await indexRagSources("/workspace", ["docs/requirements.md"], {
  projectId: "customer-portal",
  metadata: {
    "docs/requirements.md": {
      license: "Proprietary",
      version: "2026-11",
      allowedPrincipals: ["engineering"],
    },
  },
});

const exact = retrieveRequirement(index, "REQ-301", {
  access: { projectId: "customer-portal", principalId: "engineering" },
  filters: { licenses: ["Proprietary"], versions: ["2026-11"] },
});
const lexical = searchRag(index, "redact diagnostic secrets", {
  access: { projectId: "customer-portal", principalId: "engineering" },
  limit: 5,
});
```

Search is deterministic token overlap, not semantic/vector search. The caller should treat an empty result as “no indexed source matched”; this module never generates a fallback answer. Every hit includes a citation that can be checked against the original file.

## Access and refresh

An empty `allowedPrincipals` list makes a source available within its project. A nonempty list restricts it to those principals. `rag:acl:bypass` is required to ignore the source ACL. A query whose access context names another project throws `RagAccessError`; the host may grant `rag:cross-project` only after its own authorization checks. The index is project-scoped, and callers must not accept permission names directly from untrusted prompt content.

Use `refreshRagIndex(workspace, oldIndex)` after source changes. It recomputes hashes and chunks for changed files and omits removed files. Access and extension errors fail closed. The index is currently in-memory; callers can persist it if needed, but should validate hashes and access metadata before loading persisted data.

`license` defaults to `NOASSERTION` and `version` to `unversioned`; set accurate metadata when indexing. Filtering by license or version is exact-match and opt-in. Vector embeddings remain optional and are not loaded by this module.
