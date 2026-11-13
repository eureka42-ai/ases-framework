# Risk Register

| ID | Risco | Estado | Mitigação |
|---|---|---|---|
| RISK-001 | Fontes normativas ausentes | OPEN | Bloquear alegações normativas e trabalhar apenas no core técnico. |
| RISK-002 | pnpm indisponível sem rede na instalação inicial | MITIGATED | pnpm 10.20.0 fixado com lockfile congelado; primeira instalação ainda requer dependências no registry ou cache local. |
| RISK-003 | Node 26 ainda sem matriz comprovada | OPEN | Não declarar suporte; testar versões LTS em CI futura. |
| RISK-004 | Config JSON divergir do YAML proposto | OPEN | Tratar JSON como bootstrap reversível e definir ADR antes da API estável. |

