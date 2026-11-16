# npm release preflight — 2026-11-16

## Candidate

- Package: `@eureka42/ases-cli@0.1.0-rc.1`
- Access/tag: public / `next`
- Tarball: `eureka42-ases-cli-0.1.0-rc.1.tgz`
- Size: 9,336,378 bytes compressed; 10,540,955 bytes unpacked; 134 files.
- SHA-1: `c4ed3b3986fca54a5bd83450105f54b3f9f55a1f`
- SHA-512 integrity: `sha512-I4nXc7/SMRY3MwKsNVhnAQRbjVmdti/kQH8kE4nwIRRlB0uvjoyC3QhtolgkPrP1758cofCSndLJ5VdslaDJfw==`
- Package inspection: `npm pack --dry-run --json ./packages/cli` completed successfully. The tarball includes the CLI runtime, legal notices, and host integrations, including the native Antigravity plugin and green-logo fallback. It excludes the source methodology bundle.

## Verification

- `pnpm test`: PASS (205 unit/E2E tests, build, integration validation).
- `pnpm supply-chain`: PASS (152 dependency license metadata records; SPDX SBOM generated).
- GitHub Actions CI for commit `1058d9c395e56707618f455eb0c79b966a9684b9`: PASS — [run 43833216019](https://github.com/eureka42-ai/ases-framework/actions/runs/43833216019).
- `npm publish --dry-run --access public --tag next ./packages/cli`: package assembly completed; registry warned that login is required.
- Actual authorized publish attempt: rejected with `ENEEDAUTH`. No package was published. `npm whoami` also returned `ENEEDAUTH`.

## State

Owner authorization to complete and publish is documented in `LAUNCH-2026-11-16-owner-authorization.md`. The only release operation blocked by this machine's current account state is authenticated registry publication. Do not treat the local package build or CI artifact as a published npm release.
