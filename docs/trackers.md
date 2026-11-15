# Intercâmbio de tarefas com trackers

O comando `tracker` transforma o catálogo local ASES em um bundle JSON portátil e validado. O formato `eureka42-tracker-tasks` é neutro em relação ao provedor: um adaptador de Jira, GitHub ou GitLab pode converter esse bundle para a API correspondente sem acoplar credenciais ou chamadas de rede ao núcleo do CLI.

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
