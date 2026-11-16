# EUREKA42 ASES para Claude Code

Plugin local de descoberta de projeto e início do workflow ASES. Ele contém a Skill `ases-project-start` e o comando `/eureka42-ases:ases-start`. A skill começa pela identidade Eureka42, inspeciona decisões existentes e registra sugestões como `PROPOSED` até confirmação humana.

## Usar diretamente do checkout

Valide o plugin e carregue-o somente na sessão que você iniciar:

```sh
claude plugin validate ./integrations/claude-code --strict
claude --plugin-dir ./integrations/claude-code
```

O plugin inclui um script de boas-vindas independente da CLI npm em `scripts/welcome.mjs`. Assim, `/eureka42-ases:ases-start` consegue mostrar o logo em verde mesmo antes de instalar ou publicar o pacote `ases`. O comando tenta primeiro `ases welcome --color` e usa o script local do plugin como fallback.

Para o smoke conversacional, o Claude Code precisa estar autenticado. Confira com `claude auth status`; se `loggedIn` for `false`, abra o Claude Code e execute `/login`. Depois inicie o checkout com `claude --plugin-dir ./integrations/claude-code`.

Dentro do Claude Code, execute `/eureka42-ases:ases-project-start` ou `/eureka42-ases:ases-start`. O primeiro comando do plugin deve mostrar o logo verde Eureka42 no terminal antes da entrevista.

## Instalar pelo marketplace deste repositório

Use `local` para manter a instalação restrita ao checkout atual. Os comandos abaixo não adicionam o marketplace nem o plugin às configurações globais do usuário:

```sh
claude plugin marketplace add eureka42-ai/ases-framework --scope local
claude plugin install eureka42-ases@eureka42-ases-plugins --scope local
claude plugin list
```

Para remover depois:

```sh
claude plugin uninstall eureka42-ases@eureka42-ases-plugins --scope local --keep-data
claude plugin marketplace remove eureka42-ases-plugins --scope local
```

`--keep-data` preserva os dados persistentes do plugin. Para compartilhar a instalação com todas as pessoas deste repositório, escolha explicitamente `--scope project`; para instalar no perfil de todas as pastas, escolha explicitamente `--scope user`. Sem `--scope`, o CLI pode usar o escopo `user` como padrão.

## CLI opcional e MCP

O plugin funciona como instrução mesmo sem a CLI `ases`. Para persistir entrevista e consultar o catálogo ASES, instale a CLI conforme o README da raiz. A conexão MCP é uma etapa separada e opt-in:

```sh
claude mcp add --scope project eureka42-ases -- ases mcp .
claude mcp list
```

Isso grava configuração MCP no projeto. O servidor expõe apenas ferramentas de leitura do catálogo; ele não edita código nem instala integrações.

## Limites conhecidos

- A compatibilidade em sessão e o logo verde ainda precisam ser confirmados executando `/eureka42-ases:ases-start` dentro de uma sessão autenticada do Claude Code.
- A validação do manifesto não publica o plugin no diretório da Anthropic.
- O script local cobre somente a identidade visual; recursos de entrevista persistente continuam dependendo da CLI `ases`.
