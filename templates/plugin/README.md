# Template de plugin ASES

Copie este diretório para iniciar um plugin. Atualize o manifesto, gere a integridade SHA-256 do entrypoint e mantenha o `apiVersion` compatível com o runtime ASES. Não peça permissões desnecessárias. Expansões em relação a uma instalação existente exigem aprovação explícita.

Instale as ferramentas de desenvolvimento e execute `pnpm test` para rodar os contract tests do plugin. No pacote consumidor, use `validatePluginManifest()` antes de carregar o entrypoint e `validatePluginContract()` antes de registrar ferramentas. O validador nunca executa o código do plugin.

O template é um exemplo de desenvolvimento, não uma chave de assinatura nem uma fonte confiável por si só. O runtime deve configurar sua lista explícita de fontes confiáveis.
