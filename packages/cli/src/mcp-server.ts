import { realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { stderr, stdin } from "node:process";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod/v4";
import { readCatalog } from "./catalog.js";

const PRODUCT_ID = /^[a-z0-9][a-z0-9-]*$/;
const REQUIREMENT_ID = /^REQ-\d{3}$/;

function makeServer(workspace: string): McpServer {
  const server = new McpServer({ name: "eureka42-ases", version: "0.0.0-dev" }, { capabilities: { tools: {} } });
  const catalogArgs = z.object({ productId: z.string().regex(PRODUCT_ID).optional() });
  const itemArgs = z.object({ id: z.string().regex(REQUIREMENT_ID), productId: z.string().regex(PRODUCT_ID).optional() });

  server.registerTool("requirements_list", {
    title: "List ASES requirements",
    description: "List requirements from the imported ASES-300 or an isolated product catalog in the configured workspace. Read-only.",
    inputSchema: catalogArgs
  }, async ({ productId }) => {
    try {
      const catalog = await readCatalog(workspace, productId);
      const result = { catalog: catalog.catalog, productId: catalog.productId, status: catalog.status, requirements: catalog.requirements.map(({ id, title, priority, status, decision }) => ({ id, title, priority, status, decision: decision?.status })) };
      return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result };
    } catch {
      return { isError: true, content: [{ type: "text", text: "Catálogo não encontrado ou inválido no workspace configurado." }] };
    }
  });

  server.registerTool("requirements_show", {
    title: "Show an ASES requirement",
    description: "Read one requirement and its recorded status, decisions and evidence from the configured workspace. Read-only.",
    inputSchema: itemArgs
  }, async ({ id, productId }) => {
    try {
      const catalog = await readCatalog(workspace, productId);
      const requirement = catalog.requirements.find((item) => item.id === id);
      if (!requirement) return { isError: true, content: [{ type: "text", text: "Requisito não encontrado no catálogo selecionado." }] };
      const result = { catalog: catalog.catalog, productId: catalog.productId, requirement };
      return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result };
    } catch {
      return { isError: true, content: [{ type: "text", text: "Catálogo não encontrado ou inválido no workspace configurado." }] };
    }
  });

  server.registerTool("requirements_trace", {
    title: "Trace an ASES requirement",
    description: "Read implementation status, decision references, test references, evidence integrity and blockers for one requirement. Read-only.",
    inputSchema: itemArgs
  }, async ({ id, productId }) => {
    try {
      const catalog = await readCatalog(workspace, productId);
      const requirement = catalog.requirements.find((item) => item.id === id);
      if (!requirement) return { isError: true, content: [{ type: "text", text: "Requisito não encontrado no catálogo selecionado." }] };
      const result = { id, status: requirement.status, decision: requirement.decision, traceability: requirement.traceability, evidence: requirement.evidence, blocker: requirement.blocker, waiver: requirement.waiver, history: requirement.history };
      return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result };
    } catch {
      return { isError: true, content: [{ type: "text", text: "Catálogo não encontrado ou inválido no workspace configurado." }] };
    }
  });
  return server;
}

export async function startMcpServer(workspacePath: string): Promise<void> {
  const workspace = await realpath(resolve(workspacePath));
  const handle = serveStdio(() => makeServer(workspace), {
    legacy: "serve",
    onerror: () => { stderr.write("[ases-mcp] Erro de transporte MCP; detalhes omitidos.\n"); }
  });
  if (!stdin.readableEnded) await new Promise<void>((resolveEnd, reject) => {
    stdin.once("end", resolveEnd);
    stdin.once("error", reject);
  });
  await handle.close();
}
