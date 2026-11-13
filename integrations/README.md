# Host integrations

Status geral: `EXPERIMENTAL`. Os manifests de Claude Code e Gemini CLI passaram seus validadores locais; ainda falta smoke funcional de sessão para cada host. Codex e Kimi foram detectados, mas suas integrações permanecem `NOT_TESTED`.

O EUREKA42 ASES possui um núcleo portátil e artefatos separados por host. Eles não são tratados como equivalentes porque cada CLI possui contratos próprios.

| Host | Artefato | Instalação de desenvolvimento | Estado |
|---|---|---|---|
| Codex | `AGENTS.md` + `.agents/skills/` | copiar/mesclar no projeto de destino após revisar o diff | NOT_TESTED |
| Claude Code | `.claude-plugin/plugin.json`, Skill e command | instalar como plugin local conforme a versão do host | NOT_TESTED |
| Kimi Code CLI | `kimi.plugin.json` com `sessionStart.skill` | instalar o diretório/repositório e executar `/plugins reload` | NOT_TESTED |
| Gemini CLI | `gemini-extension.json`, contexto, Skill, command e tema | `gemini extensions link integrations/gemini-cli` em checkout de desenvolvimento | NOT_TESTED |

## Experiência pretendida

1. A identidade EUREKA42 ASES aparece em teal/verde quando o terminal permite.
2. O agente inspeciona o workspace.
3. Pergunta tipo de aplicativo, linguagem, hospedagem e banco de dados.
4. Avalia escolhas existentes sem substituí-las silenciosamente.
5. Propõe defaults quando faltam decisões.
6. Registra tudo como `PROPOSED` até confirmação explícita.

O comando determinístico `ases interview` é a fonte operacional inicial. As Skills ensinam cada host a conduzir o mesmo fluxo quando o binário não estiver disponível.

## Segurança

- Instalação não é automática nesta fase.
- Nenhum adapter altera configurações globais.
- Nenhum provider, credencial ou serviço pago é necessário.
- A identidade visual não representa certificação de compatibilidade.
- Cada host só será promovido a `SUPPORTED` depois de instalação, descoberta e execução funcional registradas.

