# Roadmap

- M0 — IN_PROGRESS: fontes, governança, ADRs, backlog estruturado, build e CI existem; homologação editorial e execução remota do CI ainda precisam de evidência.
- M1 — IN_PROGRESS: CLI offline com `help`, `version`, `init`, desinstalação conservadora, `doctor`, entrevista e configuração; publicação de pacotes aguarda licença/aprovação.
- M2 — IN_PROGRESS: importador e engine ASES-300 implementados. Revisão estrutural e amostra visual concluídas; homologação integral da conversão segue pendente.
- M3 — IN_PROGRESS: entrevista inicial de perfil e stack implementada, com recomendações propostas e revisão de riscos; refinamento restante do backlog continua.
- M4 — IMPLEMENTED_LOCALLY / HOST_VALIDATION_PENDING: MCP read-only, planos e adapters de hosts têm evidência local; sessões reais ainda não comprovam todos os hosts.
- M5 — IN_PROGRESS: plugins/Skills e ciclo local `host apply/update/uninstall` implementados; Codex 0.169.0 validado em sessão real efêmera com Skill e logo verde; Claude/Kimi/Gemini ainda aguardam sessões reais e decisões de distribuição.
- M6 — IMPLEMENTED: provider probe opt-in, SPI tipada, mock determinístico, catálogo com proveniência, roteamento por capacidade, fallback restrito, classificação de custo, budget concorrente, controle de modelo declarado e bloqueio remoto em `offline` concluídos localmente (AFR-041..050); o probe não foi executado contra serviço real.
- M7 — IMPLEMENTED_LOCALLY: declarações, limites, seleção de contexto, execução serial, prevenção de conflitos de escrita, revisão independente, Skills e tools com policy/path guard; integração real com hosts segue pendente.
- M8 — IMPLEMENTED_LOCALLY: DSL valida grafo; checkpoints retomam com hash correspondente; etapas têm timeout/cancelamento/retry, dry-run puro, gate de aprovação independente e chave de idempotência para side effects (AFR-061..068); workflow de feature executa análise, plano, implementação, teste, evidência hashada e falha fechado sem revisão independente.
- M9 — IMPLEMENTED_LOCALLY: indexação local lexical de Markdown/texto, recuperação por ID com citações, hashes/proveniência, retorno vazio sem fonte, embeddings opcionais, filtros de licença/versão/ACL, atualização/remoção de fontes e bloqueio cross-project com permissão explícita (AFR-069..076).
- M10 — IMPLEMENTED_LOCALLY: memória local consentida com escopo/TTL/origem/inspeção/exclusão, ContextBundle seletivo com hash/redaction e import ZIP com preview, conflitos, limites e contenção de caminhos (AFR-077..083).
- M11 — IMPLEMENTED_LOCALLY: evidência verificável, policy engine default-deny, comando/path guard, separação de dados contra prompt injection, logging seguro, observabilidade local, consentimento remoto revogável, métricas/evals versionados e MCP HTTP autenticado (AFR-084..100) implementados e testados localmente.
- M12 — IMPLEMENTED_LOCALLY: template de SDK, contratos, validação de manifesto/compatibilidade/integridade, fonte confiável, aprovação de expansão de permissões e remoção segura por manifesto de propriedade (AFR-091..095).
- M13 — IN_PROGRESS: E2E do CLI (AFR-101), CI (AFR-102), audit/license/SBOM/provenance (AFR-103), docs pt-BR/EN (AFR-105/106), saída/TTY (AFR-107), erros (AFR-108), restore hashado (AFR-109) e limites de migração (AFR-110) implementados; CI Node 22/24 e as duas atestações passaram no run 43728310089; autorização do release segue pendente.
- M14 — BLOCKED_ON_APPROVAL: release candidate e gate v1 dependem das decisões de licença, homologação e critérios de lançamento.

Backlog estruturado atual: 134/140 requisitos `IMPLEMENTED`, 6/140 `PENDING`. Esta contagem cobre AFR-001..140; não representa rodadas de trabalho, validação externa ou decisões de aprovação.

Distribuição dos 6 pendentes no registro atual:

| Marco | Pendentes | Observação |
|---|---:|---|
| M1 | 0 | AFR-028 passou no CI remoto Node.js 22/24 |
| M5 | 3 | Claude, Kimi e Gemini aguardam sessões reais; Codex passou smoke efêmero |
| M6 | 0 | M6 concluído localmente; provider live opcional não foi testado |
| M7 | 0 | M7 concluído localmente; integração com hosts reais ainda não foi homologada |
| M8 | 0 | Workflow de feature testado localmente; chave de idempotência implementada em AFR-065 |
| M9 | 0 | RAG offline implementado localmente; busca vetorial segue opcional |
| M10 | 0 | Memória, ContextBundle e importação segura implementados localmente |
| M11 | 0 | MCP HTTP autenticado testado localmente; falta validação com um Authorization Server real |
| M12 | 0 | SDK e lifecycle de plugins concluídos localmente |
| M13 | 1 | Aprovação do release |
| M15+ | 2 | Capacidades avançadas opcionais; não fazem parte do primeiro gate v1 |

AFR-126 (intercâmbio local de tarefas com trackers) exporta JSON neutro e importa com prévia, persistindo somente mediante `--apply`; veja `evidence/M15-2026-11-15-progress-8.md`. AFR-117 acrescenta importadores opt-in somente de leitura para GitHub Issues/PRs e GitLab Issues/MRs; não fazem sincronização ou escrita remota. Veja `docs/trackers.md` e `evidence/M15-2026-11-15-progress-24.md`.

AFR-118 registra o escopo e os achados da revisão interna dos marketplaces e fixa os hashes dos manifests, Skills e entrypoints publicados; `pnpm integrations:validate` falha se houver mudança não revisada. O registro explicita os limites da revisão interna. Veja `docs/security/marketplace-review.md`.

AFR-121 adiciona `ases code impact`: análise AST offline de imports JS/TS e seleção de testes candidatos com limites de leitura, contenção no workspace e sem execução de fontes. Veja `docs/code-impact.md`.

AFR-111 acrescenta stores vetoriais local, pgvector, Qdrant e Cloudflare Vectorize com filtros de projeto/ACL/proveniência; embeddings são fornecidos pelo chamador e chamadas de rede não são iniciadas implicitamente. Veja `docs/rag/vector-stores.md`.

AFR-120 fecha a matriz de adapters para Cloudflare Vectorize/R2 e PostgreSQL/pgvector, documentando o uso com PostgreSQL gerenciado pelo Supabase via função `query` injetada. Credenciais, conexão, RLS e migrations seguem sob configuração da aplicação. Veja `docs/rag/vector-stores.md` e `docs/backup-sync.md`.

AFR-124 combina testes candidatos derivados do grafo de imports AST com mutantes de operador/literais limitados e uma baseline. Execução é delegada a um runner isolado injetado, sem shell ou escrita implícita no workspace. Veja `docs/mutation-testing.md`.

AFR-119 acrescenta backup AES-GCM com chave derivada localmente, adapter R2 e operações explícitas de upload/download/delete; apenas ciphertext sai do processo e nenhum sync em background é iniciado. Veja `docs/backup-sync.md`.

AFR-127 entrega ajuda localizada e guias es-ES/it-IT; mensagens operacionais restantes continuam em pt-BR. Ver `evidence/M15-2026-11-15-progress-9.md`.

AFR-128 adiciona templates de Node.js/TypeScript + Fastify, Python + FastAPI e React + Vite/TypeScript, com preview por padrão e escrita explícita em diretório novo. Ver `evidence/M15-2026-11-15-progress-10.md`.

AFR-129 inclui pack original sob Apache-2.0, manifesto com proveniência/citações, validação local e instalação em índice RAG com hash e licença preservados por chunk. O pack não contém cópias de fontes de terceiros. Ver `evidence/M15-2026-11-15-progress-11.md`.

AFR-130 exporta spans no formato OTLP JSON, com sanitização e consentimento revogável rechecado antes do envio explícito. Ver `docs/security/observability.md` e `evidence/M15-2026-11-15-progress-12.md`.

AFR-131 adiciona mensageria A2A local em memória com identidade de agente por handle, ACL exata default-deny, escopo único de projeto e payload não executável. Ver `docs/security/agent-messaging.md` e `evidence/M15-2026-11-15-progress-13.md`.

AFR-132 registra memberships por repo e organização, papéis e contenção de caminho local; não inclui SSO central nem execução remota. Ver `docs/security/multi-repo.md` e `evidence/M15-2026-11-15-progress-14.md`.

AFR-140 soma custos explicitamente reportados pelos adapters e gera comparação Pareto de qualidade/latência; custo só entra no ranking com observações completas, sem estimativas próprias. Ver `docs/benchmarking.md` e `evidence/M15-2026-11-15-progress-15.md`.

AFR-138 fornece extensão local para VS Code: abre o terminal integrado no workspace e invoca o logo verde antes da entrevista CLI. Validada estruturalmente; ainda não publicada nem testada em instalação real do VS Code. Ver `integrations/vscode/README.md` e `evidence/M15-2026-11-15-progress-16.md`.

AFR-135 adiciona catálogo local versionado para releases comunitárias de agentes, com filtros, SemVer, compatibilidade de API e indicação de origem confiável. Não baixa, instala ou executa agentes. Ver `docs/security/community-agents.md`.

AFR-139 implementa ledger em memória para metas de SLA P1–P4 e ciclo de vida de incidentes com cálculo de violações. Persistência, alertas e autenticação de operadores ficam a cargo do host empresarial. Ver `docs/security/support-ledger.md`.

AFR-136 entrega editor visual local React/Vite para o grafo de workflows, com painel de propriedades, reordenação, validação topológica sem execução, salvamento no navegador e intercâmbio JSON versionado. Permissões e timeout são declarados no workflow e precisam ser aplicados pelo host executor. Ver `packages/workflow-editor/README.md` e `evidence/M15-2026-11-15-progress-20.md`.

AFR-114 acrescenta `reviewFrontendQuality` e um agente sem permissões para avaliar evidências fornecidas de LCP/INP/CLS e violações axe. Dados de laboratório não são tratados como experiência de campo, métricas ausentes não resultam em aprovação e revisão manual incompleta impede status `clear`. A ferramenta não acessa URL nem executa scans. Ver `docs/agents/frontend-quality.md` e `evidence/M15-2026-11-15-progress-23.md`.

AFR-133 adiciona console web local multiusuário, autenticação scrypt, sessões revogáveis e memberships RBAC exatos por repo, fixo em loopback. Não inclui SSO, armazenamento de sessão persistente nem hospedagem pública. Ver `docs/security/multi-user-console.md`.

O gate M14 não está representado por um requisito AFR separado; a autorização do release continua uma decisão humana conforme AFR-104. Os 13 itens pendentes são a contagem do backlog AFR, não uma previsão exata de rodadas até DONE. Aprovação de licença, homologação de fontes, validação de hosts e autenticação OAuth em provedor real são gates separados.

