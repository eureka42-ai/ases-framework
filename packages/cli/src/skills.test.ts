import assert from "node:assert/strict";
import test from "node:test";
import { loadSkillOnDemand, SkillLoadError } from "./skills.js";

test("Skills are loaded only when their ID is requested", async () => {
  const loaded: string[] = [];
  const content = await loadSkillOnDemand("project-start", {
    "project-start": async () => { loaded.push("project-start"); return "project workflow"; },
    "database-review": async () => { loaded.push("database-review"); return "database workflow"; },
  });
  assert.equal(content, "project workflow");
  assert.deepEqual(loaded, ["project-start"]);
});

test("on-demand Skill loading rejects invalid and unknown IDs", async () => {
  await assert.rejects(loadSkillOnDemand("../secrets", {}), SkillLoadError);
  await assert.rejects(loadSkillOnDemand("missing-skill", {}), SkillLoadError);
});
