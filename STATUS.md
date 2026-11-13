# STATUS

Atualizado em: 2026-11-13

## Estado

- M0: IMPLEMENTED / PARTIALLY_VERIFIED
- M1 vertical slice: IMPLEMENTED / VERIFIED_LOCALLY
- Repositório Git: inicializado, sem commit criado
- Fonte diretora: presente e lida
- ASES-300: SOURCE_MISSING
- ASES-500 separado: SOURCE_MISSING / VALIDATION_REQUIRED
- Publicação: NOT_AUTHORIZED

## Implementação atual

- Monorepo TypeScript strict criado.
- CLI vertical slice implementado: `help`, `--version`, `init`, `doctor`, `config validate`.
- `init` possui `--dry-run`, saída JSON e proteção contra sobrescrita.
- Dependências de desenvolvimento instaladas; `package-lock.json` gerado pelo npm como bootstrap enquanto o pnpm não está ativado.
- Build TypeScript strict: PASS.
- Testes unitários: PASS (4/4).
- `npm pack` + instalação do tarball + execução de `ases --version` e `init --dry-run --json`: PASS.
- Backlog AFR-001..140: gerado em YAML com IDs preservados; critérios permanecem DRAFT e precisam ser refinados por incremento.

## Próximas tarefas READY

1. Migrar o lockfile para pnpm quando o Corepack/pnpm estiver disponível e repetir a suite congelada.
2. Refinar critérios de aceite dos AFRs escolhidos para M1 e ligar testes/artefatos.
3. Implementar schema JSON público local e `config explain`.
4. Ampliar `doctor` com Git, package manager e permissões, sem rede obrigatória.

## Evidências

- `evidence/M0-M1-2026-11-13.md`

