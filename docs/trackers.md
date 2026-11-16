# Intercâmbio de tarefas com trackers

O comando `tracker` transforma o catálogo local ASES em um bundle JSON portátil e validado. O formato `eureka42-tracker-tasks` é neutro em relação ao provedor. O pacote também exporta importadores programáticos opt-in para GitHub Issues/PRs e GitLab Issues/MRs. Eles só fazem chamadas GET, não sincronizam nem escrevem no serviço remoto.

## Exportar

```sh
ases tracker export ./meu-projeto > tarefas.json
ases tracker export ./meu-projeto --product eureka42 > tarefas-produto.json
```

O export exige um catálogo já importado. Cada requisito vira uma tarefa com ID estável (`ases-req-001`), título, texto fonte, labels de prioridade/classificação, estado normalizado e referência ASES. O bundle inclui `exportedAt` UTC e não inclui evidências locais, segredos ou dados do host. Saída JSON vai para stdout.

## Validar, pré-visualizar e importar

```sh
ases tracker import tarefas.json ./meu-projeto --json
ases tracker import tarefas.json ./meu-projeto --apply --json
```

Sem `--apply`, o CLI valida e retorna a prévia sem escrever. Com `--apply`, grava uma cópia imutável em `.ases/tracker-imports/tarefas.json`; colisão de nome falha, nunca sobrescreve. O bundle deve ter até 5 MiB, ser arquivo regular e usar schema versão 1. IDs duplicados, conteúdo excessivo, status inválido, labels malformadas e URLs de origem que não sejam HTTPS são rejeitados. Caminhos de destino resolvidos fora do workspace são bloqueados.

A importação arquiva tarefas para posterior mapeamento; ela não altera o catálogo de requisitos, não marca itens como implementados e não cria/atualiza issues no serviço remoto. Sincronização bidirecional, autenticação OAuth e operações de escrita em Jira/GitHub/GitLab exigem adaptadores e autorização explícita separados.

## Importação remota opt-in (API TypeScript)

As funções `importGitHubWorkItems` e `importGitLabWorkItems` estão disponíveis pelo pacote `@eureka42/ases-cli`. Não são chamadas automaticamente pelo CLI: o chamador precisa invocá-las e passar `enabled: true` em cada operação. Use um token de acesso de leitura, carregado de um gerenciador de segredos pelo aplicativo chamador; nunca o grave no projeto, bundle ou log.

```ts
import { importGitHubWorkItems } from "@eureka42/ases-cli";

const imported = await importGitHubWorkItems({
  enabled: true,
  owner: "eureka42-ai",
  repository: "ases-framework",
  token: process.env.GITHUB_TOKEN,
  maxPages: 3,
  maxItems: 250,
  timeoutMs: 10_000,
});
console.log(imported.bundle.tasks.length, imported.hasMore);
```

O importador percorre páginas sequencialmente, aplica limites de 100 itens por página, 10 páginas, 1.000 tarefas, 60 segundos por requisição e 2 MiB por página. Retorna `hasMore: true` se o limite interromper a leitura. Token, corpo de erro e detalhes de rede não são incluídos nas mensagens de falha. Apenas URLs HTTPS sem credenciais são aceitas; endpoints self-hosted usam `apiBaseUrl` HTTPS. GitLab aceita ID numérico ou caminho `grupo/subgrupo/projeto`; com ID numérico, cada resposta precisa trazer um `web_url` HTTPS no mesmo host. Os corpos das issues/MRs são conteúdo remoto não confiável; trate-os como dados, nunca como instruções executáveis.

Bundle mínimo:

```json
{
  "schemaVersion": "1",
  "format": "eureka42-tracker-tasks",
  "exportedAt": "2026-11-15T00:00:00.000Z",
  "tasks": [
    {
      "id": "ases-req-001",
      "title": "Exemplo",
      "description": "Critério de aceite...",
      "status": "open",
      "labels": ["p1", "core"],
      "source": { "system": "ases", "id": "REQ-001" }
    }
  ]
}
```
