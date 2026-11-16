# EUREKA42 ASES para Kimi Code CLI

O adapter contém um plugin nativo `kimi.plugin.json` e uma Agent Skill portátil.

## Aplicar como Skill de projeto

O Kimi Code CLI suporta `--skills-dir` e a descoberta de Skills compartilhadas em `.agents/skills/`. Uma sessão autenticada na versão 2.5.3 carregou a Skill e executou o fluxo de início em um workspace temporário vazio; ver [evidência M5 progress 25](../../evidence/M5-2026-11-15-progress-25.md). Para preparar a integração no workspace sem modificar arquivos, rode:

```sh
ases host plan kimi-code ./meu-projeto
ases host apply kimi-code ./meu-projeto
ases host apply kimi-code ./meu-projeto --apply
```

`host apply` sem `--apply` continua sendo somente leitura. Com `--apply`, grava apenas a Skill de projeto em `.agents/skills/` e registra seu hash; nenhuma configuração global do Kimi é alterada. Para remover, revise `ases host uninstall kimi-code ./meu-projeto` e então use `--apply` para retirar somente a Skill inalterada. A partir dali ela é descoberta pelo Kimi e também por outros hosts que reconhecem o padrão Agent Skills. Consulte a [documentação atual de Agent Skills do Kimi Code](https://moonshotai.github.io/kimi-code/en/customization/skills.html).

## Plugin nativo (opcional)

`kimi.plugin.json` segue o formato nativo do Kimi Code e indica a Skill `ases-project-start` em `sessionStart`. O evento carrega instruções para o agente; o host não executa comandos automaticamente. Para instalar de forma per-user, use `/plugins install https://github.com/eureka42-ai/ases-framework/tree/main/integrations/kimi-code` no TUI e inicie uma nova sessão. O plugin não foi instalado neste ambiente; as [instruções oficiais](https://moonshotai.github.io/kimi-code/en/customization/plugins.html) explicam instalação, escopo e ativação.

O executável local reporta Kimi Code 2.5.3. `kimi --help` não lista subcomando de plugin; a instalação e a gestão nativas são comandos slash do TUI (`/plugins`). A [documentação de configuração](https://github.com/MoonshotAI/kimi-code/blob/main/docs/en/configuration/config-files.md) descreve `KIMI_CODE_WATCH=false` como override temporário para desativar watchers. Foi usado apenas no smoke test para superar `EMFILE`; nenhuma configuração persistente foi alterada. `kimi login` oferece autenticação por device code.

## Limites

- Nenhuma instalação per-user do plugin foi executada; o smoke validou a Skill via `--skills-dir`, não o caminho nativo `/plugins`/`sessionStart`.
- O plano ASES é somente leitura; copiar a Skill é uma decisão do usuário do workspace.
