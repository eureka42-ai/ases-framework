# Catálogo local de agentes comunitários

`createCommunityAgentCatalog()` indexa releases de agentes declaradas pelo host. Cada release inclui ID, versão SemVer, publicador, fonte, compatibilidade da API, categorias, capabilities e permissões declaradas. A consulta pode filtrar texto, categoria, capability e compatibilidade com a API do runtime.

```ts
import { createCommunityAgentCatalog } from "@eureka42/ases-cli";

const catalog = createCommunityAgentCatalog(releases, {
  runtimeApiVersion: "1.3.0",
  trustedSources: ["https://registry.example/agents"],
});

const matches = catalog.list({ category: "testing", compatibleOnly: true });
const versions = catalog.versions("test-writer");
const latestCompatible = catalog.latest("test-writer");
```

O campo `trust` indica correspondência exata entre a origem publicada na release e as fontes explicitamente confiadas pelo host. A descoberta e a leitura dos metadados não autenticam o publicador, baixam artefatos, concedem permissões, instalam nem executam código. Antes de instalação, o host precisa verificar procedência e integridade do artefato e obter aprovação para as permissões. O catálogo é local; não existe ainda serviço público de registro ou sincronização remota.

As versões são ordenadas por SemVer, incluindo versões de pré-lançamento; `latest()` retorna a maior versão compatível com a API atual. Listagens devolvem cópias para que alterações do consumidor não modifiquem o índice.
