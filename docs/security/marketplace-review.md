# Revisão de segurança dos marketplaces

O repositório publica manifestos de primeira parte para Claude Code e Codex, além dos pacotes de integração para Kimi e Gemini. `marketplace-review.json` registra a decisão e os achados da revisão interna do conteúdo que os hosts carregam: marketplaces, manifests, entrypoints e Skills compartilhadas.

O gate `pnpm integrations:validate` exige um registro `APPROVED`, verifica os achados, exige a lista completa de artefatos cobertos e recalcula cada SHA-256. Uma mudança nesses arquivos falha no CI até que o conteúdo passe por revisão e o registro seja renovado. Achados `HIGH` e `CRITICAL` não podem ser aceitos sem mitigação.

O registro atual aprova somente os plugins de primeira parte presentes neste repositório e fixa os hashes revisados. A revisão identifica que instruções podem invocar o CLI no workspace e que instalação/carregamento continuam sob controle do host e do usuário. Operações que escrevem no projeto devem continuar exigindo confirmação explícita. Alterações em permissões, comandos, fontes, distribuição ou comportamento exigem nova revisão.

Esta é uma revisão interna de metadados e instruções; não equivale a auditoria independente de código, atestado de segurança da plataforma Claude/Codex/Kimi/Gemini, análise de dependências completa do host, nem valida releases futuros. As dependências de produção são verificadas separadamente pelo pipeline de supply-chain.
