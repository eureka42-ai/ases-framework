# Roadmap

- M0 — IN_PROGRESS: fontes, governança, ADRs, backlog estruturado, build e CI existem; homologação editorial e execução remota do CI ainda precisam de evidência.
- M1 — IN_PROGRESS: CLI offline com `help`, `version`, `init`, desinstalação conservadora, `doctor`, entrevista e configuração; publicação de pacotes aguarda licença/aprovação.
- M2 — IN_PROGRESS: importador e engine ASES-300 implementados. Revisão estrutural e amostra visual concluídas; homologação integral da conversão segue pendente.
- M3 — IN_PROGRESS: entrevista inicial de perfil e stack implementada, com recomendações propostas e revisão de riscos; refinamento restante do backlog continua.
- M4 — IMPLEMENTED_LOCALLY / HOST_VALIDATION_PENDING: MCP read-only, planos e adapters de hosts têm evidência local; sessões reais ainda não comprovam todos os hosts.
- M5 — IN_PROGRESS: plugins/Skills experimentais e manifestos validados; lifecycle local `host apply/update/uninstall` implementado com propriedade por hash e backups; sessão real Claude/hosts e decisões de distribuição permanecem pendentes.
- M6 — IMPLEMENTED: provider probe opt-in, SPI tipada, mock determinístico, catálogo com proveniência, roteamento por capacidade, fallback restrito, classificação de custo, budget concorrente, controle de modelo declarado e bloqueio remoto em `offline` concluídos localmente (AFR-041..050); o probe não foi executado contra serviço real.
- M7 — IMPLEMENTED_LOCALLY: declarações, limites, seleção de contexto, execução serial, prevenção de conflitos de escrita, revisão independente, Skills e tools com policy/path guard; integração real com hosts segue pendente.
- M8 — IN_PROGRESS: DSL valida grafo; checkpoints retomam com hash correspondente; etapas têm timeout/cancelamento/retry, dry-run puro, gate de aprovação independente e chave de idempotência para side effects (AFR-061..065/067/068); falta o fluxo de feature com teste/evidência reais (AFR-066).
- M9–M13 — PLANNED: RAG/memória, evals, segurança, observabilidade e hardening.
- M14 — BLOCKED_ON_APPROVAL: release candidate e gate v1 dependem das decisões de licença, homologação e critérios de lançamento.

Backlog estruturado atual: 63/140 requisitos `IMPLEMENTED`, 77/140 `PENDING`. Esta contagem cobre AFR-001..140; não representa rodadas de trabalho, validação externa ou decisões de aprovação.

Distribuição dos 77 pendentes no registro atual:

| Marco | Pendentes | Observação |
|---|---:|---|
| M1 | 0 | AFR-028 passou no CI remoto Node.js 22/24 |
| M5 | 4 | Claude, Codex, Kimi e Gemini em sessões reais |
| M6 | 0 | M6 concluído localmente; provider live opcional não foi testado |
| M7 | 0 | M7 concluído localmente; integração com hosts reais ainda não foi homologada |
| M8 | 1 | Feature flow real (AFR-066); chaves de idempotência implementadas em AFR-065 |
| M9 | 8 | RAG offline, proveniência, ACL e integridade |
| M10 | 7 | Memória e ContextBundle |
| M11 | 12 | Evidências, segurança, MCP remoto, observabilidade e evals |
| M12 | 5 | SDK, registry e ciclo de vida de plugins |
| M13 | 10 | E2E, CI, release, documentação, TUI, backup e migrações |
| M15+ | 30 | Capacidades avançadas opcionais; não fazem parte do primeiro gate v1 |

O gate M14 não está representado por um requisito AFR separado; a autorização do release continua uma decisão humana conforme AFR-104. Os 77 itens pendentes são a contagem do backlog AFR, não uma previsão exata de rodadas até DONE. Aprovação de licença, homologação de fontes e validação de hosts são gates separados.

