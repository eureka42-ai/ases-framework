# Regressão por impacto e mutation testing

`analyzeCodeImpact` constrói um grafo reverso de imports JS/TS e encontra os testes candidatos aos arquivos alterados. `runMutationCampaign` usa esses candidatos para executar uma baseline e uma campanha limitada de mutantes AST em comparações e literais booleanos/inteiros.

O executor dos testes é fornecido pelo aplicativo hospedeiro. A campanha entrega os caminhos de teste e um overlay de fonte em memória ao callback; ela não escreve no workspace, não abre shell e não inicia comandos por conta própria. Implemente o callback com checkout/sandbox temporário e chame seu test runner com argumentos estruturados. Retorne `passed: false` quando os testes executados falharem; exceções e resultados sem lista de testes são contabilizados como erro de execução. A baseline deve passar antes de qualquer mutante ser analisado.

```ts
import { runMutationCampaign } from "@eureka42/ases-cli";

const report = await runMutationCampaign(workspace, ["src/access.ts"], async ({ testFiles, sourceOverrides }) => {
  // A aplicação cria um sandbox temporário, aplica somente sourceOverrides,
  // executa testFiles sem shell e remove o sandbox em finally.
  const result = await isolatedTestRunner({ workspace, testFiles, sourceOverrides });
  return { passed: result.exitCode === 0, executedTests: result.executedFiles };
}, { maxMutants: 50 });
console.log(`${report.killed}/${report.generated} mutantes mortos (${report.score ?? "n/a"}%)`);
```

`maxMutants` aceita 1–200 (padrão 50); arquivos alterados aceitam no máximo 256 KiB para a geração. A campanha rejeita sintaxe inválida, ausência de testes impactados, baseline com falha e callbacks que não comprovem os testes realmente executados. Relatório inclui mutantes mortos, sobreviventes e erros, com score calculado somente sobre execuções classificadas. É uma técnica complementar: o score não mede cobertura completa, e o conjunto AST atual é deliberadamente limitado.
