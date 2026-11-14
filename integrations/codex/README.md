# EUREKA42 ASES para Codex

Plugin portátil do Codex com onboarding pela Skill `ases-project-start`. Ele apresenta a identidade EUREKA42 ASES, inspeciona sinais públicos do workspace e conduz a descoberta de produto perguntando, uma de cada vez, o tipo de aplicação, a linguagem, a hospedagem e o banco de dados. Opções já escolhidas são avaliadas; recomendações novas permanecem `PROPOSED` até confirmação humana.

## Instalar pelo marketplace do repositório

Com Codex CLI atualizado e o checkout deste repositório disponível:

```sh
codex plugin marketplace add eureka42-ai/ases-framework
codex plugin add eureka42-ases@eureka42-codex-plugins
codex plugin list
```

O marketplace pode também ser adicionado pelo caminho local do clone, conforme o suporte da versão instalada:

```sh
codex plugin marketplace add /caminho/para/ases-framework
codex plugin add eureka42-ases@eureka42-codex-plugins
```

Depois de instalado, inicie o onboarding pela interface de plugins do Codex ou use a Skill `ases-project-start` em uma conversa. A conversa real depende da configuração de modelo do usuário.

## Remover

```sh
codex plugin remove eureka42-ases@eureka42-codex-plugins
codex plugin marketplace remove eureka42-codex-plugins
```

Os nomes exatos de argumentos e a disponibilidade de marketplaces podem variar entre versões; consulte `codex plugin --help` e `codex plugin marketplace --help` no CLI instalado.

## Desenvolvimento e arquivos

- `plugin.json`: manifesto portátil, metadados de interface e onboarding.
- `skills/ases-project-start/SKILL.md`: fluxo compartilhado com os outros hosts.
- `assets/`: logotipo e ícone do plugin.
- `.agents/plugins/marketplace.json`: catálogo do projeto na raiz do repositório.

O Skill pede para não abrir `.env` ou arquivos de credenciais, não sobrescrever conteúdo sem autorização e não apresentar sugestões como decisões aceitas. Quando o binário `ases` estiver instalado, usa `ases interview` como fluxo determinístico.

## MCP local

O CLI ASES também oferece um servidor MCP local via stdio (`ases mcp <workspace>`). Ele não é incluído como endpoint remoto no manifesto do plugin. Se quiser conectar o servidor manualmente, siga a referência MCP do Codex e revise o comando antes de salvá-lo na configuração pessoal; esse passo altera a configuração do usuário e não é necessário para usar a Skill.

## Estado da integração

O manifesto e a descoberta/execução da Skill precisam ser verificados por versão do Codex. Ter o plugin no marketplace não comprova que uma sessão real carregou e executou o onboarding. Consulte a matriz em [`../README.md`](../README.md) e o estado global em [`../../STATUS.md`](../../STATUS.md).
