# Registro local de incidentes e SLA

`createSupportLedger()` implementa um ledger em memória com metas por severidade P1–P4, prazos de primeira resposta e resolução, transições `OPEN → ACKNOWLEDGED → RESOLVED` e cálculo de atrasos. A função `list()` recalcula os prazos relativos ao relógio atual; cada incidente mantém somente título, severidade, atores, horários e eventos de transição.

```ts
import { createSupportLedger, type SlaPolicy } from "@eureka42/ases-cli";

const policy: SlaPolicy = {
  P1: { firstResponseMinutes: 5, resolutionMinutes: 30 },
  P2: { firstResponseMinutes: 15, resolutionMinutes: 120 },
  P3: { firstResponseMinutes: 60, resolutionMinutes: 480 },
  P4: { firstResponseMinutes: 240, resolutionMinutes: 1440 },
};

const support = createSupportLedger(policy);
const incident = support.open({ title: "API unavailable", severity: "P1", actorId: "oncall" });
support.acknowledge(incident.id, "responder");
```

O ledger valida política e transições, não permite reabrir item encerrado e mantém snapshots devolvidos separados do estado interno. Ele não persiste após o processo, não envia alertas, não oferece portal de clientes, nem representa um contrato de serviço ou ferramenta de suporte gerenciada. O host responsável precisa escolher prazos aprovados, autenticar os atores e conectar a persistência/alertas do ambiente antes de usar em operação empresarial.
