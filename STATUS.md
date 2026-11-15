# STATUS

Atualizado em: 2026-11-15

## Estado

- M0: IMPLEMENTED / PARTIALLY_VERIFIED
- M1 vertical slice: IMPLEMENTED / VERIFIED_LOCALLY
- M5: IN_PROGRESS (6/10 AFRs formalmente implementados; smoke de startup Codex passou, mas auto-descoberta da Skill não foi confirmada; lifecycle local possui apply/update/uninstall explícitos)
- M8: IMPLEMENTED_LOCALLY (AFR-061..068; workflow de feature testado com evidência hashada e aprovação independente)
- M9: IMPLEMENTED_LOCALLY (RAG lexical offline com citações, proveniência, filtros de licença/versão/ACL, refresh/invalidação e permissão cross-project explícita)
- M10: IMPLEMENTED_LOCALLY (memória local com consentimento/escopo/TTL/origem/inspect/delete, ContextBundle com integridade/redaction e import ZIP seguro com preview e contenção de caminhos)
- M11: IMPLEMENTED_LOCALLY (AFR-084..100; MCP HTTP OAuth Resource Server e testes de rota local; Authorization Server real ainda não exercitado)
- M12: IMPLEMENTED_LOCALLY (SDK, contrato, integridade, compatibilidade, aprovação de permissões e remoção segura AFR-091..095)
- M13: IN_PROGRESS (CI Node 22/24 e supply-chain passaram no run 43729149666; SLSA e SPDX verificadas diretamente no pacote do run 43728310089; resta autorização da release AFR-104)
- M6: IMPLEMENTED (AFR-041..050 concluídos localmente; probe real é opt-in e ainda não executado contra serviço externo)
- Repositório Git: branch `main`; plugins Codex/Claude disponíveis no repositório público; AFR-030 implementado nesta rodada
- Fonte diretora: presente e lida
- ASES-300: DOCX e conversão Markdown presentes localmente; revisão estrutural confirmou 300 IDs/títulos e hashes íntegros; as 303 páginas foram renderizadas, com inspeção visual amostral registrada em 14 páginas. Homologação editorial segue pendente: há placeholder de sumário, ajuste no pseudocódigo da p. 33 e revisão bibliográfica/editorial solicitada no encerramento do documento.
- ASES-500 separado: consolidação presente como reconstrução para validação; original independente ausente e homologação pendente.
- Repositório GitHub público; código licenciado em Apache-2.0 com escopo delimitado; release pública ainda depende de validação de titularidade da marca, assets e fontes metodológicas.

## Implementação atual

- Monorepo TypeScript strict criado.
- CLI vertical slice implementado: `help`, `--version`, `init`, `doctor`, `config validate`.
- `config explain` implementado; `doctor` ampliado para Git, npm e pnpm.
- `config explain` resolve defaults, arquivo, variáveis ASES allowlistadas e `--set` com precedência explícita; segredos fora da allowlist não são lidos nem impressos.
- Schema inicial publicado localmente em `schemas/ases.config.schema.json`.
- README completo e assets oficiais da marca organizados em `docs/assets/brand/`.
- Identidade Eureka42 verde disponível em `ases welcome`; `ases welcome --color` força a abertura visual para plugins mesmo com stdout capturado e `--no-color` tem precedência explícita.
- Codex, Claude Code, Kimi e Gemini invocam `ases welcome --color` como primeira ação de terminal; validação estrutural confere os seis Skills compartilhados e os entrypoints. Isso ainda não prova renderização em sessão real de cada host.
- Entrevista inicial implementada com tipo de aplicativo, linguagem, hospedagem, banco, escala e dados sensíveis; AFR-016..020 rastreados a código e testes.
- O fluxo interativo apresenta a marca antes das perguntas; a saída `--json` exige arquivo `--answers` para preservar JSON válido.
- Antes das perguntas, a entrevista consulta somente manifestos conhecidos, exibe arquivos e pistas de stack, deixa inferências editáveis e não lê `.env`/credenciais; destino Docker continua sem confirmação automática.
- Recomendações ausentes ficam `PROPOSED`; escolhas existentes ficam `REVIEW_REQUIRED`.
- AFR-018 avalia divergência entre respostas e manifestos, e registra riscos bloqueantes de dados sensíveis/escala alta no JSON e SPEC sem confirmar automaticamente.
- Integrações experimentais criadas para Codex, Claude Code, Kimi Code CLI e Gemini CLI.
- AFR-030 implementado: `ases init` grava manifesto local com hashes; `ases uninstall` é read-only por padrão e só remove arquivos ASES inalterados com `--apply`, preservando edições, symlinks e dados do projeto.
- Plugin portátil nativo do Codex implementado em `integrations/codex/`: manifesto Agent Plugins, onboarding Skill compartilhada, ícones Eureka42 e marketplace de repositório em `.agents/plugins/marketplace.json`.
- Instalação e inventário do plugin Codex passaram em `CODEX_HOME` isolado; depois, o startup verde foi executado em sessão autenticada read-only. O teste não comprova auto-descoberta da Skill ou configuração MCP no host.
- `ases host plan` mostra diffs; `ases host apply` e `ases host uninstall` são somente leitura por padrão e só alteram o workspace com `--apply`. Manifestos por host guardam hashes, arquivos modificados são preservados e falhas parciais tentam rollback de arquivos/diretórios recém-criados. Testes exercitam os quatro adapters em workspaces temporários.
- `ases mcp <workspace>` serve três ferramentas de consulta read-only sobre o workspace fixado via SDK MCP oficial; suporta protocolo moderno e handshake legado, com stdout reservado a JSON-RPC.
- `ases mcp <workspace> --http` opta por Streamable HTTP via SDK MCP oficial como OAuth Resource Server: introspecção RFC 7662, checagem de active/exp/audience/scopes, metadados RFC 9728/8414 e fail-closed. Listener padrão é loopback; bind remoto exige URL HTTPS atrás de proxy TLS confiável. Testes locais cobrem metadata, 401, 403 e discovery autenticado; Authorization Server real ainda não foi conectado.
- `ases requirements graph [workspace] [--product id] [--json]` exporta Mermaid determinístico para requisitos, decisões, testes, evidências e bloqueios; labels são escapadas, IDs são hashados e não há dependência gráfica no CLI. Ver `evidence/M15-2026-11-15-progress-1.md`.
- Leitura de catálogo agora rejeita arquivo catalog symlinkado ou cujo caminho canonicalizado saia do workspace.
- Hosts locais detectados nesta sessão: Codex 0.169.0, Claude Code 2.1.323, Kimi 2.5.3 e Gemini 0.42.0.
- `init` possui `--dry-run`, saída JSON e proteção contra sobrescrita.
- Gerenciador de pacotes fixado em pnpm 10.20.0; `pnpm-lock.yaml` importado e instalação `--frozen-lockfile` validada.
- Build TypeScript strict: PASS.
- Testes unitários: PASS (122/122 localmente e no CI `43729149666`); `pnpm test` também compila TypeScript e valida as integrações.
- Manifests/Skills/marketplaces locais: PASS (4 manifests, 2 marketplaces, 6 Skills sincronizadas).
- Claude plugin validator: `claude plugin validate --strict` PASS; publicação oficial ainda aguarda confirmação de direitos sobre assets de marca.
- Gemini extension validator: PASS.
- `npm pack` inclui módulos runtime e os quatro adapters; tarball RC1 instalado em workspace temporário; `ases --version` e `ases welcome --color`: PASS. A primeira instalação revelou módulos ausentes e foi corrigida antes do segundo empacotamento.
- Backlog AFR-001..140: 106 requisitos IMPLEMENTED e ligados a código/testes/evidência; 34 seguem PENDING. A quantidade de rodadas não pode ser inferida da contagem porque critérios, dependências e aprovações variam.
- Fontes recebidas em `FONTES_ASES_PARA_DESKTOP_FRAMEWORK/`; SHA-256 dos seis arquivos listados validado.
- Matriz Eureka42 segregada; REQ-301..500 mantidos como referência específica de domínio.
- Importador de produto validado com a matriz Eureka42 local: 200 itens REQ-301..500, SHA-256 `12ce223cc7a3fbe54051d027ec4785fe79bd4b1febf5f91d01051cf0b66a1dd1`; arquivo permanece em workspace temporário.
- Importador ASES-300 implementado; grava catálogo por workspace com hash e textos dos requisitos.
- `ases requirements list/show` implementados para catálogo importado.
- Importação real da fonte local: PASS; 300 itens, SHA-256 `22e439ea514e1f365d3611a8644aac861f8c739054f8c35084a0e94e30302314`.
- Ciclo de estados ASES-300 implementado; `VERIFIED` exige arquivo local dentro do workspace, calcula SHA-256, e `N_A` exige justificativa; histórico de transições mantido.
- Validação de evidências resolve caminhos reais e rejeita links simbólicos para fora do workspace; apenas arquivos regulares podem comprovar `VERIFIED`.
- `requirements show/list` recalculam integridade de evidências (`CURRENT`, `STALE`, `MISSING`, `OUTSIDE_WORKSPACE`, `UNVERIFIABLE`); README documenta limites da checagem semântica.
- Regressões cobrem MCP stdio moderno/legado, isolamento de workspace, rejeição de symlinks e segredo em logs, plano host/diff e prevenção de symlink escape, análise de contradições e riscos, persistência de achados na SPEC, inspeção segura de manifestos e retomada de decisões na entrevista, separação de catálogos, ciclo de decisões, rastreabilidade, bloqueios justificados, integridade, piso Node.js, identidade da entrevista, configuração segura e desinstalação conservadora.
- Parser ASES-300: classificação e prioridade agora são extraídas separadamente quando aparecem na mesma linha; regressão automatizada PASS.
- Validadores de integração: PASS (4 manifests, 2 marketplaces, 6 Skills).
- Validação host nesta rodada: Claude schema PASS, mas sessão impedida por falta de login; Gemini extension PASS, mas sem provider autenticado; Kimi validação estrutural PASS e sessão falhou com `EMFILE`; smoke de startup Codex passou em sessão real read-only, embora auto-descoberta da Skill/MCP ainda esteja pendente.
- Validação continuada anterior: `git diff --check` PASS; `kimi doctor` PASS para configuração local (não é validação do plugin).
- CI GitHub Actions observado em execução remota: PASS nos jobs Node.js 22 e 24, instalação congelada e `pnpm test`; AFR-028 atualizado para IMPLEMENTED. Ver `evidence/CI-2026-11-14.md`.
- AFR-027 coberto por preservação idempotente no `init`, recusa de sobrescrita da entrevista sem `--resume` explícito e plano de instalação host somente leitura.
- Matriz local de versões e contratos de integração dos quatro hosts registrada; hosts sem prova de carga/execução da Skill continuam `NOT_TESTED`, como cobre o teste de `host list`.
- Claude Code: plugin validado com `claude plugin validate --strict`, marketplace do repositório validado, instalação isolada e inventário confirmaram duas Skills carregadas. Smoke em conversa segue pendente porque não há login; distribuição oficial depende da revisão dos direitos dos assets.
- Guia Claude agora recomenda `--scope local`, explicita o padrão potencialmente global de `user` e usa `--keep-data` na desinstalação para preservar dados persistentes do plugin.
- Instalação/listagem/desinstalação Claude repetidas em `CLAUDE_CONFIG_DIR` isolado com escopo `local`; marketplace removido no fim do ciclo. Ver `evidence/M5-2026-11-14-progress-5.md`.
- Configuração MCP de projeto Claude gerada e conferida em workspace temporário; `claude mcp list` marcou `Pending approval`, sem inicializar o servidor.
- Kimi: `host plan` agora prepara a Skill em `.agents/skills/`, que é auto-descoberta pelo projeto; `kimi --skills-dir <path> --help` reconheceu a opção. O plugin Beta não foi instalado e a sessão segue `NOT_TESTED`.
- Codex CLI 0.169.0: plugin RC1 habilitado temporariamente em sessão autenticada; `codex exec` read-only executou `ases welcome --color` como primeira ação e confirmou ANSI verde. Plugin e marketplace temporários foram removidos depois. Auto-descoberta da Skill e MCP do host ainda não foram comprovados.
- SPI de providers implementada com erros tipados, timeout, cancelamento e provider mock determinístico; sem provider remoto ou credenciais.
- Gemini: usuário autorizou confiança no workspace; recusou o aviso subsequente de instalação/injeção de instruções. `gemini extensions list` confirmou que nada foi instalado.
- Claude Code oferece `--plugin-dir` para carga local temporária; smoke não interativo de AFR-031 foi tentado sem persistência/ferramentas, mas o CLI respondeu `Not logged in · Please run /login`; execução funcional continua pendente.
- Claude `plugin test` não executou porque o adapter não está instalado; não houve instalação automática.
- Guia geral Claude atualizado para recomendar `--scope local`; validação estrita do plugin e marketplace repetida com PASS e `pnpm integrations:validate` PASS. Ver `evidence/M5-2026-11-14-progress-6.md`.
- Ciclo `host apply/uninstall` implementado para Claude, Codex, Kimi e Gemini; `--apply` explícito, conflitos interrompem antes de escrita, rollback após falha e remoção conservadora por hashes. Ver testes `host apply ...` em `packages/cli/src/index.test.ts`.
- `ases host update <host> [workspace]` implementado: plano read-only por padrão, `--apply` explícito, backup de cada arquivo antes da substituição, detecção de alterações locais pelo hash, manifesto atualizado atomicamente, tentativa de rollback e backups preservados mesmo após uninstall. Ver testes `host update ...` em `packages/cli/src/index.test.ts` e `evidence/M5-2026-11-14-progress-9.md`.
- AFR-050 implementado: `generateForMode("offline", ...)` usa exclusivamente `MockProvider`, mesmo se um provider remoto for fornecido; modos restantes exigem provider explícito. Teste negativo comprova zero chamadas ao adapter remoto.
- AFR-044 implementado: catálogo de provider/modelo valida capacidades e guarda a fonte e a data de observação sem alegar verificação live.
- AFR-045 implementado: roteador escolhe provider que declara todas as capabilities exigidas e rejeita seleção impossível.
- AFR-049 implementado: API reporta seleção `host-managed` no modo host e deixa claro que o ASES não escolhe o modelo do CLI hospedeiro.
- AFR-046 implementado: fallback exclui provider primário e só aceita alternativa que mantenha classificação de dados e teto de custo.
- AFR-047 implementado: custo tem estados `estimated`, `reported` e `unknown`, com fonte/justificativa obrigatórias e valores validados.
- AFR-048 implementado: `CallBudget` reserva estimativas antes do dispatch e bloqueia excedentes inclusive sob concorrência.
- AFR-043 implementado: `probeProvider` exige opt-in e descarta texto/respostas de erro brutas; nenhuma credencial é retornada nem logada.
- AFR-051/052 implementados: declarações de agente validam permissões e budgets; a seleção de contexto respeita allowlist de paths.
- AFR-053 implementado: execução serial preserva ordem quando paralelismo não está disponível.
- AFR-055 implementado: revisão exige identidade de revisor independente da autoria, normalizando espaços e caixa.
- AFR-054 implementado: tarefas com claims de escrita conflitantes são barradas antes que qualquer agente comece.
- AFR-056 implementado: Skills passam por schema de frontmatter e testes positivos/negativos integrados ao `pnpm test`.
- AFR-057 implementado: loader resolve por ID apenas a Skill solicitada, com teste que prova que os outros loaders não são chamados.
- AFR-058/059 implementados: tools validam entrada e saída em runtime; side effects exigem autorização aprovada antes da execução.
- AFR-060 implementado: paths de tools não escapam do workspace por traversal ou symlink sem permissão explícita.
- AFR-061 implementado: DSL de workflow valida nós/dependências, rejeita ciclos e produz ordem topológica determinística.
- AFR-062/063 implementados: checkpoints gravados atomicamente e retomada restrita a definição com hash idêntico.
- AFR-064 implementado: etapas suportam timeout e retry limitado; cancelamento do chamador interrompe sem retry.
- AFR-065 implementado: etapas com side effects recebem chave idempotente estável, derivada da definição completa e da etapa; adaptadores precisam encaminhar essa chave para obter deduplicação no serviço. A garantia de idempotência externa depende do serviço executor.
- AFR-068 implementado: dry-run valida e retorna o plano sem invocar handlers.
- AFR-067 implementado: gates de aprovação só abrem com decisão explícita de revisor independente; pendências e autoaprovação ficam bloqueadas.

## Próximas tarefas READY

1. Prioridade Claude Code: observar descoberta e executar `/eureka42-ases:ases-start` em sessão real para completar a evidência de AFR-031; depois avançar Codex (AFR-033), Kimi (AFR-032) e Gemini (AFR-034) conforme permissões de instalação já registradas.
2. Prosseguir a entrevista com personas, autenticação, integrações, observabilidade e critérios de aceite.
3. Validar o MCP HTTP com um Authorization Server de teste antes de declarar compatibilidade operacional de ponta a ponta; a implementação local AFR-088 já usa introspecção OAuth e metadados protegidos.

## Bloqueios de conclusão integral

- A conversão ASES-300 requer revisão contra o DOCX antes de declarar o catálogo homologado.
- O original independente ASES-500 não foi localizado; a consolidação permanece reconstrução para validação.
- Evidências são comparadas ao SHA-256 ao consultar o catálogo; a validade semântica do conteúdo e a relação automática com mudanças no código ainda não são avaliadas.
- O escopo Apache-2.0 foi preparado para software; titularidade do código, ativos de marca e fontes metodológicas ainda requer confirmação antes da distribuição externa.
- Os quatro executáveis de host foram detectados, mas detecção não prova descoberta e execução do plugin em sessão real.
- O roadmap completo M0–M14 é maior que o vertical slice atual; componentes não construídos continuam `PLANNED` ou `NOT_IMPLEMENTED`.
- Pacote npm preparado como `@eureka42/ases-cli@0.1.0-rc.1`, sem `private: true`, com metadados Apache-2.0 e arquivos de licença no tarball; publicação ainda bloqueada por validação de titularidade de marca/assets e autorização do registry.

## Evidências

- `evidence/M0-M1-2026-11-13.md`
- `evidence/M1-2026-11-13-progress-2.md`
- `evidence/M4-2026-11-14-progress-1.md`
- `evidence/M4-2026-11-14-progress-2.md`
- `evidence/M1-M4-2026-11-14-progress-3.md`
- `evidence/M5-2026-11-14-progress-1.md`
- `evidence/M6-2026-11-14-progress-1.md`
- `evidence/M5-2026-11-14-progress-2.md`
- `evidence/M5-2026-11-14-progress-3.md`
- `evidence/M5-2026-11-14-progress-4.md`
- `evidence/M5-2026-11-14-progress-5.md`
- `evidence/M5-2026-11-14-progress-6.md`
- `evidence/M5-2026-11-14-progress-7.md`
- `evidence/M5-2026-11-14-progress-8.md`
- `evidence/M5-2026-11-14-progress-9.md`
- `evidence/M1-2026-11-14-progress-2.md`
- `evidence/ASES-300-markdown-structure-review-2026-11-13.md`
- `evidence/ASES-300-visual-review-2026-11-14.md`
- `evidence/CI-2026-11-14.md`
- `evidence/CI-2026-11-14-progress-2.md`
- `evidence/CI-2026-11-14-progress-3.md`
- `evidence/CI-2026-11-14-progress-4.md`
- `evidence/M6-2026-11-14-progress-2.md`
- `evidence/M6-2026-11-14-progress-3.md`
- `evidence/M6-2026-11-14-progress-4.md`
- `evidence/M6-2026-11-14-progress-5.md`
- `evidence/M6-2026-11-14-progress-6.md`
- `evidence/M6-2026-11-14-progress-7.md`
- `evidence/M6-2026-11-14-progress-8.md`
- `evidence/M6-2026-11-14-progress-9.md`
- `evidence/M7-2026-11-14-progress-1.md`
- `evidence/M7-2026-11-14-progress-2.md`
- `evidence/M7-2026-11-14-progress-3.md`
- `evidence/M7-2026-11-14-progress-4.md`
- `evidence/M7-2026-11-14-progress-5.md`
- `evidence/M7-2026-11-14-progress-6.md`
- `evidence/M7-2026-11-14-progress-7.md`
- `evidence/M7-2026-11-14-progress-8.md`
- `evidence/M8-2026-11-14-progress-1.md`
- `evidence/M8-2026-11-14-progress-2.md`
- `evidence/M8-2026-11-14-progress-3.md`
- `evidence/M8-2026-11-14-progress-4.md`
- `evidence/M8-2026-11-14-progress-5.md`
- `evidence/M8-2026-11-14-progress-6.md`
- `evidence/CI-2026-11-14-progress-7.md`
- `evidence/CI-2026-11-14-progress-8.md`
- `evidence/CI-2026-11-14-progress-9.md`
- `evidence/LAUNCH-2026-11-14-progress-1.md`
- `evidence/SOURCES-2026-11-14-review-1.md`
- `evidence/M5-2026-11-14-progress-10.md`
- `evidence/CI-2026-11-14-progress-5.md`
- `evidence/CI-2026-11-14-progress-6.md`
- `evidence/M8-2026-11-14-progress-7.md`
- `evidence/M9-2026-11-14-progress-1.md`
- `evidence/M9-2026-11-14-progress-2.md`
- `evidence/M10-2026-11-14-progress-1.md`
- `evidence/M10-2026-11-14-progress-2.md`
- `evidence/M11-2026-11-14-progress-1.md`
- `evidence/M11-2026-11-15-progress-1.md`
- `evidence/M11-2026-11-15-progress-2.md`
- `evidence/M11-2026-11-15-progress-3.md`
- `evidence/M11-2026-11-15-progress-4.md`
- `evidence/M15-2026-11-15-progress-1.md`
- `evidence/M12-2026-11-15-progress-1.md`
- `evidence/M12-2026-11-15-progress-2.md`
- `evidence/M13-2026-11-15-progress-1.md`
- `evidence/M13-2026-11-15-progress-2.md`
- `evidence/M13-2026-11-15-progress-3.md`
- `evidence/M13-2026-11-15-progress-4.md`
- `evidence/M13-2026-11-15-progress-5.md`
- `evidence/M13-2026-11-15-progress-6.md`
- `evidence/M13-2026-11-15-progress-7.md`
- `evidence/M13-2026-11-15-progress-8.md`
- `evidence/M13-2026-11-15-progress-9.md`
- `evidence/M9-2026-11-14-progress-2.md`

