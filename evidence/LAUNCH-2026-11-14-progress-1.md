# Launch preparation progress 1

Date: 2026-11-14 (America/Sao_Paulo)

## Licensing and scope

- Per user direction, selected Apache License 2.0 for Eureka42 software code, integration manifests, commands, and onboarding instructions.
- Added `LICENSE`, `LICENSES.md`, `NOTICE`, `TRADEMARKS.md`, and third-party dependency notices. The methodology source bundle and brand files have separate terms; the source bundle remains excluded from Git and npm.
- The image provenance file itself still marks trademark ownership and public redistribution rights as `VALIDATION_REQUIRED`. Confirm rights before public package/plugin distribution.
- Direct runtime dependency metadata inspected: MCP server/core 2.4.0 carry upstream Apache-2.0/MIT transition notices; Zod 4.6.7 is MIT. Their upstream license files are installed with the dependencies.

## npm candidate

- Prepared `@eureka42/ases-cli@0.1.0-rc.1` with Node.js `>=22`, public scoped-package access, `next` dist-tag, repository metadata, README, and prepack build.
- Aligned CLI/MCP and all four host manifests to `0.1.0-rc.1` and added version consistency checks.
- First isolated tarball install exposed missing internal modules; the package file list was fixed and the rebuilt tarball installed successfully in `/private/tmp/eureka42-package-smoke2/install`.
- Installed CLI output: version `0.1.0-rc.1`; `ases welcome --color` emitted RGB ANSI `(0,190,130)`; ASES-300/500 source files were absent from the installed package.
- `npm whoami` returned `ENEEDAUTH`. `npm view @eureka42/ases-cli version` returned 404, which cannot distinguish an unused name from a private or inaccessible package without registry access. No package was published.

## Remaining release gates

- Verify code contribution ownership and approval of the copyright holder in the notices.
- Verify logo/trademark rights for the bundled plugin images.
- Authenticate an npm account with write permission for scope `@eureka42`; establish the scope/package is controlled by Eureka42 AI.
- Complete methodology/source homologation and the remaining host session tests before an official release.
