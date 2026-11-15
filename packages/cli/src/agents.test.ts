import assert from "node:assert/strict";
import test from "node:test";
import { AgentDeclarationError, createAgentDeclaration, selectAgentContext } from "./agents.js";

test("agent declarations require explicit permissions and bounded budgets", () => {
  const declaration = createAgentDeclaration({
    id: "review-agent",
    permissions: ["workspace.read"],
    budget: { maxSteps: 8, maxDurationMs: 30_000, maxTokens: 12_000, maxCostUsd: 0.5 },
    contextPaths: ["README.md"],
  });
  assert.deepEqual(declaration.permissions, ["workspace.read"]);
  assert.throws(() => createAgentDeclaration({ ...declaration, budget: { ...declaration.budget, maxSteps: 0 } }), AgentDeclarationError);
  assert.throws(() => createAgentDeclaration({ ...declaration, contextPaths: ["../../.env"] }), AgentDeclarationError);
  assert.throws(() => createAgentDeclaration({ ...declaration, permissions: ["workspace.read", "workspace.read"] }), AgentDeclarationError);
});

test("agents receive only allowlisted context files", () => {
  const declaration = createAgentDeclaration({
    id: "review-agent",
    permissions: ["workspace.read"],
    budget: { maxSteps: 8, maxDurationMs: 30_000, maxTokens: 12_000, maxCostUsd: 0.5 },
    contextPaths: ["README.md", "src/index.ts"],
  });
  const context = selectAgentContext(declaration, {
    "README.md": "public overview",
    "src/index.ts": "source file",
    ".env": "must never enter context",
  });
  assert.deepEqual(context, { "README.md": "public overview", "src/index.ts": "source file" });
});
