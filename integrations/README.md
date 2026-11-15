# Host integrations

Status geral: `EXPERIMENTAL`. Codex executou o comando de startup verde em sessão autenticada; o auto-carregamento da Skill ainda não foi confirmado. Claude e Gemini passaram nos validadores estruturais, mas não puderam iniciar sessão autenticada neste ambiente; Kimi falhou ao iniciar com erro `EMFILE`.

O EUREKA42 ASES possui um núcleo portátil e artefatos separados por host. Eles não são tratados como equivalentes porque cada CLI possui contratos próprios.

| Host | Artefato | Instalação de desenvolvimento | Estado |
|---|---|---|---|
| Codex | Plugin portátil `integrations/codex/` + marketplace `.agents/plugins/` | `codex plugin marketplace add eureka42-ai/ases-framework`; depois `codex plugin add eureka42-ases@eureka42-codex-plugins` | Manifesto, marketplace e onboarding Skill estruturados; instalação isolada passou; sessão funcional pendente |
| Claude Code | Plugin em `.claude-plugin/`, duas Skills e marketplace do repositório | `claude plugin marketplace add eureka42-ai/ases-framework --scope local`; depois `claude plugin install eureka42-ases@eureka42-ases-plugins --scope local` | Strict validation e descoberta por instalação isolada passaram; invocação da Skill em conversa pendente |
| Kimi Code CLI | Skill auto-descoberta em `.agents/skills/` e pacote Beta `kimi.plugin.json` | revisar `ases host plan kimi-code <workspace>` e executar `ases host apply kimi-code <workspace> --apply`; pacote Beta só em versão que exponha `/plugins` | `--skills-dir` presente; shell local não lista `plugin`; sessão pendente |
| Gemini CLI | `gemini-extension.json`, contexto, Skill, command e tema | `gemini extensions link integrations/gemini-cli` em checkout de desenvolvimento | `gemini extensions validate` PASS; sessão funcional pendente |
| Visual Studio Code | Extensão local `integrations/vscode/` com comando na Command Palette | `cd integrations/vscode && vsce package && code --install-extension eureka42-ases-0.1.0-rc.1.vsix` | Manifesto e sequência de startup validados; VSIX/instalação ainda não homologados |

## Matriz de versões e capacidades observadas

Versões coletadas em 2026-11-14 com os comandos locais indicados. A coluna de capacidade descreve o contrato de integração disponível no repositório; não atesta que a sessão do agente o carregou.

| Host | Versão observada | Interface de integração no repositório | Validação objetiva | Execução da Skill na sessão |
|---|---:|---|---|---|
| Codex CLI | 0.169.0 (`codex --version`) | Plugin portátil com onboarding Skill, catálogo no marketplace do repositório, `AGENTS.md` e MCP stdio read-only opcional | Plugin RC1 habilitado em sessão autenticada; `codex exec --ephemeral --sandbox read-only` executou `ases welcome --color`, saída RGB verde confirmada; instalação temporária removida depois | Startup confirmado; auto-descoberta da onboarding Skill e MCP do host ainda não confirmados |
| Claude Code | 2.1.323 (`claude --version`) | Plugin, command e Skill; carregamento via `--plugin-dir` ou marketplace do repositório | `claude plugin validate --strict` passou; `claude auth status` retornou `loggedIn: false` | Sessão bloqueada por ausência de login |
| Kimi Code CLI | 2.5.3 (`kimi --version`) | Skill via projeto `.agents/skills/` e pacote Beta `kimi.plugin.json` | `kimi --help` confirma `--skills-dir`; não lista subcomando `plugin`; duas tentativas read-only falharam com `EMFILE: too many open files, watch`, inclusive em workspace temporário vazio | Sessão bloqueada pelo erro `EMFILE` do CLI |
| Gemini CLI | 0.42.0 (`gemini --version`) | Extension com contexto, command, Skill e tema | `gemini extensions validate` passou; `gemini auth status` não encontrou provider configurado; instalação anteriormente recusada no prompt de confiança | Sessão não executada; requer autenticação e confirmação de confiança |

Na instalação Claude documentada acima, `--scope local` limita a configuração ao checkout atual; consulte [`claude-code/README.md`](claude-code/README.md) para o ciclo de remoção com preservação de dados. Para promover uma linha a `SUPPORTED`, registre instalação ou carregamento, descoberta e execução funcional da Skill na versão anotada. Recolha as versões novamente antes de publicar uma release, pois esta matriz é uma observação local datada.

`ases host plan <host> <workspace>` apresenta o diff previsto para os artefatos locais, identifica conflitos e não escreve no workspace. `ases host apply <host> <workspace>` também é somente leitura por padrão; acrescente `--apply` apenas depois de revisar o plano. A instalação é limitada ao workspace e usa criação exclusiva, sem sobrescrever arquivos. `ases host update <host> <workspace>` também exige `--apply`; antes de substituir cada arquivo de propriedade ASES, salva a versão instalada em `.ases/backups/hosts/<host>/`. Hash divergente interrompe a atualização sem escrita, e os backups permanecem após uninstall. `ases host uninstall` mostra o plano de remoção; `--apply` remove apenas arquivos intactos listados no manifesto de propriedade e preserva edições locais. Arquivos compartilhados, como a Skill comum a Codex e Kimi, recebem referências de uso para que a remoção de um host não quebre o outro; depois de desinstalar o último consumidor, repita o comando do host proprietário para retirar o arquivo. Nenhum dos comandos grava configurações globais. Para Claude Code, o plano prepara uma Skill e um comando locais em `.claude/`; para instalar o plugin nativo com namespace e marketplace, siga [`claude-code/README.md`](claude-code/README.md). O Codex também tem um plugin instalável e documentado em [`codex/README.md`](codex/README.md).

## Experiência pretendida

1. O primeiro comando de terminal do fluxo plugin é `ases welcome --color`; a marca Eureka42 aparece em verde antes das perguntas.
2. O agente inspeciona o workspace.
3. Pergunta tipo de aplicativo, linguagem, hospedagem e banco de dados.
4. Avalia escolhas existentes sem substituí-las silenciosamente.
5. Propõe defaults quando faltam decisões.
6. Registra tudo como `PROPOSED` até confirmação explícita.

O comando determinístico `ases interview` é a fonte operacional inicial. As Skills ensinam cada host a conduzir o mesmo fluxo quando o binário não estiver disponível. Versões observadas nesta sessão: Codex 0.169.0, Claude Code 2.1.323, Kimi Code 2.5.3 e Gemini CLI 0.42.0. Nenhum host foi promovido a `SUPPORTED`, pois ainda falta prova de descoberta e execução funcional dentro da sessão.

O MCP server também pode ser configurado como subprocesso com `ases mcp <workspace>`. Ele fixa um único workspace e expõe ferramentas de consulta de requisitos. O adapter de cada host ainda precisa de configuração e smoke test específico; o servidor não configura os hosts automaticamente. A implementação stdio usa o [SDK oficial MCP TypeScript](https://ts.sdk.modelcontextprotocol.io/v2/serving/stdio) e serve os protocolos [moderno e legado](https://ts.sdk.modelcontextprotocol.io/v2/protocol-versions).

Validação local em 2026-11-14: `claude plugin validate integrations/claude-code --strict` passou e o plugin foi instalado de um marketplace local com configuração isolada; `claude plugin details` encontrou as duas Skills. O perfil de diretório da Anthropic ainda exige licença aprovada (`LICENSE_MISSING`). `gemini extensions validate integrations/gemini-cli` passou; Kimi 2.5.3 aceita `--skills-dir`, mas não lista comandos `plugin` em `kimi --help`; Codex CLI 0.169.0 instalou o plugin deste marketplace em `CODEX_HOME` temporário e o inventariou como habilitado. Nenhuma dessas verificações executou a Skill numa conversa real.

O perfil de publicação do diretório Anthropic exige uma licença aprovada; não inserimos um SPDX placeholder. O marketplace público próprio do repositório foi validado localmente. A instalação Gemini foi cancelada no aviso que descreve injeção de instruções, e `gemini extensions list` confirmou que nada foi instalado. Claude Code oferece `--plugin-dir` para carregamento local por execução; o inventário do plugin foi verificado fora de uma conversa com modelo.

## Segurança

- Instalação não é automática nesta fase.
- Nenhum adapter altera configurações globais.
- Nenhum provider, credencial ou serviço pago é necessário.
- A identidade visual não representa certificação de compatibilidade.
- Cada host só será promovido a `SUPPORTED` depois de instalação, descoberta e execução funcional registradas.

