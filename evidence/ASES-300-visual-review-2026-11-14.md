# Revisão visual amostral ASES-300 — 2026-11-14

Status: `PARTIAL_VISUAL_REVIEW / HOMOLOGATION_PENDING`

## Escopo e método

- Fonte DOCX: `FONTES_ASES_PARA_DESKTOP_FRAMEWORK/originais/ASES-300_COMPLETO_Capitulos_1_a_25_ABNT.docx`
- Conversão Markdown: `FONTES_ASES_PARA_DESKTOP_FRAMEWORK/markdown/ASES-300_DOCUMENTACAO_INTEGRAL.md`
- PDF renderizado para inspeção: 303 páginas, tamanho Letter, Tagged PDF.
- Renderização feita com `documents:documents` e o runtime LibreOffice/Python fornecido pelo ambiente; PDF e PNGs ficaram em `/tmp/ases300-review`, fora do repositório.
- Páginas inspecionadas visualmente: 1, 4, 17, 18, 33, 34, 188, 244, 259, 299, 300, 301, 302 e 303 (14 páginas).
- Verificação estrutural anterior: 300 IDs e títulos sem lacunas/duplicatas no Markdown e correspondência de títulos; ver `ASES-300-markdown-structure-review-2026-11-13.md`.

## Achados

1. **Sumário sem conteúdo finalizado.** Na página 4 do DOCX renderizado, abaixo de “SUMÁRIO”, aparece a instrução “Atualize o campo no Word para gerar o sumário.” O Markdown possui o cabeçalho `# SUMÁRIO`, mas não contém uma lista de capítulos nesse ponto. É uma pendência editorial visível nas duas representações, não prova de perda de requisito. O campo precisa ser atualizado no documento de publicação e a conversão deve incluir o sumário ou declarar que não o reproduz.
2. **Amostra do catálogo legível.** As páginas 188, 244, 259 e 299 mostram REQ-001, REQ-150, REQ-190 e REQ-300, respectivamente. Títulos e parágrafos estão legíveis; nesta amostra não há texto cortado nem colisões visíveis. A página 299 encerra REQ-300 e a transição para requisitos específicos de REQ-301.
3. **Tabelas, referências e encerramento.** Páginas 17–18 e 300–303 foram legíveis na escala inspecionada, sem corte evidente. A página 17 tem espaçamento apertado entre o quadro-síntese e o próximo subtítulo; merece revisão editorial de paginação, mas não foi observado conteúdo sobreposto.
4. **Página 33.** O bloco de código/pseudocódigo aparenta recuo/alinhamento incomum. Não foi possível determinar nesta revisão amostral se o efeito já está no DOCX de origem ou decorre da conversão/renderização; requer comparação específica antes de qualquer correção.

## Integridade das fontes

Hashes SHA-256 observados nesta revisão:

| Arquivo | SHA-256 |
|---|---|
| DOCX ASES-300 | `944b83104dab1224c4d43508cc04ef4b3029713a51f81c35e92278735ec5c240` |
| Markdown ASES-300 | `22e439ea514e1f365d3611a8644aac861f8c739054f8c35084a0e94e30302314` |

A verificação anterior do manifesto completo de fontes foi executada com `shasum -a 256 -c SHA256SUMS.txt`; os seis arquivos listados passaram. As fontes locais seguem fora da publicação Git conforme configuração atual.

## Conclusão e pendências

A amostra visual não identificou truncamentos nas páginas verificadas e reforça o resultado estrutural anterior. Ainda não homologa a conversão: 14 páginas não representam as 303 páginas nem permitem atestar equivalência semântica integral. Antes de marcar a fonte como homologada, é necessário finalizar o sumário, comparar o bloco da página 33 no DOCX e Markdown, e fazer revisão editorial sistemática dos trechos reformatados (incluindo tabelas e exemplos). O documento-fonte não foi alterado.
