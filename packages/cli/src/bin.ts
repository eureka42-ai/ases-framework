#!/usr/bin/env node
import { run } from "./index.js";
import { startMcpHttpServer, startMcpServer } from "./mcp-server.js";

const args = process.argv.slice(2);
if (args[0] === "mcp") {
  try {
    const http = args.includes("--http");
    const workspace = args.slice(1).find((arg) => !arg.startsWith("--")) ?? process.cwd();
    await (http ? startMcpHttpServer(workspace) : startMcpServer(workspace));
  } catch {
    process.stderr.write("ASES MCP failed to start; verify the workspace, catalog permissions and (for --http) OAuth configuration.\n");
    process.exitCode = 1;
  }
} else {
  const result = await run(args);
  const stream = result.exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${result.output}\n`);
  process.exitCode = result.exitCode;
}

