#!/usr/bin/env node
import { run } from "./index.js";
import { startMcpServer } from "./mcp-server.js";

const args = process.argv.slice(2);
if (args[0] === "mcp") {
  try {
    await startMcpServer(args[1] && !args[1]!.startsWith("--") ? args[1]! : process.cwd());
  } catch {
    process.stderr.write("ASES MCP failed to start; verify the workspace path and catalog permissions.\n");
    process.exitCode = 1;
  }
} else {
  const result = await run(args);
  const stream = result.exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${result.output}\n`);
  process.exitCode = result.exitCode;
}

