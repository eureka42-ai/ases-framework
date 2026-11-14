# Host integrations

Status geral: `EXPERIMENTAL`. Os manifests de Claude Code e Gemini CLI passaram seus validadores locais; ainda falta smoke funcional de sessão para cada host. Codex e Kimi foram detectados, mas suas integrações permanecem `NOT_TESTED`.

O EUREKA42 ASES possui um núcleo portátil e artefatos separados por host. Eles não são tratados como equivalentes porque cada CLI possui contratos próprios.

| Host | Artefato | Instalação de desenvolvimento | Estado |
|---|---|---|---|
| Codex | `AGENTS.md` + `.agents/skills/` | copiar/mesclar no projeto de destino após revisar o diff | MANIFEST/Skill local validado; sessão funcional pendente |
| Claude Code | `.claude-plugin/plugin.json`, Skill e command | instalar como plugin local conforme a versão do host | `claude plugin validate --strict` sem erro de schema; diretório público exige licença |
| Kimi Code CLI | `kimi.plugin.json` com `sessionStart.skill` | instalar o diretório/repositório e executar `/plugins reload` | Manifest/Skill local validado; recarga/sessão funcional pendente |
| Gemini CLI | `gemini-extension.json`, contexto, Skill, command e tema | `gemini extensions link integrations/gemini-cli` em checkout de desenvolvimento | `gemini extensions validate` PASS; sessão funcional pendente |

## Matriz de versões e capacidades observadas

Versões coletadas em 2026-11-14 com os comandos locais indicados. A coluna de capacidade descreve o contrato de integração disponível no repositório; não atesta que a sessão do agente o carregou.

| Host | Versão observada | Interface de integração no repositório | Validação objetiva | Execução da Skill na sessão |
|---|---:|---|---|---|
| Codex CLI | 0.169.0 (`codex --version`) | `AGENTS.md`, Skill em `.agents/skills/` e servidor MCP stdio read-only | Executável detectado; arquivos locais inspecionados | `NOT_TESTED` |
| Claude Code | 2.1.323 (`claude --version`) | Plugin, command e Skill; carregamento local via `--plugin-dir` | Validação estrita do schema/commands passou; licença bloqueia perfil público | `NOT_TESTED` |
| Kimi Code CLI | 2.5.3 (`kimi --version`) | Plugin com hook `sessionStart.skill` e Skill | Manifest local validado; `kimi doctor` só verificou configuração do cliente | `NOT_TESTED` |
| Gemini CLI | 0.42.0 (`gemini --version`) | Extension com contexto, command, Skill e tema | `gemini extensions validate` passou; instalação foi recusada no prompt de confiança | `NOT_TESTED` |

Para promover uma linha a `SUPPORTED`, registre instalação ou carregamento, descoberta e execução funcional da Skill na versão anotada. Recolha as versões novamente antes de publicar uma release, pois esta matriz é uma observação local datada.

`ases host plan <host> <workspace>` apresenta o diff previsto para os artefatos locais, identifica conflitos e não escreve no workspace. Funciona no checkout ou pelo pacote CLI instalado. Revise todos os destinos antes de decidir qualquer instalação.

## Experiência pretendida

1. A identidade EUREKA42 ASES aparece em teal/verde quando o terminal permite.
2. O agente inspeciona o workspace.
3. Pergunta tipo de aplicativo, linguagem, hospedagem e banco de dados.
4. Avalia escolhas existentes sem substituí-las silenciosamente.
5. Propõe defaults quando faltam decisões.
6. Registra tudo como `PROPOSED` até confirmação explícita.

O comando determinístico `ases interview` é a fonte operacional inicial. As Skills ensinam cada host a conduzir o mesmo fluxo quando o binário não estiver disponível. Versões observadas nesta sessão: Codex 0.169.0, Claude Code 2.1.323, Kimi Code 2.5.3 e Gemini CLI 0.42.0. Nenhum host foi promovido a `SUPPORTED`, pois ainda falta prova de descoberta e execução funcional dentro da sessão.

O MCP server também pode ser configurado como subprocesso com `ases mcp <workspace>`. Ele fixa um único workspace e expõe ferramentas de consulta de requisitos. O adapter de cada host ainda precisa de configuração e smoke test específico; o servidor não configura os hosts automaticamente. A implementação stdio usa o [SDK oficial MCP TypeScript](https://ts.sdk.modelcontextprotocol.io/v2/serving/stdio) e serve os protocolos [moderno e legado](https://ts.sdk.modelcontextprotocol.io/v2/protocol-versions).

Validação estática repetida em 2026-11-13: `claude plugin validate integrations/claude-code --strict` aceitou schema/commands, mas apontou `LICENSE_MISSING` no profile de diretório; `gemini extensions validate integrations/gemini-cli` passou; `kimi doctor` validou apenas `config.toml` e `tui.toml`; `codex --version` detectou 0.169.0. Estas verificações não carregam nem executam o fluxo da Skill em sessão real.

O validador Claude exige uma licença aprovada para a distribuição pública; não inserimos um SPDX placeholder. A instalação Gemini foi cancelada no aviso que descreve injeção de instruções, e `gemini extensions list` confirmou que nada foi instalado. Claude Code oferece `--plugin-dir` para carregamento local por execução, ainda não exercitado numa sessão.

## Segurança

- Instalação não é automática nesta fase.
- Nenhum adapter altera configurações globais.
- Nenhum provider, credencial ou serviço pago é necessário.
- A identidade visual não representa certificação de compatibilidade.
- Cada host só será promovido a `SUPPORTED` depois de instalação, descoberta e execução funcional registradas.

