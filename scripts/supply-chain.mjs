import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";

const packageJson = JSON.parse(await readFile(new URL("../packages/cli/package.json", import.meta.url), "utf8"));
const raw = execFileSync("pnpm", ["licenses", "list", "--json"], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
const grouped = JSON.parse(raw);
const allowedLicenses = new Set(["0BSD", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "CC-BY-4.0", "CC0-1.0", "ISC", "MIT"]);
const componentMap = new Map();
const problems = [];
for (const [groupLicense, packages] of Object.entries(grouped)) {
  if (!Array.isArray(packages)) { problems.push(`license group is malformed: ${groupLicense}`); continue; }
  for (const item of packages) {
    if (typeof item.name !== "string" || typeof item.license !== "string" || !Array.isArray(item.versions)) {
      problems.push(`dependency has missing package/license metadata in group ${groupLicense}`);
      continue;
    }
    const parts = item.license.split(/\s+(?:AND|OR)\s+|\s+WITH\s+/).map((value) => value.replace(/[()]/g, "").trim()).filter(Boolean);
    if (!parts.length || parts.some((license) => !allowedLicenses.has(license))) problems.push(`${item.name} declares an unapproved or unrecognized license: ${item.license}`);
    for (const version of item.versions) {
      const key = `${item.name}@${version}`;
      const previous = componentMap.get(key);
      if (previous && previous.license !== item.license) problems.push(`${key} has conflicting license declarations`);
      componentMap.set(key, { name: item.name, version, license: item.license });
    }
  }
}
if (problems.length) {
  process.stderr.write(`Supply-chain license check failed:\n${problems.map((item) => `- ${item}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  const timestamp = new Date().toISOString();
  const components = [
    { name: packageJson.name, version: packageJson.version, license: packageJson.license },
    ...[...componentMap.values()].sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`)),
  ];
  const packages = components.map((item, index) => {
    const id = `SPDXRef-Package-${createHash("sha256").update(`${item.name}@${item.version}`).digest("hex").slice(0, 16)}`;
    const purlName = item.name.startsWith("@") ? `%40${item.name.slice(1)}` : item.name;
    return {
      SPDXID: id,
      name: item.name,
      versionInfo: item.version,
      downloadLocation: index === 0 ? "NOASSERTION" : `https://registry.npmjs.org/${item.name}/-/${item.name.split("/").at(-1)}-${item.version}.tgz`,
      filesAnalyzed: false,
      licenseConcluded: "NOASSERTION",
      licenseDeclared: item.license,
      copyrightText: "NOASSERTION",
      externalRefs: [{ referenceCategory: "PACKAGE-MANAGER", referenceType: "purl", referenceLocator: `pkg:npm/${purlName}@${item.version}` }],
    };
  });
  const lockHash = createHash("sha256").update(await readFile(new URL("../pnpm-lock.yaml", import.meta.url))).digest("hex");
  const documentNamespace = `https://eureka42.ai/spdx/ases-framework/${lockHash}`;
  const sbom = {
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name: `${packageJson.name}-${packageJson.version}`,
    documentNamespace,
    creationInfo: { created: timestamp, creators: ["Tool: eureka42-ases-supply-chain/1.0.0"], comment: `pnpm-lock.yaml sha256 ${lockHash}` },
    packages,
    relationships: packages.map((item) => ({ spdxElementId: "SPDXRef-DOCUMENT", relationshipType: "DESCRIBES", relatedSpdxElement: item.SPDXID })),
  };
  const output = process.env.ASES_SBOM_OUTPUT ? resolve(process.env.ASES_SBOM_OUTPUT) : resolve(tmpdir(), `eureka42-ases-sbom-${lockHash.slice(0, 12)}.spdx.json`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(sbom, null, 2)}\n`, { mode: 0o600 });
  process.stdout.write(`PASS license metadata (${componentMap.size} dependency packages)\nSBOM: ${output}\n`);
}
