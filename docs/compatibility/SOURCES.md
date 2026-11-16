# Compatibility Sources

Verificadas em 2026-11-16:

- OpenAI Skills: https://developers.openai.com/plugins/concepts/skills — `SKILL.md`, recursos progressivos e separação entre workflow e MCP.
- OpenAI Docs MCP: https://developers.openai.com/resources/docs-mcp — servidor de documentação read-only e configuração MCP atual.
- MCP 2026-07-28: https://blog.modelcontextprotocol.io/posts/2026-07-28/ — protocolo moderno, cabeçalhos de transporte e modelo stateless; implementado via SDK oficial.
- MCP TypeScript SDK authorization: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/serving/authorization.md — OAuth Resource Server, bearer challenges, RFC 7662 verifier, audience binding, scopes e metadata RFC 9728/8414 consultados para AFR-088.
- MCP TypeScript SDK packages: https://github.com/modelcontextprotocol/typescript-sdk — `@modelcontextprotocol/server` 2.4.0, `@modelcontextprotocol/express` 2.0.2 e `@modelcontextprotocol/node` 2.1.2; peer ranges verificados no registry e transporte HTTP implementado via adaptadores oficiais.
- Agent Skills: https://agentskills.io/specification — validação detalhada pendente antes de gerar Skills distribuíveis.
- Kimi Code CLI Plugins: https://moonshotai.github.io/kimi-cli/en/customization/plugins.html — pacote `kimi.plugin.json` e estado Beta verificados; comandos reais dependem da versão do CLI.
- Kimi Code CLI Skills: https://moonshotai.github.io/kimi-cli/en/customization/skills.html — descoberta de Skills em `.agents/skills/` e `--skills-dir` verificados.
- Gemini CLI Extension Reference: https://geminicli.com/docs/extensions/reference/ — `gemini-extension.json`, Skills, commands e temas verificados documentalmente.
- Google Antigravity Agent Skills: https://antigravity.google/docs/skills — descoberta de Skill no CLI, localização de plugins e conversão automática de Skills em slash commands.
- Google Antigravity Build Plugins: https://antigravity.google/docs/build-plugins — manifesto `plugin.json`, componentes, logo, layout, validação `agy plugin validate --strict` e caminhos de instalação local.
- Google Antigravity CLI Plugins: https://antigravity.google/docs/plugins?tab=cli — instalação local/repositório, listagem, validação e ciclo de vida de plugins no `agy`.
- Codex Skills: https://developers.openai.com/plugins/concepts/skills — Skill com `SKILL.md` e progressive disclosure.
- Claude Code Plugins: https://code.claude.com/docs/en/plugins/create — layout, strict validation e carregamento local verificados; inventário no CLI confirmado e execução de Skill em conversa ainda pendente.
- Claude Code Hooks: https://code.claude.com/docs/en/hooks — eventos, stdout/systemMessage e limites de sequências ANSI/OSC consultados; não incluímos hook de startup com injeção de contexto.
- Claude Code Plugin CLI: comandos `marketplace add --scope`, `install --scope`, `uninstall --scope --keep-data` e `marketplace remove --scope` verificados por `claude --help` na versão 2.1.323.
- Claude Code Marketplaces: https://code.claude.com/docs/en/plugins/create-marketplace — marketplace no repositório e instalação local isolada verificados.
- Codex Plugins: https://developers.openai.com/plugins/build/plugins — manifest portátil `plugin.json`, onboarding Skill, assets de interface, marketplaces locais e comandos de instalação documentados; pacote do repositório estruturado, smoke isolado e sessão real pendentes.

Nenhum host foi marcado `SUPPORTED`.

