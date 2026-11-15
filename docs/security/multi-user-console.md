# Console web local com múltiplos usuários

`startLocalConsole()` expõe o dashboard em `127.0.0.1` com login por contas configuradas pelo operador. Senhas são verificadas com scrypt; sessões opacas têm expiração e podem ser revogadas no logout. Cookies são `HttpOnly`, `SameSite=Strict`, sem persistência, e os POSTs exigem origem same-origin. Tentativas de login têm rate limit. O bind é fixo em loopback, sem opção para expor autenticação local pela rede.

Cada usuário recebe membership explícito por organização/repositório: `reader` acessa apenas leitura, `contributor` pode solicitar escrita e `admin` também pode solicitar administração. `createConsoleAuth().authorize()` verifica o token de sessão ativo em cada ação e falha fechado para membership ausente. O host precisa usar essa função para autorizar toda operação protegida; a rota de acesso do console demonstra o gate.

```ts
import { hashConsolePassword, readDashboardData, renderDashboardHtml, startLocalConsole } from "@eureka42/ases-cli";

const passwordHash = await hashConsolePassword(process.env.ASES_CONSOLE_PASSWORD!);
const consoleServer = await startLocalConsole({
  users: [{
    principalId: "operator-1",
    username: "operator@example.test",
    displayName: "Operator",
    passwordHash,
    memberships: [{ organizationId: "acme", repositoryId: "ases", role: "reader" }],
  }],
  renderDashboard: async () => renderDashboardHtml(await readDashboardData(process.cwd())),
});
console.log(consoleServer.url);
```

Não grave senhas em código ou no repositório. A função de hash deve ser usada no provisionamento e a saída guardada em configuração local protegida. O dashboard renderer precisa escapar os dados do projeto antes de gerar HTML.

Este é um servidor local embutível, não um produto hospedado: contas/memberships vêm do host, não há fluxo de cadastro, SSO, armazenamento persistente de sessões, MFA, gestão central de políticas, execução de ações do dashboard, ou deploy público. Para uso fora de um ambiente single-user confiável, integre um Authorization Server e hospede a interface atrás de uma camada de identidade revisada.
