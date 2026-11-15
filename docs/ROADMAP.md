# Roadmap

- M0 — IN_PROGRESS: fontes, governança, ADRs, backlog estruturado, build e CI existem; homologação editorial e execução remota do CI ainda precisam de evidência.
- M1 — IN_PROGRESS: CLI offline com `help`, `version`, `init`, desinstalação conservadora, `doctor`, entrevista e configuração; publicação de pacotes aguarda licença/aprovação.
- M2 — IN_PROGRESS: importador e engine ASES-300 implementados. Revisão estrutural e amostra visual concluídas; homologação integral da conversão segue pendente.
- M3 — IN_PROGRESS: entrevista inicial de perfil e stack implementada, com recomendações propostas e revisão de riscos; refinamento restante do backlog continua.
- M4 — IMPLEMENTED_LOCALLY / HOST_VALIDATION_PENDING: MCP read-only, planos e adapters de hosts têm evidência local; sessões reais ainda não comprovam todos os hosts.
- M5 — IN_PROGRESS: plugins/Skills experimentais e manifestos validados; lifecycle local `host apply/update/uninstall` implementado com propriedade por hash e backups; sessão real Claude/hosts e decisões de distribuição permanecem pendentes.
- M6 — IMPLEMENTED: provider probe opt-in, SPI tipada, mock determinístico, catálogo com proveniência, roteamento por capacidade, fallback restrito, classificação de custo, budget concorrente, controle de modelo declarado e bloqueio remoto em `offline` concluídos localmente (AFR-041..050); o probe não foi executado contra serviço real.
- M7 — IMPLEMENTED_LOCALLY: declarações, limites, seleção de contexto, execução serial, prevenção de conflitos de escrita, revisão independente, Skills e tools com policy/path guard; integração real com hosts segue pendente.
- M8 — IMPLEMENTED_LOCALLY: DSL valida grafo; checkpoints retomam com hash correspondente; etapas têm timeout/cancelamento/retry, dry-run puro, gate de aprovação independente e chave de idempotência para side effects (AFR-061..068); workflow de feature executa análise, plano, implementação, teste, evidência hashada e falha fechado sem revisão independente.
- M9 — IMPLEMENTED_LOCALLY: indexação local lexical de Markdown/texto, recuperação por ID com citações, hashes/proveniência, retorno vazio sem fonte, embeddings opcionais, filtros de licença/versão/ACL, atualização/remoção de fontes e bloqueio cross-project com permissão explícita (AFR-069..076).
- M10 — IMPLEMENTED_LOCALLY: memória local consentida com escopo/TTL/origem/inspeção/exclusão, ContextBundle seletivo com hash/redaction e import ZIP com preview, conflitos, limites e contenção de caminhos (AFR-077..083).
- M11 — IMPLEMENTED_LOCALLY: evidência verificável, policy engine default-deny, comando/path guard, separação de dados contra prompt injection, logging seguro, observabilidade local, consentimento remoto revogável, métricas/evals versionados e MCP HTTP autenticado (AFR-084..100) implementados e testados localmente.
- M12 — IMPLEMENTED_LOCALLY: template de SDK, contratos, validação de manifesto/compatibilidade/integridade, fonte confiável, aprovação de expansão de permissões e remoção segura por manifesto de propriedade (AFR-091..095).
- M13 — IN_PROGRESS: E2E do CLI (AFR-101), CI (AFR-102), audit/license/SBOM/provenance (AFR-103), docs pt-BR/EN (AFR-105/106), saída/TTY (AFR-107), erros (AFR-108), restore hashado (AFR-109) e limites de migração (AFR-110) implementados; CI Node 22/24 e as duas atestações passaram no run 43728310089; autorização do release segue pendente.
- M14 — BLOCKED_ON_APPROVAL: release candidate e gate v1 dependem das decisões de licença, homologação e critérios de lançamento.

Backlog estruturado atual: 116/140 requisitos `IMPLEMENTED`, 24/140 `PENDING`. Esta contagem cobre AFR-001..140; não representa rodadas de trabalho, validação externa ou decisões de aprovação.

Distribuição dos 24 pendentes no registro atual:

| Marco | Pendentes | Observação |
|---|---:|---|
| M1 | 0 | AFR-028 passou no CI remoto Node.js 22/24 |
| M5 | 4 | Claude, Codex, Kimi e Gemini em sessões reais |
| M6 | 0 | M6 concluído localmente; provider live opcional não foi testado |
| M7 | 0 | M7 concluído localmente; integração com hosts reais ainda não foi homologada |
| M8 | 0 | Workflow de feature testado localmente; chave de idempotência implementada em AFR-065 |
| M9 | 0 | RAG offline implementado localmente; busca vetorial segue opcional |
| M10 | 0 | Memória, ContextBundle e importação segura implementados localmente |
| M11 | 0 | MCP HTTP autenticado testado localmente; falta validação com um Authorization Server real |
| M12 | 0 | SDK e lifecycle de plugins concluídos localmente |
| M13 | 1 | Aprovação do release |
| M15+ | 19 | Capacidades avançadas opcionais; não fazem parte do primeiro gate v1 |

AFR-126 (intercâmbio local de tarefas com trackers) foi implementado e validado em `evidence/M15-2026-11-15-progress-8.md`. O CLI exporta JSON neutro e importa com prévia, persistindo somente mediante `--apply`; sincronização com serviços remotos ainda não está incluída.

AFR-127 entrega ajuda localizada e guias es-ES/it-IT; mensagens operacionais restantes continuam em pt-BR. Ver `evidence/M15-2026-11-15-progress-9.md`.

AFR-128 adiciona templates de Node.js/TypeScript + Fastify, Python + FastAPI e React + Vite/TypeScript, com preview por padrão e escrita explícita em diretório novo. Ver `evidence/M15-2026-11-15-progress-10.md`.

AFR-129 inclui pack original sob Apache-2.0, manifesto com proveniência/citações, validação local e instalação em índice RAG com hash e licença preservados por chunk. O pack não contém cópias de fontes de terceiros. Ver `evidence/M15-2026-11-15-progress-11.md`.

O gate M14 não está representado por um requisito AFR separado; a autorização do release continua uma decisão humana conforme AFR-104. Os 24 itens pendentes são a contagem do backlog AFR, não uma previsão exata de rodadas até DONE. Aprovação de licença, homologação de fontes, validação de hosts e autenticação OAuth em provedor real são gates separados.

