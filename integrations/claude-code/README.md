# EUREKA42 ASES para Claude Code

Plugin local de descoberta de projeto e início do workflow ASES. Ele contém a Skill `ases-project-start` e o comando `/eureka42-ases:ases-start`. A skill começa pela identidade Eureka42, inspeciona decisões existentes e registra sugestões como `PROPOSED` até confirmação humana.

## Usar diretamente do checkout

Valide o plugin e carregue-o somente na sessão que você iniciar:

```sh
claude plugin validate ./integrations/claude-code --strict
claude --plugin-dir ./integrations/claude-code
```

Dentro do Claude Code, execute `/eureka42-ases:ases-project-start` ou `/eureka42-ases:ases-start`.

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

- Compatibilidade carregada em sessão só é confirmada após verificar a Skill e executar `/eureka42-ases:ases-start` dentro do Claude Code.
- A validação do manifesto não publica o plugin no diretório da Anthropic.
- A licença de distribuição do projeto ainda aguarda decisão Eureka42.
