# Isolamento multi-repositório e multi-organização

`createRepositoryRegistry()` cria um registry somente leitura de configuração para operações locais. Cada repositório pertence a um par exato organização/repositório e cada membership associa um principal a um papel naquele repo. Não existem concessões implícitas por organização nem curingas.

```ts
import { createRepositoryRegistry } from "@eureka42/ases-cli";

const registry = await createRepositoryRegistry(
  [{ organizationId: "eureka42", repositoryId: "ases-framework", root: "/work/ases-framework" }],
  [{ principalId: "reviewer-1", organizationId: "eureka42", repositoryId: "ases-framework", role: "reader" }]
);

const plan = await registry.authorize("reviewer-1", "eureka42", "ases-framework", "read", "README.md");
```

Papéis: `reader` permite somente `read`; `contributor` permite `read`/`write`; `admin` também permite `admin`. A listagem retorna apenas repositórios com membership explícito. Todos os diretórios raiz são realpathed na criação; raízes iguais ou aninhadas são recusadas para impedir sobreposição de fronteiras. Resolução de caminho usa a guarda do workspace e rejeita traversal ou symlink para fora do repo. IDs desconhecidos e operações sem papel suficiente retornam a mesma mensagem de negação para reduzir vazamento de existência.

O registry é local e em memória; não fornece autenticação empresarial/SSO, sincronização centralizada de memberships nem execução remota. O host precisa autenticar o principal antes de chamar `authorize` e ainda executar a operação autorizada usando o caminho retornado dentro da mesma fronteira.
