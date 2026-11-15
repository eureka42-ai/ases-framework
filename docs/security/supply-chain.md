# Dependency audit, licenses, SBOM, and provenance

The dedicated CI supply-chain job runs `pnpm audit --prod --audit-level high`, checks installed dependency license metadata against the project's allowed SPDX identifiers, generates an SPDX 2.3 SBOM, packs the CLI, and uploads the package/SBOM artifacts. On non-PR runs it creates separate signed SLSA build-provenance and SPDX SBOM attestations for the package.

Run the local license/SBOM step with:

```bash
corepack pnpm supply-chain
```

The SBOM is written to a temporary directory by default. In CI, `ASES_SBOM_OUTPUT` selects the artifact path. The license gate currently permits `0BSD`, Apache-2.0, BSD-2-Clause, BSD-3-Clause, CC0-1.0, ISC, and MIT. New licenses fail closed until reviewed and added deliberately. The generated SBOM uses metadata from the frozen pnpm installation and lockfile.

Run the vulnerability audit with:

```bash
corepack pnpm audit --prod --audit-level high
```

License metadata checks are a screening step, not a legal opinion or rights approval for Eureka42/ASES source material, trademarks, or methodology. A local audit result does not replace the GitHub-hosted attestation: provenance is only signed and verifiable after the public workflow runs successfully. See [GitHub artifact attestations](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations).
