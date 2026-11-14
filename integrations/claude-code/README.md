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

```sh
claude plugin marketplace add eureka42-ai/ases-framework
claude plugin install eureka42-ases@eureka42-ases-plugins
```

Para remover depois:

```sh
claude plugin uninstall eureka42-ases@eureka42-ases-plugins
claude plugin marketplace remove eureka42-ases-plugins
```

A instalação modifica as configurações locais do Claude Code. Revise as instruções do plugin antes de instalá-lo e escolha o escopo apropriado no assistente `/plugin` quando disponível.

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
