import type { InterviewAnswers } from "./recommendations.js";
import type { WorkspaceContext } from "./interview.js";

export interface InterviewFinding {
  code: string;
  kind: "CONTRADICTION" | "RISK";
  severity: "REVIEW_REQUIRED" | "BLOCKS_CONFIRMATION";
  field: "applicationType" | "language" | "database" | "security" | "scale";
  message: string;
  evidence?: string;
}

function normalize(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s*\([^)]*\)\s*/g, "").replace(/[^a-z0-9]/g, "");
  return ({ ts: "typescript", js: "javascript", postgres: "postgresql", postgresql: "postgresql", mongo: "mongodb" } as Record<string, string>)[normalized] ?? normalized;
}

export function assessInterview(answers: InterviewAnswers, context: WorkspaceContext = { files: [] }): InterviewFinding[] {
  const findings: InterviewFinding[] = [];
  const compare = (field: "applicationType" | "language" | "database", answer?: string, detected?: string, source?: string) => {
    if (!answer || !detected || normalize(answer) === normalize(detected)) return;
    findings.push({
      code: `WORKSPACE_${field.toUpperCase()}_MISMATCH`,
      kind: "CONTRADICTION",
      severity: "REVIEW_REQUIRED",
      field,
      message: `A resposta (${answer}) diverge da pista encontrada no workspace (${detected}); confirme se a diferença é intencional.`,
      ...(source ? { evidence: source } : {})
    });
  };
  const evidence = context.files.join(", ") || undefined;
  compare("applicationType", answers.applicationType, context.applicationType, evidence);
  compare("language", answers.language, context.language, evidence);
  compare("database", answers.database, context.database, context.database ? (context.files.includes("package.json") ? "package.json ou prisma/schema.prisma" : "prisma/schema.prisma") : undefined);

  if (answers.sensitiveData) {
    findings.push({ code: "SENSITIVE_DATA_PRIVACY_REVIEW", kind: "RISK", severity: "BLOCKS_CONFIRMATION", field: "security", message: "Confirmação da especificação bloqueada até registrar classificação, minimização, autorização, retenção e revisão de privacidade." });
  }
  if (answers.expectedScale === "large") {
    findings.push({ code: "LARGE_SCALE_VALIDATION", kind: "RISK", severity: "BLOCKS_CONFIRMATION", field: "scale", message: "Confirmação da arquitetura bloqueada até registrar baseline de carga, SLOs e plano de observabilidade." });
  }
  return findings;
}
