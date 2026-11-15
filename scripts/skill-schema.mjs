const allowedKeys = new Set(["name", "description"]);

export function parseSkillFrontmatter(content) {
  if (!content.startsWith("---\n")) throw new Error("Skill frontmatter must start with YAML delimiter");
  const end = content.indexOf("\n---\n", 4);
  if (end < 0) throw new Error("Skill frontmatter closing delimiter is missing");
  const fields = {};
  for (const line of content.slice(4, end).split("\n")) {
    const match = /^([a-z][a-z0-9_-]*):\s*(.*)$/.exec(line);
    if (!match) throw new Error("Skill frontmatter contains a malformed field");
    const [, key, value] = match;
    if (!allowedKeys.has(key)) throw new Error(`Skill frontmatter key is not allowed: ${key}`);
    if (Object.hasOwn(fields, key)) throw new Error(`Skill frontmatter key is duplicated: ${key}`);
    fields[key] = value.trim();
  }
  if (!/^[a-z][a-z0-9-]{1,62}$/.test(fields.name ?? "")) throw new Error("Skill name must be a lowercase slug");
  if (!fields.description || fields.description.length > 1024) throw new Error("Skill description must be between 1 and 1024 characters");
  return fields;
}
