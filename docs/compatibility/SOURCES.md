# Compatibility Sources

Verificadas em 2026-11-14:

- OpenAI Skills: https://developers.openai.com/plugins/concepts/skills — `SKILL.md`, recursos progressivos e separação entre workflow e MCP.
- OpenAI Docs MCP: https://developers.openai.com/resources/docs-mcp — servidor de documentação read-only e configuração MCP atual.
- MCP 2026-07-28: https://blog.modelcontextprotocol.io/posts/2026-07-28/ — núcleo stateless e mudanças de autorização; implementação MCP ainda não iniciada.
- Agent Skills: https://agentskills.io/specification — validação detalhada pendente antes de gerar Skills distribuíveis.
- Kimi Code CLI Plugins: https://moonshotai.github.io/kimi-cli/en/customization/plugins.html — pacote `kimi.plugin.json` e estado Beta verificados; comandos reais dependem da versão do CLI.
- Kimi Code CLI Skills: https://moonshotai.github.io/kimi-cli/en/customization/skills.html — descoberta de Skills em `.agents/skills/` e `--skills-dir` verificados.
- Gemini CLI Extension Reference: https://geminicli.com/docs/extensions/reference/ — `gemini-extension.json`, Skills, commands e temas verificados documentalmente.
- Codex Skills: https://developers.openai.com/plugins/concepts/skills — Skill com `SKILL.md` e progressive disclosure.
- Claude Code Plugins: https://code.claude.com/docs/en/plugins/create — layout, strict validation e carregamento local verificados; inventário no CLI confirmado e execução de Skill em conversa ainda pendente.
- Claude Code Hooks: https://code.claude.com/docs/en/hooks — eventos, stdout/systemMessage e limites de sequências ANSI/OSC consultados; não incluímos hook de startup com injeção de contexto.
- Claude Code Plugin CLI: comandos `marketplace add --scope`, `install --scope`, `uninstall --scope --keep-data` e `marketplace remove --scope` verificados por `claude --help` na versão 2.1.323.
- Claude Code Marketplaces: https://code.claude.com/docs/en/plugins/create-marketplace — marketplace no repositório e instalação local isolada verificados.
- Codex Plugins: https://developers.openai.com/plugins/build/plugins — manifest portátil `plugin.json`, onboarding Skill, assets de interface, marketplaces locais e comandos de instalação documentados; pacote do repositório estruturado, smoke isolado e sessão real pendentes.

Nenhum host foi marcado `SUPPORTED`.

