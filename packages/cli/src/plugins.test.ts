import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { runPluginContractCases, validatePluginContract, validatePluginManifest, type PluginManifest } from "./plugins.js";
import type { RuntimeTool } from "./tools.js";

const entrypoint = "export const plugin = 'fixture';\n";
function manifest(overrides: Partial<PluginManifest> = {}): PluginManifest {
  return { schemaVersion: "1", id: "fixture-plugin", version: "1.2.0", apiVersion: "1.0.0", entrypoint: "dist/index.js", integrity: `sha256:${createHash("sha256").update(entrypoint).digest("hex")}`, source: "https://registry.eureka42.ai", permissions: ["workspace:read"], ...overrides };
}
const options = { runtimeApiVersion: "1.3.0", trustedSources: ["https://registry.eureka42.ai"], previouslyGrantedPermissions: ["workspace:read"] };

test("plugin manifest validates trusted source, compatible API, integrity and scoped permissions", () => {
  assert.deepEqual(validatePluginManifest(manifest(), { "dist/index.js": entrypoint }, options), []);
  assert.match(validatePluginManifest(manifest({ apiVersion: "2.0.0" }), { "dist/index.js": entrypoint }, options).join(" "), /incompatible/);
  assert.match(validatePluginManifest(manifest({ source: "https://unknown.example" }), { "dist/index.js": entrypoint }, options).join(" "), /not trusted/);
  assert.match(validatePluginManifest(manifest({ integrity: `sha256:${"0".repeat(64)}` }), { "dist/index.js": entrypoint }, options).join(" "), /integrity check failed/);
  assert.match(validatePluginManifest(manifest({ entrypoint: "../outside.js" }), {}, options).join(" "), /safe relative path/);
});

test("plugin permission expansion requires approval and tampered or untrusted plugins fail closed", () => {
  const expanded = manifest({ permissions: ["workspace:read", "workspace:write"] });
  assert.match(validatePluginManifest(expanded, { "dist/index.js": entrypoint }, options).join(" "), /requires approval: workspace:write/);
  assert.deepEqual(validatePluginManifest(expanded, { "dist/index.js": entrypoint }, { ...options, approvedAdditionalPermissions: ["workspace:write"] }), []);
  const missing = validatePluginManifest(manifest(), {}, options);
  assert.ok(missing.some((error) => error.includes("entrypoint file is missing")));
});

test("plugin SDK contract checks tool permissions and executes deterministic contract cases", async () => {
  const tool: RuntimeTool<{ text: string }, { length: number }> = {
    name: "measure_text", sideEffect: false,
    parseInput(value) {
      if (!value || typeof value !== "object" || typeof (value as { text?: unknown }).text !== "string") throw new Error("invalid input");
      return value as { text: string };
    },
    async run(input) { return { length: input.text.length }; },
    validateOutput(value): value is { length: number } { return Boolean(value && typeof value === "object" && typeof (value as { length?: unknown }).length === "number"); },
  };
  const plugin = { manifest: manifest(), tools: [tool] };
  assert.deepEqual(validatePluginContract(plugin), []);
  assert.deepEqual(await runPluginContractCases(plugin, [
    { tool: "measure_text", input: { text: "ASES" }, expectedOutput: { length: 4 } },
    { tool: "missing_tool", input: {} },
  ]), [
    { tool: "measure_text", status: "PASS", detail: "input/output contract satisfied" },
    { tool: "missing_tool", status: "FAIL", detail: "tool is not declared" },
  ]);
  assert.ok(validatePluginContract({ manifest: manifest(), tools: [{ ...tool, name: "write_file", sideEffect: true }] }).some((error) => error.includes("workspace:write")));
});
