export const APPLICATION_TYPES = ["web", "api", "mobile", "desktop", "cli", "library", "agent", "data"] as const;
export type ApplicationType = (typeof APPLICATION_TYPES)[number];

export interface InterviewAnswers {
  name: string;
  applicationType: ApplicationType;
  language?: string;
  hosting?: string;
  database?: string;
  expectedScale: "small" | "medium" | "large";
  sensitiveData: boolean;
}

export interface Recommendation {
  field: "language" | "hosting" | "database" | "security";
  value: string;
  rationale: string;
  status: "PROPOSED" | "REVIEW_REQUIRED";
}

const defaults: Record<ApplicationType, Omit<Recommendation, "field" | "status">[]> = {
  web: [
    { value: "TypeScript", rationale: "Ecossistema amplo para frontend e compartilhamento de contratos." },
    { value: "plataforma de edge/static hosting", rationale: "Boa opção inicial para aplicações web com deploy automatizado." },
    { value: "PostgreSQL", rationale: "Escolha geral quando há dados relacionais, autenticação ou regras de negócio." }
  ],
  api: [
    { value: "TypeScript", rationale: "Contratos tipados e bom suporte a APIs e tooling." },
    { value: "container ou serverless gerenciado", rationale: "Permite escolher operação contínua ou escala sob demanda." },
    { value: "PostgreSQL", rationale: "Transações e integridade para a maioria das APIs de negócio." }
  ],
  mobile: [
    { value: "TypeScript com React Native/Expo", rationale: "Entrega multiplataforma com uma base principal de código." },
    { value: "lojas oficiais + backend gerenciado", rationale: "Separa distribuição do app e serviços remotos." },
    { value: "SQLite local + PostgreSQL remoto", rationale: "Suporta offline local e sincronização com backend." }
  ],
  desktop: [
    { value: "TypeScript", rationale: "Adequado a shells desktop multiplataforma e UI web." },
    { value: "distribuição assinada por sistema operacional", rationale: "Aplicativos desktop precisam de artefatos e atualização por plataforma." },
    { value: "SQLite", rationale: "Persistência local transacional sem serviço obrigatório." }
  ],
  cli: [
    { value: "TypeScript", rationale: "Distribuição pelo ecossistema Node e boa portabilidade." },
    { value: "registry de pacotes + releases assinadas", rationale: "CLI normalmente é distribuído, não hospedado como serviço." },
    { value: "SQLite ou arquivos versionados", rationale: "Persistência local; escolha depende de transações e volume." }
  ],
  library: [
    { value: "linguagem do ecossistema consumidor", rationale: "A biblioteca deve minimizar fricção e FFI para seus usuários." },
    { value: "registry oficial do ecossistema", rationale: "Distribuição compatível com o gerenciador dos consumidores." },
    { value: "nenhum banco por padrão", rationale: "Bibliotecas não devem impor persistência sem necessidade do domínio." }
  ],
  agent: [
    { value: "TypeScript", rationale: "Bom suporte a schemas, MCP, streaming e integrações." },
    { value: "container gerenciado com execução local disponível", rationale: "Mantém portabilidade e permite processamento controlado." },
    { value: "PostgreSQL + índice lexical local", rationale: "Estado relacional e recuperação auditável antes de vetores opcionais." }
  ],
  data: [
    { value: "Python", rationale: "Ecossistema maduro para processamento, ciência de dados e ML." },
    { value: "jobs/container gerenciado", rationale: "Adequado a execução agendada, filas e workloads de dados." },
    { value: "PostgreSQL ou warehouse", rationale: "A escolha final depende de OLTP, analytics, volume e latência." }
  ]
};

export function buildRecommendations(answers: InterviewAnswers): Recommendation[] {
  const template = defaults[answers.applicationType];
  const fields: Array<"language" | "hosting" | "database"> = ["language", "hosting", "database"];
  const recommendations: Recommendation[] = [];
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const proposed = template[index];
    if (!field || !proposed) continue;
    const current = answers[field];
    if (current?.trim()) {
      recommendations.push({ field, value: current.trim(), rationale: `Opção informada pelo usuário; avaliar compatibilidade, operação e custos antes de confirmar. Alternativa de referência: ${proposed.value}.`, status: "REVIEW_REQUIRED" });
    } else {
      recommendations.push({ field, value: proposed.value, rationale: proposed.rationale, status: "PROPOSED" });
    }
  }
  if (answers.sensitiveData) {
    recommendations.push({ field: "security", value: "threat model + privacy review", rationale: "Dados sensíveis exigem classificação, minimização, autorização, retenção e testes negativos.", status: "REVIEW_REQUIRED" });
  }
  if (answers.expectedScale === "large") {
    recommendations.push({ field: "hosting", value: "arquitetura com observabilidade e teste de carga", rationale: "Escala alta precisa de baseline medido antes de decisões de distribuição.", status: "REVIEW_REQUIRED" });
  }
  return recommendations;
}

export function parseApplicationType(value: string): ApplicationType | undefined {
  return APPLICATION_TYPES.find((type) => type === value.trim().toLowerCase());
}

