# Host integrations

Status geral: `EXPERIMENTAL`. Codex executou o comando de startup verde em sessão autenticada; o auto-carregamento da Skill ainda não foi confirmado. Claude e Antigravity passaram validação estrutural local, mas ainda falta smoke conversacional carregando seus plugins; Kimi validou a Skill portátil em sessão autenticada.

O EUREKA42 ASES possui um núcleo portátil e artefatos separados por host. Eles não são tratados como equivalentes porque cada CLI possui contratos próprios.

| Host | Artefato | Instalação de desenvolvimento | Estado |
|---|---|---|---|
| Codex | Plugin portátil `integrations/codex/` + marketplace `.agents/plugins/` | `codex plugin marketplace add eureka42-ai/ases-framework`; depois `codex plugin add eureka42-ases@eureka42-codex-plugins` | Manifesto, marketplace e onboarding Skill estruturados; instalação isolada passou; sessão funcional pendente |
| Claude Code | Plugin em `.claude-plugin/`, duas Skills e marketplace do repositório | `claude plugin marketplace add eureka42-ai/ases-framework --scope local`; depois `claude plugin install eureka42-ases@eureka42-ases-plugins --scope local` | Strict validation e descoberta por instalação isolada passaram; invocação da Skill em conversa pendente |
| Google Antigravity CLI (`agy`) | Plugin nativo `integrations/antigravity-cli/` com `plugin.json`, logo, Skill e script de startup | `agy plugin validate --strict ./integrations/antigravity-cli`; depois `agy plugin install ./integrations/antigravity-cli` | Strict validation, plugin enabled e smoke real do `/ases-project-start` passaram em `agy 1.5.9`; logo foi executado antes da pergunta em workspace temporário vazio; ver `evidence/M5-2026-11-16-antigravity.md` |
| Kimi Code CLI | Skill auto-descoberta em `.agents/skills/` e plugin nativo via `/plugins` | revisar `ases host plan kimi-code <workspace>` e executar `ases host apply kimi-code <workspace> --apply`; opcional: `/plugins install https://github.com/eureka42-ai/ases-framework/tree/main/integrations/kimi-code` | Skill carregada em sessão OAuth real via `--skills-dir`; logo RGB verde exibido antes da primeira pergunta; instalação per-user do plugin nativo não executada |
| Gemini CLI (legado) | Extensão mantida em `integrations/gemini-cli/` para instalações existentes | `gemini extensions link integrations/gemini-cli` | Compatibilidade histórica; para o CLI Google atual, use o plugin Antigravity acima |
| Visual Studio Code | Extensão local `integrations/vscode/` com comando na Command Palette | `cd integrations/vscode && vsce package && code --install-extension eureka42-ases-0.1.0-rc.1.vsix` | Manifesto e sequência de startup validados; VSIX/instalação ainda não homologados |

## Matriz de versões e capacidades observadas

Versões da matriz foram coletadas localmente em 2026-11-14; os smokes do owner para Claude, Kimi e Antigravity foram recebidos em 2026-11-16. A coluna descreve o contrato disponível; a procedência de cada validação fica explicitada na tabela.

| Host | Versão observada | Interface de integração no repositório | Validação objetiva | Execução da Skill na sessão |
|---|---:|---|---|---|
| Codex CLI | 0.169.0 (`codex --version`) | Plugin portátil com onboarding Skill, catálogo no marketplace do repositório, `AGENTS.md` e MCP stdio read-only opcional | Plugin RC1 habilitado em sessão autenticada; `codex exec --ephemeral --sandbox read-only` executou `ases welcome --color`, saída RGB verde confirmada; instalação temporária removida depois | Startup confirmado; auto-descoberta da onboarding Skill e MCP do host ainda não confirmados |
| Claude Code | 2.1.325 (relato do owner; teste local desta sessão não executado) | Plugin, command, Skill e fallback de logo autocontido; carregamento via `--plugin-dir` ou marketplace do repositório | Plugin `--strict` passou; script local imprime ANSI RGB verde; relato do owner diz plugin não instalado/carregado e logo não verificado | Smoke autenticado e exibição do logo dentro do Claude Code continuam pendentes; ver `evidence/M5-2026-11-16-claude-plugin-fallback.md` |
| Kimi Code CLI | 2.5.3 (`kimi --version`; smoke do owner em 2026-11-16) | Skill portátil em `.agents/skills/` ou `--skills-dir`; pacote Beta `kimi.plugin.json` | Owner reportou entrevista guiada e `ases welcome --color` com RGB verde em workspace temporário; sem workaround `EMFILE`; a Skill foi lida manualmente e preparada no workspace após início da sessão | Fluxo e logo confirmados; auto-descoberta numa sessão nova não comprovada; plugin nativo `/plugins` não instalado; ver `evidence/M5-2026-11-16-kimi-smoke.md` |
| Antigravity CLI (`agy`) | 1.5.9; Gemini 4 Argon (Medium), observado no smoke | Plugin nativo `plugin.json`, logo oficial, Skill `/ases-project-start` e script local de startup | `agy plugin validate --strict` PASS; plugin instalado/enabled e Skill descoberta | Smoke real em modo plan passou: logo executado e primeira pergunta feita sem escrita; ver `evidence/M5-2026-11-16-antigravity.md` |
| Gemini CLI (legado) | 0.42.0 (`gemini --version`, registro histórico) | Extension com contexto, command, Skill e tema | `gemini extensions validate` passou em registro anterior | Mantido para compatibilidade, sem novos testes; migração documentada para Antigravity |

Na instalação Claude documentada acima, `--scope local` limita a configuração ao checkout atual; consulte [`claude-code/README.md`](claude-code/README.md) para o ciclo de remoção com preservação de dados. Para instalar Antigravity, consulte [`antigravity-cli/README.md`](antigravity-cli/README.md); `agy plugin install` altera o perfil local do usuário e a desinstalação é `agy plugin uninstall eureka42-ases`. Para promover uma linha a `SUPPORTED`, registre instalação ou carregamento, descoberta e execução funcional da Skill na versão anotada. Recolha as versões novamente antes de publicar uma release, pois esta matriz é uma observação local datada.

`ases host plan <host> <workspace>` apresenta o diff previsto para os artefatos locais, identifica conflitos e não escreve no workspace. `ases host apply <host> <workspace>` também é somente leitura por padrão; acrescente `--apply` apenas depois de revisar o plano. A instalação é limitada ao workspace e usa criação exclusiva, sem sobrescrever arquivos. `ases host update <host> <workspace>` também exige `--apply`; antes de substituir cada arquivo de propriedade ASES, salva a versão instalada em `.ases/backups/hosts/<host>/`. Hash divergente interrompe a atualização sem escrita, e os backups permanecem após uninstall. `ases host uninstall` mostra o plano de remoção; `--apply` remove apenas arquivos intactos listados no manifesto de propriedade e preserva edições locais. Arquivos compartilhados, como a Skill comum a Codex e Kimi, recebem referências de uso para que a remoção de um host não quebre o outro; depois de desinstalar o último consumidor, repita o comando do host proprietário para retirar o arquivo. Nenhum dos comandos grava configurações globais. Para Claude Code, o plano prepara uma Skill e um comando locais em `.claude/`; para instalar o plugin nativo com namespace e marketplace, siga [`claude-code/README.md`](claude-code/README.md). O Codex também tem um plugin instalável e documentado em [`codex/README.md`](codex/README.md).

## Experiência pretendida

1. O primeiro comando de terminal do fluxo é a CLI `ases welcome --color`, quando instalada; plugins autocontidos (Claude Code e Antigravity) trazem fallback local com a mesma marca RGB verde antes das perguntas.
2. O agente inspeciona o workspace.
3. Pergunta tipo de aplicativo, linguagem, hospedagem e banco de dados.
4. Avalia escolhas existentes sem substituí-las silenciosamente.
5. Propõe defaults quando faltam decisões.
6. Registra tudo como `PROPOSED` até confirmação explícita.

O comando determinístico `ases interview` é a fonte operacional inicial. As Skills ensinam cada host a conduzir o mesmo fluxo quando o binário não estiver disponível. Versões observadas nesta sessão: Codex 0.169.0, Claude Code 2.1.325, Kimi Code 2.5.3 e Antigravity CLI 1.5.9; Gemini CLI 0.42.0 fica registrado como legado. Antigravity está validado estruturalmente, mas ainda não foi promovido a `SUPPORTED`, pois falta observar descoberta e execução funcional da Skill numa conversa real.

O MCP server também pode ser configurado como subprocesso com `ases mcp <workspace>`. Ele fixa um único workspace e expõe ferramentas de consulta de requisitos. O adapter de cada host ainda precisa de configuração e smoke test específico; o servidor não configura os hosts automaticamente. A implementação stdio usa o [SDK oficial MCP TypeScript](https://ts.sdk.modelcontextprotocol.io/v2/serving/stdio) e serve os protocolos [moderno e legado](https://ts.sdk.modelcontextprotocol.io/v2/protocol-versions).

Validação local em 2026-11-14: `claude plugin validate integrations/claude-code --strict` passou e o plugin foi instalado de um marketplace local com configuração isolada; `claude plugin details` encontrou as duas Skills. O perfil de diretório da Anthropic ainda exige licença aprovada (`LICENSE_MISSING`). `gemini extensions validate integrations/gemini-cli` passou para o adapter legado; Antigravity CLI é a integração Google atual e foi validada separadamente em 2026-11-16. Kimi 2.5.3 aceita `--skills-dir`, mas não lista comandos `plugin` em `kimi --help`; Codex CLI 0.169.0 instalou o plugin deste marketplace em `CODEX_HOME` temporário e o inventariou como habilitado.

Validação Kimi Code em 2026-11-15: smoke OAuth em workspace vazio carregou `ases-project-start`, executou `ases welcome --color` e confirmou a logo RGB verde antes da pergunta inicial. `KIMI_CODE_WATCH=false` foi usado apenas na execução para contornar `EMFILE`; o plugin nativo per-user não foi instalado. Ver [`evidence/M5-2026-11-15-progress-25.md`](../evidence/M5-2026-11-15-progress-25.md).

O perfil de publicação do diretório Anthropic exige uma licença aprovada; não inserimos um SPDX placeholder. O marketplace público próprio do repositório foi validado localmente. A instalação antiga da extensão Gemini foi cancelada no aviso que descreve injeção de instruções; `gemini extensions list` confirmou que nada foi instalado. Antigravity permite validação e instalação local do plugin; veja [`antigravity-cli/README.md`](antigravity-cli/README.md). Claude Code oferece `--plugin-dir` para carga local por execução; a sessão conversacional segue pendente.

## Segurança

- Instalação não é automática nesta fase.
- Nenhum adapter altera configurações globais.
- Nenhum provider, credencial ou serviço pago é necessário.
- A identidade visual não representa certificação de compatibilidade.
- Cada host só será promovido a `SUPPORTED` depois de instalação, descoberta e execução funcional registradas.

