# Impacto semântico local no código

O comando `ases code impact <workspace> <arquivo-alterado...> [--json]` analisa imports e exports de JavaScript/TypeScript com o parser AST do TypeScript, percorre dependentes transitivos e sugere testes candidatos. A saída JSON inclui os arquivos alterados, dependentes, testes, imports relativos não resolvidos, erros sintáticos e quantidade de arquivos analisados.

```sh
ases code impact . packages/api/src/user.ts
ases code impact . packages/api/src/user.ts --json
```

A análise é offline e não executa código, scripts de build, Language Server ou testes. O grafo cobre imports/exports estáticos, `import()` e `require()` com specifier literal. Import aliases configurados em `tsconfig`, referências dinâmicas construídas em runtime e dependências externas não são resolvidos; use a saída como seleção candidata e mantenha o pipeline completo como autoridade de regressão.

Por padrão, o scanner limita a 5.000 fontes e 1 MiB por arquivo, ignora diretórios gerados/dependências comuns e não segue symlinks. O resultado não certifica que um teste cobre semanticamente o comportamento alterado, nem substitui o TypeScript Language Server completo.
