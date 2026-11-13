# STATUS

Atualizado em: 2026-11-13

## Estado

- M0: IMPLEMENTED / PARTIALLY_VERIFIED
- M1 vertical slice: IMPLEMENTED / VERIFIED_LOCALLY
- Repositório Git: branch `main`; alterações desta etapa pendentes de push
- Fonte diretora: presente e lida
- ASES-300: DOCX original de trabalho e conversão Markdown presentes; importador local verificou 300 IDs; fidelidade da conversão ainda requer revisão.
- ASES-500 separado: consolidação presente como reconstrução para validação; original independente ausente e homologação pendente.
- Publicação: NOT_AUTHORIZED

## Implementação atual

- Monorepo TypeScript strict criado.
- CLI vertical slice implementado: `help`, `--version`, `init`, `doctor`, `config validate`.
- `config explain` implementado; `doctor` ampliado para Git, npm e pnpm.
- Schema inicial publicado localmente em `schemas/ases.config.schema.json`.
- README completo e assets oficiais da marca organizados em `docs/assets/brand/`.
- Identidade ANSI teal/verde disponível em `ases welcome` e na ajuda.
- Entrevista inicial implementada com tipo de aplicativo, linguagem, hospedagem, banco, escala e dados sensíveis.
- Recomendações ausentes ficam `PROPOSED`; escolhas existentes ficam `REVIEW_REQUIRED`.
- Integrações experimentais criadas para Codex, Claude Code, Kimi Code CLI e Gemini CLI.
- Hosts locais detectados: Codex 0.167.2, Claude Code 2.1.323, Kimi 2.5.3 e Gemini 0.42.0.
- `init` possui `--dry-run`, saída JSON e proteção contra sobrescrita.
- Dependências de desenvolvimento instaladas; `package-lock.json` gerado pelo npm como bootstrap enquanto o pnpm não está ativado.
- Build TypeScript strict: PASS.
- Testes unitários: PASS (10/10).
- Manifests/Skills locais: PASS (3 manifests, 5 Skills).
- Claude plugin validator: manifest/commands válidos; publicação no diretório bloqueada pela ausência de licença aprovada.
- Gemini extension validator: PASS.
- `npm pack` + instalação do tarball + execução de `ases --version` e `init --dry-run --json`: PASS.
- Backlog AFR-001..140: gerado em YAML com IDs preservados; critérios permanecem DRAFT e precisam ser refinados por incremento.
- Fontes recebidas em `FONTES_ASES_PARA_DESKTOP_FRAMEWORK/`; SHA-256 dos seis arquivos listados validado.
- Matriz Eureka42 segregada; REQ-301..500 mantidos como referência específica de domínio.
- Importador ASES-300 implementado; grava catálogo por workspace com hash e textos dos requisitos.
- `ases requirements list/show` implementados para catálogo importado.
- Importação real da fonte local: PASS; 300 itens, SHA-256 `22e439ea514e1f365d3611a8644aac861f8c739054f8c35084a0e94e30302314`.
- Ciclo de estados ASES-300 implementado; `VERIFIED` exige arquivo local dentro do workspace, calcula SHA-256, e `N_A` exige justificativa; histórico de transições mantido.
- Testes: 11/11 PASS; validadores de integração: PASS.
- Validação host nesta rodada: Claude `--strict` schema válido com requisito de licença apontado; Gemini extension PASS; manifests e Skills locais PASS; sessões interativas ainda pendentes.
- Validação continuada: `npm test` 11/11 PASS; `git diff --check` PASS; `kimi doctor` PASS para configuração local (não é validação do plugin).
- Gemini local link: aguardando confirmação do usuário no prompt de confiança do workspace.
- O usuário permitiu confiar no workspace Gemini; a instalação foi cancelada no segundo aviso de segurança, que explica a injeção de instruções e instalação da Skill. `gemini extensions list` confirmou que nada foi instalado.
- Claude Code oferece `--plugin-dir` para carga local temporária; teste em sessão sem inferência ainda não concluído.
- Claude `plugin test` não executou porque o adapter não está instalado; não houve instalação automática.

## Próximas tarefas READY

1. Migrar o lockfile para pnpm quando o Corepack/pnpm estiver disponível e repetir a suite congelada.
2. Refinar critérios de aceite dos AFRs escolhidos para M1 e ligar testes/artefatos.
3. Implementar resolução de defaults, projeto, ambiente e flags sem expor secrets.
4. Testar instalação/descoberta das integrações em sessões descartáveis dos quatro hosts.
5. Prosseguir a entrevista com personas, autenticação, integrações, observabilidade e critérios de aceite.

## Bloqueios de conclusão integral

- A conversão ASES-300 requer revisão contra o DOCX antes de declarar o catálogo homologado.
- O original independente ASES-500 não foi localizado; a consolidação permanece reconstrução para validação.
- Evidências são verificadas na gravação; detecção posterior de obsolescência por mudanças no código ainda não implementada.
- A licença/copyright do software, metodologia e marca não foi aprovada; não é possível finalizar distribuição pública dos plugins.
- Os quatro executáveis de host foram detectados, mas detecção não prova descoberta e execução do plugin em sessão real.
- O roadmap completo M0–M14 é maior que o vertical slice atual; componentes não construídos continuam `PLANNED` ou `NOT_IMPLEMENTED`.

## Evidências

- `evidence/M0-M1-2026-11-13.md`

