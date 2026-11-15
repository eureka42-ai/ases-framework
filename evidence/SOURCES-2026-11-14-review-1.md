# ASES source review progress 1

Date: 2026-11-14 (America/Sao_Paulo)

## Integrity and structure

- `shasum -a 256 -c SHA256SUMS.txt`: all six source files PASS.
- Existing structural comparison: the ASES-300 DOCX and Markdown contain all 300 requirement IDs and matching titles. Paragraph regrouping, table extraction, and Word formatting still prevent a claim of semantic equivalence from the current automated comparison.
- Rendered the original ASES-300 DOCX with the bundled document renderer to 303 page PNGs plus PDF in `/private/tmp/ases300-full-review`; the source itself was not modified.
- Current visual inspection reconfirmed pages 1, 4, 17, 33, 188 and 303. Earlier review evidence records 14 sampled pages; this work does not claim a manual visual inspection of every rendered page.

## Concrete findings

- DOCX page 4 still contains “Atualize o campo no Word para gerar o sumário.”
- DOCX page 33's pseudocode block has unusual alignment that requires author/editor comparison and correction.
- DOCX page 303 explicitly calls for final bibliography review, updating the Word table of contents, comprehensive proofreading, and cross-checking the 300 requirements. It describes ASES-300 as the author's proposed method, not an externally recognized standard.
- ASES-500 remains a Markdown consolidation explicitly labeled reconstruction; no independent original is included in the source bundle.
- Eureka42 REQ-301..500 materials remain product-specific references and are not part of universal ASES-300.

## Conclusion

Integrity and structural checks pass, but neither source is homologated for public distribution. The ASES-300 author must complete or approve the listed editorial work. For ASES-500, the owner must provide the independent original or explicitly approve the reconstruction as the authoritative release text.
