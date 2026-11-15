import assert from "node:assert/strict";
import test from "node:test";
import { parseSkillFrontmatter } from "./skill-schema.mjs";

test("Skill frontmatter accepts the documented name and description schema", () => {
  assert.deepEqual(parseSkillFrontmatter("---\nname: ases-project-start\ndescription: Start a project safely.\n---\n\n# Skill\n"), {
    name: "ases-project-start",
    description: "Start a project safely.",
  });
});

test("Skill frontmatter rejects missing, malformed, duplicate and unknown fields", () => {
  assert.throws(() => parseSkillFrontmatter("# no frontmatter"), /frontmatter/);
  assert.throws(() => parseSkillFrontmatter("---\nname: Bad_Name\ndescription: bad\n---\n"), /lowercase slug/);
  assert.throws(() => parseSkillFrontmatter("---\nname: first-name\nname: second-name\ndescription: bad\n---\n"), /duplicated/);
  assert.throws(() => parseSkillFrontmatter("---\nname: skill-name\nextra: bad\ndescription: bad\n---\n"), /not allowed/);
});
