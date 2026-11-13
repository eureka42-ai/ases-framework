# STATUS

Atualizado em: 2026-11-13

## Estado

- M0: IMPLEMENTED / PARTIALLY_VERIFIED
- M1 vertical slice: IMPLEMENTED / VERIFIED_LOCALLY
- Repositório Git: branch `main`, commits locais e remote Eureka42 sincronizado até `f278b15`
- Fonte diretora: presente e lida
- ASES-300: DOCX original de trabalho e conversão Markdown presentes; 300 IDs documentados no manifesto; fidelidade de conversão ainda requer revisão.
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

## Próximas tarefas READY

1. Migrar o lockfile para pnpm quando o Corepack/pnpm estiver disponível e repetir a suite congelada.
2. Refinar critérios de aceite dos AFRs escolhidos para M1 e ligar testes/artefatos.
3. Implementar resolução de defaults, projeto, ambiente e flags sem expor secrets.
4. Testar instalação/descoberta das integrações em sessões descartáveis dos quatro hosts.
5. Prosseguir a entrevista com personas, autenticação, integrações, observabilidade e critérios de aceite.

## Bloqueios de conclusão integral

- O documento-fonte ASES-300 e a fonte independente ASES-500 não estão neste workspace; não é possível certificar ou popular o catálogo real sem esses documentos.
- A licença/copyright do software, metodologia e marca não foi aprovada; não é possível finalizar distribuição pública dos plugins.
- Os quatro executáveis de host foram detectados, mas detecção não prova descoberta e execução do plugin em sessão real.
- O roadmap completo M0–M14 é maior que o vertical slice atual; componentes não construídos continuam `PLANNED` ou `NOT_IMPLEMENTED`.

## Evidências

- `evidence/M0-M1-2026-11-13.md`

