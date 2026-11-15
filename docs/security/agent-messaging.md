# Mensageria local A2A

`createAgentMessageBus()` fornece um canal de mensagens em memória entre agentes registrados em um único projeto. Não abre socket, não descobre agentes remotamente e não executa o payload recebido. Cada agente recebe um handle fixado à própria identidade; uma ACL explícita precisa autorizar par emissor/receptor, projeto e tipo de mensagem. Falta de regra é deny.

```ts
import { createAgentMessageBus } from "@eureka42/ases-cli";

const bus = createAgentMessageBus({
  projectId: "demo-project",
  agents: ["planner", "builder"],
  acl: [{ fromAgent: "planner", toAgent: "builder", projectId: "demo-project", messageTypes: ["task.request"] }]
});

const planner = bus.agent("planner");
const builder = bus.agent("builder");
planner.send("builder", "task.request", { task: "inspect tests" });
const item = builder.receive(); // trust === "untrusted-data"
```

O protocolo v1 inclui IDs de mensagem/conversa, escopo de projeto, tipo, timestamps e expiração. Payload precisa ser JSON serializável e respeita limite de bytes; TTL máximo é uma hora e as filas têm limite configurável. Payloads são dados não confiáveis e precisam passar por policy/autorização própria antes de qualquer ação. A implementação não oferece rede, autenticação entre processos nem entrega persistente; para A2A entre máquinas, use um transporte autenticado externo que preserve esse isolamento.
