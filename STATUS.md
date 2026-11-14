# STATUS

Atualizado em: 2026-11-14

## Estado

- M0: IMPLEMENTED / PARTIALLY_VERIFIED
- M1 vertical slice: IMPLEMENTED / VERIFIED_LOCALLY
- Repositório Git: branch `main`; alterações de CI e proteção da entrevista nesta rodada, pendentes de commit/push
- Fonte diretora: presente e lida
- ASES-300: DOCX e conversão Markdown presentes localmente; revisão estrutural preliminar confirmou 300 IDs/títulos e hashes íntegros; conferência visual/editorial ainda pendente.
- ASES-500 separado: consolidação presente como reconstrução para validação; original independente ausente e homologação pendente.
- Publicação: NOT_AUTHORIZED

## Implementação atual

- Monorepo TypeScript strict criado.
- CLI vertical slice implementado: `help`, `--version`, `init`, `doctor`, `config validate`.
- `config explain` implementado; `doctor` ampliado para Git, npm e pnpm.
- `config explain` resolve defaults, arquivo, variáveis ASES allowlistadas e `--set` com precedência explícita; segredos fora da allowlist não são lidos nem impressos.
- Schema inicial publicado localmente em `schemas/ases.config.schema.json`.
- README completo e assets oficiais da marca organizados em `docs/assets/brand/`.
- Identidade ANSI teal/verde disponível em `ases welcome` e na ajuda.
- Entrevista inicial implementada com tipo de aplicativo, linguagem, hospedagem, banco, escala e dados sensíveis; AFR-016..020 rastreados a código e testes.
- O fluxo interativo apresenta a marca antes das perguntas; a saída `--json` exige arquivo `--answers` para preservar JSON válido.
- Antes das perguntas, a entrevista consulta somente manifestos conhecidos, exibe arquivos e pistas de stack, deixa inferências editáveis e não lê `.env`/credenciais; destino Docker continua sem confirmação automática.
- Recomendações ausentes ficam `PROPOSED`; escolhas existentes ficam `REVIEW_REQUIRED`.
- AFR-018 avalia divergência entre respostas e manifestos, e registra riscos bloqueantes de dados sensíveis/escala alta no JSON e SPEC sem confirmar automaticamente.
- Integrações experimentais criadas para Codex, Claude Code, Kimi Code CLI e Gemini CLI.
- `ases host plan <host> <workspace>` gera plano somente leitura com diffs, conflitos, hashes de assets binários e proteção contra symlink escape.
- `ases mcp <workspace>` serve três ferramentas de consulta read-only sobre o workspace fixado via SDK MCP oficial; suporta protocolo moderno e handshake legado, com stdout reservado a JSON-RPC.
- Leitura de catálogo agora rejeita arquivo catalog symlinkado ou cujo caminho canonicalizado saia do workspace.
- Hosts locais detectados nesta sessão: Codex 0.169.0, Claude Code 2.1.323, Kimi 2.5.3 e Gemini 0.42.0.
- `init` possui `--dry-run`, saída JSON e proteção contra sobrescrita.
- Gerenciador de pacotes fixado em pnpm 10.20.0; `pnpm-lock.yaml` importado e instalação `--frozen-lockfile` validada.
- Build TypeScript strict: PASS.
- Testes unitários: PASS (34/34) em 2026-11-14; `pnpm test` também compila TypeScript e valida as integrações.
- Manifests/Skills locais: PASS (3 manifests, 5 Skills).
- Claude plugin validator: manifest/commands válidos; publicação no diretório bloqueada pela ausência de licença aprovada.
- Gemini extension validator: PASS.
- `npm pack` inclui módulos runtime e os quatro adapters; instalação local do tarball + `ases --version` e `ases host plan` em workspace externo: PASS.
- Backlog AFR-001..140: 32 requisitos IMPLEMENTED e ligados a código/testes/evidência; 108 seguem PENDING, muitos ainda sem detalhamento suficiente para estimar rodadas com precisão.
- Fontes recebidas em `FONTES_ASES_PARA_DESKTOP_FRAMEWORK/`; SHA-256 dos seis arquivos listados validado.
- Matriz Eureka42 segregada; REQ-301..500 mantidos como referência específica de domínio.
- Importador de produto validado com a matriz Eureka42 local: 200 itens REQ-301..500, SHA-256 `12ce223cc7a3fbe54051d027ec4785fe79bd4b1febf5f91d01051cf0b66a1dd1`; arquivo permanece em workspace temporário.
- Importador ASES-300 implementado; grava catálogo por workspace com hash e textos dos requisitos.
- `ases requirements list/show` implementados para catálogo importado.
- Importação real da fonte local: PASS; 300 itens, SHA-256 `22e439ea514e1f365d3611a8644aac861f8c739054f8c35084a0e94e30302314`.
- Ciclo de estados ASES-300 implementado; `VERIFIED` exige arquivo local dentro do workspace, calcula SHA-256, e `N_A` exige justificativa; histórico de transições mantido.
- Validação de evidências resolve caminhos reais e rejeita links simbólicos para fora do workspace; apenas arquivos regulares podem comprovar `VERIFIED`.
- `requirements show/list` recalculam integridade de evidências (`CURRENT`, `STALE`, `MISSING`, `OUTSIDE_WORKSPACE`, `UNVERIFIABLE`); README documenta limites da checagem semântica.
- Testes: 30/30 PASS; incluem MCP stdio moderno/legado, isolamento de workspace, rejeição de symlinks e segredo em logs, plano host/diff e prevenção de symlink escape, análise de contradições e riscos, persistência de achados na SPEC, inspeção segura de manifestos e retomada de decisões na entrevista, separação de catálogos, estados de decisão independentes, rastreabilidade, bloqueios justificados, integridade, piso Node.js, identidade da entrevista e resolução segura de configuração.
- Parser ASES-300: classificação e prioridade agora são extraídas separadamente quando aparecem na mesma linha; regressão automatizada PASS.
- Validadores de integração: PASS (3 manifests, 5 Skills).
- Validação host estática nesta rodada: Claude schema PASS, profile de diretório bloqueado por licença; Gemini extension PASS; `kimi doctor` validou só os arquivos de configuração; Codex 0.169.0 detectado. Descoberta/execução em sessões de agente permanecem pendentes.
- Validação continuada anterior: `git diff --check` PASS; `kimi doctor` PASS para configuração local (não é validação do plugin).
- CI GitHub Actions configurado para Node.js 22/24 com instalação pnpm congelada; execução remota ainda precisa ser observada antes de concluir AFR-028.
- AFR-027 coberto por preservação idempotente no `init`, recusa de sobrescrita da entrevista sem `--resume` explícito e plano de instalação host somente leitura.
- Matriz local de versões e contratos de integração dos quatro hosts registrada; hosts sem prova de carga/execução da Skill continuam `NOT_TESTED`, como cobre o teste de `host list`.
- Claude Code: plugin validado com `claude plugin validate --strict`, marketplace do repositório validado, instalação isolada e inventário confirmaram duas Skills carregadas. A invocação em conversa permanece pendente; perfil de distribuição oficial Anthropic exige decisão de licença.
- Configuração MCP de projeto Claude gerada e conferida em workspace temporário; `claude mcp list` marcou `Pending approval`, sem inicializar o servidor.
- SPI de providers implementada com erros tipados, timeout, cancelamento e provider mock determinístico; sem provider remoto ou credenciais.
- Gemini: usuário autorizou confiança no workspace; recusou o aviso subsequente de instalação/injeção de instruções. `gemini extensions list` confirmou que nada foi instalado.
- Claude Code oferece `--plugin-dir` para carga local temporária; teste em sessão sem inferência ainda não concluído.
- Claude `plugin test` não executou porque o adapter não está instalado; não houve instalação automática.

## Próximas tarefas READY

1. Testar instalação, descoberta e execução das integrações em sessões reais dos quatro hosts.
2. Prosseguir a entrevista com personas, autenticação, integrações, observabilidade e critérios de aceite.

## Bloqueios de conclusão integral

- A conversão ASES-300 requer revisão contra o DOCX antes de declarar o catálogo homologado.
- O original independente ASES-500 não foi localizado; a consolidação permanece reconstrução para validação.
- Evidências são comparadas ao SHA-256 ao consultar o catálogo; a validade semântica do conteúdo e a relação automática com mudanças no código ainda não são avaliadas.
- A licença/copyright do software, metodologia e marca não foi aprovada; não é possível finalizar distribuição pública dos plugins.
- Os quatro executáveis de host foram detectados, mas detecção não prova descoberta e execução do plugin em sessão real.
- O roadmap completo M0–M14 é maior que o vertical slice atual; componentes não construídos continuam `PLANNED` ou `NOT_IMPLEMENTED`.

## Evidências

- `evidence/M0-M1-2026-11-13.md`
- `evidence/M1-2026-11-13-progress-2.md`
- `evidence/M4-2026-11-14-progress-1.md`
- `evidence/M4-2026-11-14-progress-2.md`
- `evidence/M1-M4-2026-11-14-progress-3.md`
- `evidence/M5-2026-11-14-progress-1.md`
- `evidence/M6-2026-11-14-progress-1.md`
- `evidence/M5-2026-11-14-progress-2.md`
- `evidence/ASES-300-markdown-structure-review-2026-11-13.md`

