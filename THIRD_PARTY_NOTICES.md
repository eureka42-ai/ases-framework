# Third-party runtime dependencies

The CLI declares the following direct runtime dependencies. The notices below summarize package metadata and the upstream license files shipped with the dependency packages; those upstream terms control the corresponding dependency code.

| Package | Version | License notice |
|---|---:|---|
| `@modelcontextprotocol/server` | 2.4.0 | Apache-2.0 and MIT contributions as described in the upstream `LICENSE` licensing-transition notice |
| `@modelcontextprotocol/core` | 2.4.0 | Apache-2.0 and MIT contributions as described in the upstream `LICENSE` licensing-transition notice |
| `zod` | 4.6.7 | MIT |

Installers obtain each dependency and its upstream license file through npm. This summary does not replace those license texts. Development-only dependencies are not bundled as runtime code by this CLI package.

## Development build data

`caniuse-lite` provides browser compatibility data used by the private workflow-editor build. Its package declares CC-BY-4.0; the upstream license file is included with the installed development dependency. The data package is not bundled in the CLI runtime tarball. See `docs/security/supply-chain.md` for the local dependency license gate.
