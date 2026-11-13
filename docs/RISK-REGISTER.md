# Risk Register

| ID | Risco | Estado | Mitigação |
|---|---|---|---|
| RISK-001 | Fontes normativas ausentes | OPEN | Bloquear alegações normativas e trabalhar apenas no core técnico. |
| RISK-002 | pnpm indisponível sem rede | OPEN | Manter manifesto pnpm e validar temporariamente com npm quando dependências estiverem disponíveis. |
| RISK-003 | Node 26 ainda sem matriz comprovada | OPEN | Não declarar suporte; testar versões LTS em CI futura. |
| RISK-004 | Config JSON divergir do YAML proposto | OPEN | Tratar JSON como bootstrap reversível e definir ADR antes da API estável. |

