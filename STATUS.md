# STATUS

Atualizado em: 2026-11-13

## Estado

- M0: IMPLEMENTED / PARTIALLY_VERIFIED
- M1 vertical slice: IMPLEMENTED / VERIFIED_LOCALLY
- Repositório Git: branch `main`; fluxo de entrevista com identidade antes das perguntas, pendente de commit/push
- Fonte diretora: presente e lida
- ASES-300: DOCX e conversão Markdown presentes localmente; revisão estrutural preliminar confirmou 300 IDs/títulos e hashes íntegros; conferência visual/editorial ainda pendente.
- ASES-500 separado: consolidação presente como reconstrução para validação; original independente ausente e homologação pendente.
- Publicação: NOT_AUTHORIZED

## Implementação atual

- Monorepo TypeScript strict criado.
- CLI vertical slice implementado: `help`, `--version`, `init`, `doctor`, `config validate`.
- `config explain` implementado; `doctor` ampliado para Git, npm e pnpm.
- `config explain` resolve defaults, arquivo, variáveis ASES allowlistadas e `--set` com precedência explícita; segredos fora da allowlist não são lidos nem impressos.
- Schema inicial publicado localmente em `schemas/ases.config.schema.json`.
- README completo e assets oficiais da marca organizados em `docs/assets/brand/`.
- Identidade ANSI teal/verde disponível em `ases welcome` e na ajuda.
- Entrevista inicial implementada com tipo de aplicativo, linguagem, hospedagem, banco, escala e dados sensíveis.
- O fluxo interativo apresenta a marca antes das perguntas; a saída `--json` exige arquivo `--answers` para preservar JSON válido.
- Recomendações ausentes ficam `PROPOSED`; escolhas existentes ficam `REVIEW_REQUIRED`.
- Integrações experimentais criadas para Codex, Claude Code, Kimi Code CLI e Gemini CLI.
- Hosts locais detectados: Codex 0.167.2, Claude Code 2.1.323, Kimi 2.5.3 e Gemini 0.42.0.
- `init` possui `--dry-run`, saída JSON e proteção contra sobrescrita.
- Gerenciador de pacotes fixado em pnpm 10.20.0; `pnpm-lock.yaml` importado e instalação `--frozen-lockfile` validada.
- Build TypeScript strict: PASS.
- Testes unitários: PASS (19/19) em 2026-11-13; `pnpm test` também compilou TypeScript e validou as integrações.
- Manifests/Skills locais: PASS (3 manifests, 5 Skills).
- Claude plugin validator: manifest/commands válidos; publicação no diretório bloqueada pela ausência de licença aprovada.
- Gemini extension validator: PASS.
- `npm pack` + instalação do tarball + execução de `ases --version` e `init --dry-run --json`: PASS.
- Backlog AFR-001..140: IDs preservados; critérios AFR-001..006 refinados e ligados a código/testes; demais critérios permanecem DRAFT.
- Fontes recebidas em `FONTES_ASES_PARA_DESKTOP_FRAMEWORK/`; SHA-256 dos seis arquivos listados validado.
- Matriz Eureka42 segregada; REQ-301..500 mantidos como referência específica de domínio.
- Importador ASES-300 implementado; grava catálogo por workspace com hash e textos dos requisitos.
- `ases requirements list/show` implementados para catálogo importado.
- Importação real da fonte local: PASS; 300 itens, SHA-256 `22e439ea514e1f365d3611a8644aac861f8c739054f8c35084a0e94e30302314`.
- Ciclo de estados ASES-300 implementado; `VERIFIED` exige arquivo local dentro do workspace, calcula SHA-256, e `N_A` exige justificativa; histórico de transições mantido.
- Validação de evidências resolve caminhos reais e rejeita links simbólicos para fora do workspace; apenas arquivos regulares podem comprovar `VERIFIED`.
- `requirements show/list` recalculam integridade de evidências (`CURRENT`, `STALE`, `MISSING`, `OUTSIDE_WORKSPACE`, `UNVERIFIABLE`); README documenta limites da checagem semântica.
- Testes: 19/19 PASS; incluem piso Node.js declarado, ordem da identidade na entrevista, resolução de configuração, não exposição de valores secretos, diagnóstico corretivo, SHA-256, histórico, `N_A`, rejeição de caminhos externos/symlinks e mudanças/remoções de evidência.
- Parser ASES-300: classificação e prioridade agora são extraídas separadamente quando aparecem na mesma linha; regressão automatizada PASS.
- Validadores de integração: PASS (3 manifests, 5 Skills).
- Validação host nesta rodada: Claude `--strict` schema válido com requisito de licença apontado; Gemini extension PASS; manifests e Skills locais PASS; sessões interativas ainda pendentes.
- Validação continuada anterior: `git diff --check` PASS; `kimi doctor` PASS para configuração local (não é validação do plugin).
- Gemini: usuário autorizou confiança no workspace; recusou o aviso subsequente de instalação/injeção de instruções. `gemini extensions list` confirmou que nada foi instalado.
- Claude Code oferece `--plugin-dir` para carga local temporária; teste em sessão sem inferência ainda não concluído.
- Claude `plugin test` não executou porque o adapter não está instalado; não houve instalação automática.

## Próximas tarefas READY

1. Refinar critérios de aceite dos AFRs escolhidos para M1 e ligar testes/artefatos.
2. Testar instalação/descoberta das integrações em sessões descartáveis dos quatro hosts.
3. Prosseguir a entrevista com personas, autenticação, integrações, observabilidade e critérios de aceite.

## Bloqueios de conclusão integral

- A conversão ASES-300 requer revisão contra o DOCX antes de declarar o catálogo homologado.
- O original independente ASES-500 não foi localizado; a consolidação permanece reconstrução para validação.
- Evidências são comparadas ao SHA-256 ao consultar o catálogo; a validade semântica do conteúdo e a relação automática com mudanças no código ainda não são avaliadas.
- A licença/copyright do software, metodologia e marca não foi aprovada; não é possível finalizar distribuição pública dos plugins.
- Os quatro executáveis de host foram detectados, mas detecção não prova descoberta e execução do plugin em sessão real.
- O roadmap completo M0–M14 é maior que o vertical slice atual; componentes não construídos continuam `PLANNED` ou `NOT_IMPLEMENTED`.

## Evidências

- `evidence/M0-M1-2026-11-13.md`
- `evidence/M1-2026-11-13-progress-2.md`
- `evidence/ASES-300-markdown-structure-review-2026-11-13.md`

