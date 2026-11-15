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
- M11 — IN_PROGRESS: evidência verificável, policy engine default-deny, comando/path guard, separação de dados contra prompt injection, logging seguro, observabilidade local, consentimento remoto revogável, métricas e evals versionados (AFR-084..087/089/090/096..100) concluídos; MCP remoto autenticado (AFR-088) segue pendente.
- M12 — IMPLEMENTED_LOCALLY: template de SDK, contratos, validação de manifesto/compatibilidade/integridade, fonte confiável, aprovação de expansão de permissões e remoção segura por manifesto de propriedade (AFR-091..095).
- M13 — IN_PROGRESS: E2E do CLI (AFR-101), CI (AFR-102), docs pt-BR/EN (AFR-105/106), saída/TTY (AFR-107), erros (AFR-108), restore hashado (AFR-109) e limites/política de migração (AFR-110) documentados; release segue.
- M14 — BLOCKED_ON_APPROVAL: release candidate e gate v1 dependem das decisões de licença, homologação e critérios de lançamento.

Backlog estruturado atual: 103/140 requisitos `IMPLEMENTED`, 37/140 `PENDING`. Esta contagem cobre AFR-001..140; não representa rodadas de trabalho, validação externa ou decisões de aprovação.

Distribuição dos 37 pendentes no registro atual:

| Marco | Pendentes | Observação |
|---|---:|---|
| M1 | 0 | AFR-028 passou no CI remoto Node.js 22/24 |
| M5 | 4 | Claude, Codex, Kimi e Gemini em sessões reais |
| M6 | 0 | M6 concluído localmente; provider live opcional não foi testado |
| M7 | 0 | M7 concluído localmente; integração com hosts reais ainda não foi homologada |
| M8 | 0 | Workflow de feature testado localmente; chave de idempotência implementada em AFR-065 |
| M9 | 0 | RAG offline implementado localmente; busca vetorial segue opcional |
| M10 | 0 | Memória, ContextBundle e importação segura implementados localmente |
| M11 | 1 | MCP remoto autenticado |
| M12 | 0 | SDK e lifecycle de plugins concluídos localmente |
| M13 | 2 | Release e segurança/licenças/proveniência do build |
| M15+ | 30 | Capacidades avançadas opcionais; não fazem parte do primeiro gate v1 |

O gate M14 não está representado por um requisito AFR separado; a autorização do release continua uma decisão humana conforme AFR-104. Os 37 itens pendentes são a contagem do backlog AFR, não uma previsão exata de rodadas até DONE. Aprovação de licença, homologação de fontes e validação de hosts são gates separados.

