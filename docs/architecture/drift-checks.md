# Architecture contracts and drift checks

`ases architecture check [workspace] [--contracts path] [--json]` evaluates the JSON contract registry at `docs/architecture/contracts.json` by default. A registry links each group of assertions to an ADR file and ID. The ADR heading and its single `Status:` line are checked before results are interpreted.

Contracts currently support three read-only assertions:

- `json-pointer-equals`: compare a JSON value at a JSON Pointer with an expected value.
- `text-contains`: verify a bounded literal marker in a regular source file.
- `file-exists` / `file-absent`: check a workspace-relative path.

The checker does not execute application code, make network requests, or print observed values. Paths must remain inside the canonical workspace; symlinks, malformed JSON, oversized inputs and missing ADR status are reported as unverifiable. The CLI exits `1` for drift against an `ACCEPTED` ADR and `2` when an accepted contract cannot be verified.

An ADR with status `PROPOSED` is observation-only: results still show PASS/DRIFT so maintainers can review whether the implementation matches the proposal, but drift does not fail the command. This distinction prevents a draft ADR from being treated as an approved architecture decision. `SUPERSEDED` and `REJECTED` decisions are also non-blocking until the contract is updated to point at the active accepted decision.

Run the repository's current checks with:

```sh
ases architecture check .
ases architecture check . --json
```

The default contracts in `contracts.json` cover the monorepo/TypeScript configuration and source-level regression markers for the offline bootstrap. Add narrowly scoped assertions when an ADR is accepted; keep the source ADR authoritative for rationale and decision status.
