# Revisão estrutural preliminar ASES-300 — 2026-11-13

Status: `STRUCTURE_CHECKED / HOMOLOGATION_PENDING`

Os arquivos de fonte permanecem no checkout local e estão explicitamente ignorados pelo Git. Os hashes dos seis arquivos do manifesto passaram em `shasum -a 256 -c SHA256SUMS.txt`.

## Comparação DOCX e Markdown

- DOCX de trabalho: 300 IDs únicos `REQ-001..REQ-300`; existe uma segunda ocorrência de `REQ-190` em texto explicativo, além da seção do catálogo.
- Markdown de trabalho: exatamente 300 títulos de seção `REQ-001..REQ-300`, sem lacunas ou duplicatas.
- Os títulos correspondem para todos os 300 IDs.
- A extração encontrou 3.644 parágrafos DOCX com mais de 25 caracteres; 3.269 tiveram correspondência exata após normalização de Unicode e espaços. Os demais incluem estruturas de tabela, exemplos formatados e texto de campos Word.
- A cobertura de vocabulário global calculada foi 99,85%; essa métrica não preserva ordem, posição nem semântica e não equivale a uma prova de fidelidade.
- Há um exemplo textual `REQ-34X` na prosa Markdown; ele não é título `### REQ-NNN` e não entra no catálogo ASES-300 importado.

## Resultado e limite

A numeração e os títulos do catálogo estão estruturalmente presentes, e os hashes locais estão íntegros. A conversão reagrupa texto de tabelas/modelos e requer conferência visual e editorial contra o DOCX antes de declarar o texto homologado. Esta revisão não transforma a cópia de trabalho em fonte normativa aprovada.
