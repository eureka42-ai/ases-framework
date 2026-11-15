import assert from "node:assert/strict";
import test from "node:test";
import { createCommunityAgentCatalog, type CommunityAgentRelease } from "./community-agents.js";

const releases: CommunityAgentRelease[] = [
  { id: "docs-helper", version: "1.2.0", name: "Docs Helper", description: "Search project documentation", publisher: "Eureka42 Community", source: "https://registry.eureka42.ai/community", apiVersion: "1.1.0", categories: ["documentation"], capabilities: ["docs.search", "text.summary"], permissions: ["workspace.read"] },
  { id: "docs-helper", version: "2.0.0-beta.1", name: "Docs Helper Next", description: "Preview documentation helper", publisher: "Community Labs", source: "https://unknown.example/agents", apiVersion: "2.0.0", categories: ["documentation", "preview"], capabilities: ["docs.search"], permissions: ["workspace.read", "network"] },
  { id: "test-writer", version: "1.0.0", name: "Test Writer", description: "Draft local test cases", publisher: "Eureka42 Community", source: "https://registry.eureka42.ai/community", apiVersion: "1.0.0", categories: ["testing"], capabilities: ["tests.draft"], permissions: ["workspace.read"] },
];

test("community agent catalog discovers releases by metadata and runtime compatibility", () => {
  const catalog = createCommunityAgentCatalog(releases, { runtimeApiVersion: "1.3.0", trustedSources: ["https://registry.eureka42.ai/community"] });
  assert.deepEqual(catalog.list({ category: "documentation", capability: "docs.search", compatibleOnly: true }).map(({ version }) => version), ["1.2.0"]);
  assert.equal(catalog.list({ text: "preview" })[0]?.trust, "UNTRUSTED_SOURCE");
  assert.equal(catalog.versions("docs-helper")[0]?.version, "2.0.0-beta.1");
  assert.equal(catalog.latest("docs-helper")?.version, "1.2.0");
  assert.equal(catalog.latest("missing"), undefined);
  const result = catalog.list()[0]!;
  (result.capabilities as string[]).push("command.execute");
  assert.equal(catalog.list()[0]?.capabilities.includes("command.execute"), false);
});

test("community agent catalog rejects duplicate releases and malformed metadata", () => {
  assert.throws(() => createCommunityAgentCatalog([releases[0]!, releases[0]!], { runtimeApiVersion: "1.0.0", trustedSources: [] }), /duplicate/);
  assert.throws(() => createCommunityAgentCatalog([{ ...releases[0]!, version: "latest" }], { runtimeApiVersion: "1.0.0", trustedSources: [] }), /semantic version/);
  assert.throws(() => createCommunityAgentCatalog([{ ...releases[0]!, version: "1.2.3-01" }], { runtimeApiVersion: "1.0.0", trustedSources: [] }), /semantic version/);
  assert.throws(() => createCommunityAgentCatalog([{ ...releases[0]!, permissions: ["command.execute" as "workspace.read", "command.execute" as "workspace.read"] },], { runtimeApiVersion: "1.0.0", trustedSources: [] }), /unique/);
});
