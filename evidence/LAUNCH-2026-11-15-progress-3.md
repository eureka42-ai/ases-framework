# Launch preparation progress 3 — owner confirmed source distribution

Date: 2026-11-15 (America/Sao_Paulo)

## Owner direction and source package

- The owner explicitly confirmed the right to distribute the source and brand materials with the official EUREKA42 ASES Framework.
- Added the existing `FONTES_ASES_PARA_DESKTOP_FRAMEWORK/` bundle to the public repository without editing the six source copies covered by its SHA-256 manifest. All six checks passed immediately before Git inclusion.
- Public Git inclusion: commit `5847f619a41fec008872bbd77ef077b4c0c4e9ea`. CI initially found the source files' intentional Markdown hard breaks; lint now excludes only this hash-pinned source bundle. The fix commit `ed111d5e115ba568dfbd494a2f085fd4598dc63b` passed Node.js 22/24, tests, integrations, audit, SBOM and provenance: [CI run 43794780465](https://github.com/eureka42-ai/ases-framework/actions/runs/43794780465).
- Updated `LICENSES.md`, `NOTICE`, and `TRADEMARKS.md` to separate this owner-confirmed official-project distribution from the Apache-2.0 software license. The source material is still excluded from the CLI npm package.
- The bundle contains the ASES-300 working DOCX, a Markdown conversion, the ASES-500 methodology reconstruction, and Eureka42-specific product references. It does not contain an independent ASES-500 original.

## Editorial state

- The ASES-300 conversion is not homologated. Prior render inspection produced 303 page images and sampled 14 pages; identified editorial follow-up includes the Word table of contents (page 4), pseudocode alignment (page 33), and bibliography/proofreading (page 303). See `evidence/SOURCES-2026-11-14-review-1.md` and `evidence/ASES-300-markdown-structure-review-2026-11-13.md`.
- ASES-500 remains labeled as a reconstruction for validation, not as an original or recognized standard. Rights to distribute do not establish editorial or methodological validity.

## Current release gates

- `npm whoami` returns `ENEEDAUTH`; the npm publisher account/scope cannot be verified on this machine.
- `npm publish --dry-run --access public --tag next` assembled the 128-file RC tarball but reported that npm registry access requires login. The dry-run was stopped without publishing.
- Claude remains unauthenticated; Gemini has no configured auth method. AFR-031 and AFR-034 remain pending.
- The candidate package dry-run and supply-chain checks are recorded in `evidence/LAUNCH-2026-11-15-progress-2.md`. No npm publication was made.
- The user's distribution-right confirmation is recorded; AFR-104 still requires explicit approval of the actual registry publication. The owner confirmation alone is not treated as a publish command.
