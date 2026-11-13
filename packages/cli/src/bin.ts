#!/usr/bin/env node
import { run } from "./index.js";

const result = await run(process.argv.slice(2));
const stream = result.exitCode === 0 ? process.stdout : process.stderr;
stream.write(`${result.output}\n`);
process.exitCode = result.exitCode;

