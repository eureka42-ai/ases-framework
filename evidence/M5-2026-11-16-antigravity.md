# M5 — Integração Antigravity CLI

Date: 2026-11-16

## Relato recebido do owner

- Produto: Google Antigravity CLI (`agy` 1.5.9), modelo Gemini 4 Argon (Medium).
- O teste não encontrou checkout do repositório, Skill ou executável `ases`; não carregou integração e não verificou a cor do logo nem a primeira pergunta.
- A autenticação estava ativa no ambiente relatado. Nenhum arquivo foi alterado.
- Classificação: tentativa bloqueada antes de testar o produto; não é falha de compatibilidade.

## Implementação feita no repositório

- Criado plugin Antigravity nativo em `integrations/antigravity-cli/` com manifesto oficial `plugin.json`, logo quadrado Eureka42, README de instalação e Skill `ases-project-start`.
- A Skill tem invocação `/ases-project-start`, executa script local de boas-vindas antes da inspeção/perguntas, e não exige publicação ou instalação do pacote npm `ases` para renderizar o logo RGB verde.
- `ases host list` reconhece `agy`; `ases host plan/apply/update/uninstall` instala e remove o plugin no escopo do workspace `.agents/plugins/eureka42-ases/` com o lifecycle existente, `--apply` explícito e manifestos de propriedade.
- Gemini CLI continua no repositório apenas como adapter legado.

## Validação local

- `agy --version`: `1.5.9`.
- `agy plugin validate --strict ./integrations/antigravity-cli`: PASS.
- `node integrations/antigravity-cli/skills/ases-project-start/scripts/welcome.mjs --color`: PASS; saída tem foreground ANSI `38;2;0;190;130` e o logo textual Eureka42.
- Depois da validação inicial, o plugin local foi instalado de forma reversível no perfil Antigravity e `agy plugin list --json` listou `eureka42-ases` enabled com a Skill `ases-project-start`.
- Smoke autenticado em `/private/tmp/ases-antigravity-smoke/ws`, usando `agy --mode plan --dangerously-skip-permissions -p "/ases-project-start ..."`: a sessão executou o helper `welcome.mjs` pelo caminho instalado do plugin, inspecionou o workspace vazio e fez a pergunta de tipo de aplicativo. A resposta informou que recomendações ficam `PROPOSED` e não editou o workspace.
- A primeira tentativa sem autoaprovação de ferramentas não produziu resposta porque o modo headless não podia pedir a permissão de `command`; a segunda execução foi restrita ao workspace vazio, com modo `plan`, e concluiu com exit code 0.

## Contrato oficial consultado

- [Agent Skills](https://antigravity.google/docs/skills): Antigravity CLI descobre skills locais e globais e converte skills em slash commands.
- [Build plugins](https://antigravity.google/docs/build-plugins): `plugin.json`, `skills/`, `assets/`, logo e `agy plugin validate --strict`.
- [Plugins](https://antigravity.google/docs/plugins?tab=cli): plugins locais em `.agents/plugins/` e instalação por caminho local.

AFR-034 atende aos critérios do plugin e do smoke funcional em Antigravity CLI 1.5.9. O plugin permanece instalado no perfil local desta máquina a pedido do owner. O teste foi feito em workspace temporário vazio e não prova comportamento em todos os sistemas operacionais.
