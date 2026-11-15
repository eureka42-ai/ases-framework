# Evidência CI remoto — provider probe — 2026-11-14

Status: `PASS`

- Commit: `79e68a2` (`add opt-in secret-safe provider probe`), publicado em `main`.
- Execução: [GitHub Actions run 43660391293](https://github.com/eureka42-ai/ases-framework/actions/runs/43660391293).
- Workflow `CI`, evento `push` em `main`; jobs Node.js 22 e Node.js 24 concluíram com resultado global `success`.
- O workflow executou instalação congelada e `pnpm test`, incluindo build, 62 testes e validação das integrações.

A prova é de funcionamento local do probe e dos seus controles de saída; nenhuma API de provider foi chamada no CI.
