# Launch preparation progress 2 — current package preflight

Date: 2026-11-15 (America/Sao_Paulo)

## Current candidate checks

- Candidate: `@eureka42/ases-cli@0.1.0-rc.1`.
- `pnpm supply-chain` — PASS; license metadata checked for 152 dependency packages and SPDX SBOM generated in a temporary directory.
- `npm pack --dry-run --json` — PASS; prepack build succeeded and included 128 files, 8,215,971 compressed bytes, with integrity `sha512-Go+iJnXkWeXGCzVzspEQkLvDnOyrwfEZx07KhwAZlzl7sTqn5mFX/2yS61OdFxC+6IC7W94YAclH1a5awJ2dGQ==`.
- CI for commit `04bab1e08d6932a6ec0890ab0e36e34e8b75871e` — PASS for Node.js 22/24, tests, host integrations, audit, licenses, SBOM and provenance: [run 43792353763](https://github.com/eureka42-ai/ases-framework/actions/runs/43792353763).
- No registry publication, GitHub release or deployment was performed.

## Remaining launch gates

- Obtain owner approval for registry publication (AFR-104); this is not inferred from public-repository approval.
- Confirm authority to distribute Eureka42 marks/assets and to license all code contributions under Apache-2.0.
- Complete editorial/methodology homologation for ASES-300 and resolve the independent-source status of ASES-500.
- Authenticate and complete the remaining Claude and Gemini host sessions (AFR-031 and AFR-034).
- Confirm write access to the npm `@eureka42` scope before publication.

The release is technically packaged as a release candidate, but external rights and publication gates remain open.
