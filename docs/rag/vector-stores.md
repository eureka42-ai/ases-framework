# Vector stores e embeddings

O módulo `vector-store` fornece uma interface comum e quatro backends para aplicações que já produzem embeddings: memória local, pgvector, Qdrant e Cloudflare Vectorize. A escolha do modelo de embeddings continua a cargo do chamador; o ASES não envia texto a modelos nem gera vetores automaticamente. O núcleo lexical do [RAG offline](offline-index.md) segue disponível sem dependências externas.

```ts
import { createLocalVectorStore, createQdrantVectorStore } from "@eureka42/ases-cli";

const local = createLocalVectorStore();
const qdrant = createQdrantVectorStore({
  enabled: true,
  baseUrl: "https://qdrant.example",
  collection: "ases-docs",
  dimension: 1536,
  token: process.env.QDRANT_API_KEY,
});
```

Todos os adapters carregam ID, projeto, caminho de origem, hashes de conteúdo/chunk, licença, versão e ACL por principal. O query aplica isolamento de projeto, ACL, licenças e versões. Embeddings e conteúdo podem ser dados sensíveis: escolha o backend e o serviço compatíveis com a política do projeto e use um token de menor privilégio.

## Uso e limites por backend

- **Local:** cosine determinístico em memória do processo; não persiste nem chama rede.
- **pgvector:** usa função `query(sql, parameters)` injetada pelo aplicativo, SQL parametrizado e nome de tabela validado. Crie previamente uma tabela com `id text PRIMARY KEY`, `embedding vector(<dimension>)` e `metadata jsonb`; habilite a extensão pgvector segundo a [documentação oficial](https://github.com/pgvector/pgvector). Por exemplo, para 1.536 dimensões: `CREATE EXTENSION vector; CREATE TABLE public.ases_vectors (id text PRIMARY KEY, embedding vector(1536) NOT NULL, metadata jsonb NOT NULL);`. A aplicação fornece e controla conexão, migrations, pool, TLS e retry.
- **Qdrant:** chamadas de rede só ocorrem quando o chamador invoca `upsert`, `query` ou `delete`; a construção do adapter exige `enabled: true`, HTTPS e token opcional. O adapter usa `PUT /points`, `POST /points/query` e `POST /points/delete`, IDs UUID derivados por SHA-256 e filtros server-side. Consulte a [API oficial de query points](https://api.qdrant.tech/api-reference/search/query-points).
- **Cloudflare Vectorize:** recebe um binding de Worker injetado; não cria credenciais ou faz chamadas de rede do CLI. O app configura dimensão, índice e índices de metadados para `projectId`, `license` e `version`; ACL por principal é revalidada localmente sobre os resultados. Com `returnMetadata: "all"`, a consulta limita-se a 50 resultados e os metadados a menos de 9 KiB por vetor, abaixo do limite de 10 KiB do serviço. Como o serviço escolhe os candidatos antes da checagem local de ACL, consultas restritas podem retornar menos resultados que o limite pedido. Consulte [API do Vectorize](https://developers.cloudflare.com/vectorize/reference/client-api/) e [filtros de metadados](https://developers.cloudflare.com/vectorize/reference/metadata-filtering/).

## Cloudflare, Supabase e PostgreSQL

O adapter `createCloudflareVectorizeStore` conecta ao Vectorize por binding injetado; o adapter R2 de backup está em [`docs/backup-sync.md`](../backup-sync.md). Para PostgreSQL gerenciado pelo Supabase, use `createPgVectorStore` com uma função `query` ligada ao cliente/pool Postgres já configurado pelo aplicativo. Esse caminho usa SQL parametrizado, tabela pgvector e preserva ACL/proveniência; o framework não escolhe nem instala SDK, não lê variáveis de ambiente e não abre conexões por conta própria. A aplicação configura credenciais, TLS, migrations e políticas de rede. Exemplo de composição:

```ts
import { createPgVectorStore } from "@eureka42/ases-cli";
import { pool } from "./database.js"; // conexão PostgreSQL/Supabase configurada pela aplicação

const vectors = createPgVectorStore({
  dimension: 1536,
  query: async (sql, parameters) => {
    const result = await pool.query(sql, parameters);
    return { rows: result.rows };
  },
});
```

No Supabase, habilite `vector`, crie a tabela e índices adequados à dimensão e aplique RLS no serviço para os acessos diretos da aplicação. O filtro `projectId`/ACL do adapter protege consultas realizadas por ele; não substitui RLS para outros caminhos de acesso ao banco. Esses são adapters opt-in por binding/função injetados e não incluem credenciais ou conexão real no pacote.

O tipo comum limita vetores a 4.096 dimensões, valores finitos e magnitude até 1.000.000; até 1.000 documentos por operação remota, 10.000 no store local, consultas até 100 resultados (50 no Vectorize) e metadados textuais até 100.000 caracteres, sujeitos ao limite menor do Vectorize. Backend e dimensão devem combinar com a configuração do índice escolhido. Operações remotas não são executadas por padrão nem por comandos CLI; são APIs explícitas para o aplicativo hospedeiro.
