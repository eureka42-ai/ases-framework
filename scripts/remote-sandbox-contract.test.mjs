import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const worker = await readFile(new URL("../integrations/cloudflare-sandbox/src/index.mjs", import.meta.url), "utf8");
const wrangler = await readFile(new URL("../integrations/cloudflare-sandbox/wrangler.jsonc", import.meta.url), "utf8");

test("Cloudflare remote sandbox pins a per-job image, disables egress, caps capacity, and destroys jobs", () => {
  assert.match(worker, /crypto\.randomUUID\(\)/);
  assert.match(worker, /image: container\.images\.base/);
  assert.match(worker, /enableInternet: false/);
  assert.match(worker, /container\.destroy\("one-shot job completed"\)/);
  assert.match(worker, /MAX_EXECUTION_MS = 240_000/);
  assert.match(worker, /MAX_OUTPUT_BYTES = 128 \* 1024/);
  assert.match(worker, /\/usr\/bin\/timeout/);
  assert.match(wrangler, /"max_instances": 10/);
  assert.match(wrangler, /"scheduling_policy": "durable_object"/);
  assert.doesNotMatch(worker, /(?:container\.exec|container\.start)\([\s\S]{0,250}?env\s*:/);
});

test("Cloudflare remote sandbox authenticates the Worker route and never forwards environment variables", () => {
  assert.match(worker, /request\.headers\.get\("authorization"\)/);
  assert.match(worker, /equalToken\(/);
  assert.match(worker, /new Request\("https:\/\/ases-remote-job\.invalid\/execute"/);
  assert.doesNotMatch(worker, /process\.env/);
});
