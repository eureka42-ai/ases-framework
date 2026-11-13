# Host integrations

Status geral: `EXPERIMENTAL`. Os manifests de Claude Code e Gemini CLI passaram seus validadores locais; ainda falta smoke funcional de sessão para cada host. Codex e Kimi foram detectados, mas suas integrações permanecem `NOT_TESTED`.

O EUREKA42 ASES possui um núcleo portátil e artefatos separados por host. Eles não são tratados como equivalentes porque cada CLI possui contratos próprios.

| Host | Artefato | Instalação de desenvolvimento | Estado |
|---|---|---|---|
| Codex | `AGENTS.md` + `.agents/skills/` | copiar/mesclar no projeto de destino após revisar o diff | MANIFEST/Skill local validado; sessão funcional pendente |
| Claude Code | `.claude-plugin/plugin.json`, Skill e command | instalar como plugin local conforme a versão do host | `claude plugin validate --strict` sem erro de schema; diretório público exige licença |
| Kimi Code CLI | `kimi.plugin.json` com `sessionStart.skill` | instalar o diretório/repositório e executar `/plugins reload` | Manifest/Skill local validado; recarga/sessão funcional pendente |
| Gemini CLI | `gemini-extension.json`, contexto, Skill, command e tema | `gemini extensions link integrations/gemini-cli` em checkout de desenvolvimento | `gemini extensions validate` PASS; sessão funcional pendente |

## Experiência pretendida

1. A identidade EUREKA42 ASES aparece em teal/verde quando o terminal permite.
2. O agente inspeciona o workspace.
3. Pergunta tipo de aplicativo, linguagem, hospedagem e banco de dados.
4. Avalia escolhas existentes sem substituí-las silenciosamente.
5. Propõe defaults quando faltam decisões.
6. Registra tudo como `PROPOSED` até confirmação explícita.

O comando determinístico `ases interview` é a fonte operacional inicial. As Skills ensinam cada host a conduzir o mesmo fluxo quando o binário não estiver disponível. Os executáveis locais confirmados nesta rodada: Codex 0.167.2, Claude Code 2.1.323, Kimi Code 2.5.3 e Gemini CLI 0.42.0. Nenhum host foi promovido a `SUPPORTED`, pois ainda falta prova de descoberta e execução funcional dentro da sessão. O validador Claude apontou que a distribuição no diretório público exige licença aprovada; não inserimos um SPDX placeholder. Gemini pediu confiança no workspace antes de `extensions link`; a instalação aguarda confirmação. `kimi doctor` validou somente a configuração do Kimi, não o plugin.

## Segurança

- Instalação não é automática nesta fase.
- Nenhum adapter altera configurações globais.
- Nenhum provider, credencial ou serviço pago é necessário.
- A identidade visual não representa certificação de compatibilidade.
- Cada host só será promovido a `SUPPORTED` depois de instalação, descoberta e execução funcional registradas.

