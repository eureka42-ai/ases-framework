export type SkillLoader = () => Promise<string>;

export class SkillLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillLoadError";
  }
}

/** Resolves exactly one skill loader by ID; registry entries are not invoked eagerly. */
export async function loadSkillOnDemand(skillId: string, loaders: Readonly<Record<string, SkillLoader>>): Promise<string> {
  if (!/^[a-z][a-z0-9-]{1,62}$/.test(skillId)) throw new SkillLoadError("skill ID must be a lowercase slug");
  if (!Object.hasOwn(loaders, skillId)) throw new SkillLoadError(`skill not found: ${skillId}`);
  return loaders[skillId]!();
}
