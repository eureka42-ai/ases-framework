# EUREKA42 ASES para Kimi Code CLI

O adapter contém um plugin experimental `kimi.plugin.json` e uma Agent Skill portátil.

## Aplicar como Skill de projeto

O Kimi Code CLI observado suporta `--skills-dir` e a descoberta de Skills compartilhadas em `.agents/skills/`. Para preparar a integração no workspace sem modificar arquivos, rode:

```sh
ases host plan kimi-code ./meu-projeto
```

Revise o diff e copie manualmente a Skill aprovada para `.agents/skills/ases-project-start/SKILL.md`. A partir dali ela é descoberta pelo Kimi e também por outros hosts que reconhecem o padrão Agent Skills. Consulte a [documentação de Agent Skills do Kimi](https://moonshotai.github.io/kimi-cli/en/customization/skills.html).

## Plugin experimental

`kimi.plugin.json` empacota o fluxo e indica a Skill `ases-project-start` para início de sessão. A documentação oficial descreve plugins como Beta e oferece instalação por gerenciador `/plugins` ou CLI em versões compatíveis: [Plugins do Kimi Code](https://moonshotai.github.io/kimi-cli/en/customization/plugins.html).

O executável local reporta Kimi Code 2.5.3 e lista `--skills-dir`, mas seu `kimi --help` não expõe comandos `plugin`. Por isso o pacote plugin permanece experimental e não é declarado funcional neste ambiente; não execute instalação até confirmar que a versão/instalação local possui o gerenciador.

## Limites

- Nenhuma instalação global foi executada.
- O carregamento da Skill e o hook `sessionStart.skill` ainda precisam de smoke test em sessão real.
- O plano ASES é somente leitura; copiar a Skill é uma decisão do usuário do workspace.
