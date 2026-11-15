import { z } from "zod/v4";

export const asesConfigSchema = z.object({
  schemaVersion: z.literal("1", { error: "schemaVersion deve ser '1'" }),
  project: z.object({
    id: z.string({ error: "project.id deve usar letras minúsculas, números e hífens" })
      .regex(/^[a-z0-9][a-z0-9-]*$/, { error: "project.id deve usar letras minúsculas, números e hífens" }),
    name: z.string({ error: "project.name é obrigatório" })
      .min(1, { error: "project.name é obrigatório" })
      .regex(/\S/, { error: "project.name é obrigatório" }),
    locale: z.enum(["pt-BR", "en-US", "es-ES", "it-IT"], { error: "project.locale inválido" }),
    mode: z.enum(["host", "standalone", "headless", "offline"], { error: "project.mode inválido" }),
    privacy: z.literal("local-only", { error: "project.privacy deve ser 'local-only' nesta versão" }),
  }, { error: "project deve ser um objeto" }).strict(),
}, { error: "configuração deve ser um objeto JSON" }).strict();

export type AsesConfig = z.infer<typeof asesConfigSchema>;

export function validateAsesConfig(value: unknown): string[] {
  const parsed = asesConfigSchema.safeParse(value);
  if (parsed.success) return [];
  const errors: string[] = [];
  for (const issue of parsed.error.issues) {
    if (issue.code === "unrecognized_keys") {
      const prefix = issue.path.includes("project") ? "propriedade project" : "propriedade";
      for (const key of issue.keys) errors.push(`${prefix} não permitida: ${key}`);
    } else {
      errors.push(issue.message);
    }
  }
  return errors;
}

export function generateAsesConfigJsonSchema(): Record<string, unknown> {
  const generated = z.toJSONSchema(asesConfigSchema, { target: "draft-2020-12" }) as Record<string, unknown>;
  const { $schema, ...body } = generated;
  return {
    $schema,
    $id: "https://eureka42.org/schemas/ases.config.schema.json",
    title: "EUREKA42 ASES project configuration",
    ...body,
  };
}
