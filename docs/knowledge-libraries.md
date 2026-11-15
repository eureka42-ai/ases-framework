# Bibliotecas de conhecimento curadas

O CLI inclui `eureka42-ases-foundations` (v1.0.0), um pack original mantido pelo Eureka42 ASES Framework e distribuído sob Apache-2.0, alinhado à licença do repositório. Seu manifesto registra criador, base dos direitos, data de revisão, versão, licença SPDX e a citação de cada documento. O instalador calcula SHA-256 de cada fonte e preserva licença/versão em cada chunk do índice lexical RAG.

```sh
ases knowledge list
ases knowledge validate eureka42-ases-foundations --json
ases knowledge install eureka42-ases-foundations ./meu-projeto --project-id meu-projeto --dry-run
ases knowledge install eureka42-ases-foundations ./meu-projeto --project-id meu-projeto --apply --json
```

O pack cobre fundamentos ASES (decisões humanas, menor privilégio, default-deny, proveniência e privacidade) e práticas de entrega verificável. O índice e os documentos permanecem no workspace em `.ases/knowledge/` e `.ases/rag/`; não há downloads nem chamadas remotas. A instalação exige `--apply`, não sobrescreve uma instalação existente, rejeita diretórios `.ases` symlinkados e desfaz os arquivos do pack recém-criados se o processo falhar.

Licença declarada não substitui revisão jurídica ou validação de titularidade para conteúdo de terceiros. Este pack inicial contém texto original do projeto, não cópias de normas, livros ou documentação externa. Outros packs precisam declarar uma licença SPDX aprovada, titularidade/proveniência, versão e citação por fonte antes de serem adicionados.
