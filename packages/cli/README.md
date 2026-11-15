# EUREKA42 ASES CLI

The `ases` command starts the EUREKA42 ASES project-discovery workflow, validates local configuration, manages host integration files, and serves read-only requirements tools over MCP stdio.

## Status

This package is a release candidate (`0.1.0-rc.1`). It has not been published to npm. Host integrations remain experimental; confirm each host's current support status in the repository's `integrations/README.md` before relying on it.

## Requirements

- Node.js 22 or newer.
- npm 10 or newer, or Corepack with pnpm 10.20.0 for a source checkout.

## Install from a source checkout

```sh
git clone https://github.com/eureka42-ai/ases-framework.git
cd ases-framework
corepack pnpm install --frozen-lockfile
corepack pnpm build
npm install --global ./packages/cli
ases --version
```

## Install from npm after publication

Once the release is published, install the package with:

```sh
npm install --global @eureka42/ases-cli@0.1.0-rc.1
ases --version
```

The command above is future-facing; npm publication has not happened yet.

## First steps

```sh
ases help
ases welcome --color
ases doctor .
ases interview .
```

`ases interview` creates a proposal in `.ases/`. Technology recommendations stay `PROPOSED` until explicitly confirmed. Inspect the generated files before applying project changes.

## Package license and bundled assets

The original software source is licensed under Apache-2.0. The bundled Eureka42 logo assets have separate limited-use terms in `TRADEMARKS.md`; ASES source documents and methodology are not part of this npm package. See `LICENSES.md` and `NOTICE` before redistribution.

## Development and verification

From the repository root:

```sh
corepack pnpm test
npm pack --dry-run ./packages/cli
```
