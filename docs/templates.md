# Templates de projeto

O CLI oferece starters locais de Node.js/TypeScript com Fastify, Python/FastAPI e React/Vite/TypeScript. Os arquivos são gerados a partir de conteúdo versionado no pacote e não são baixados da rede.

```sh
ases template list
ases template show node-ts-api
ases template apply node-ts-api ./minha-api "Minha API" --dry-run
ases template apply node-ts-api ./minha-api "Minha API" --apply
```

`list` mostra stacks, identificadores e arquivos. `show` exibe metadados e tamanhos sem escrever. `apply` apenas mostra o plano por padrão; `--apply` cria o diretório de destino, que precisa ser novo. O comando recusa destinos existentes e cria apenas os arquivos declarados no template. `--dry-run` sempre prevalece sobre `--apply`.

| ID | Linguagem | Stack | Conteúdo |
|---|---|---|---|
| `node-ts-api` | TypeScript | Node.js + Fastify | health endpoint, package.json, tsconfig, env example, README |
| `python-fastapi` | Python | FastAPI + pytest | aplicação, teste de health, pyproject, env example, README |
| `react-vite-ts` | TypeScript | React + Vite | app inicial, CSS, configuração Vite/TS, README |

O CLI não executa `npm install`, `pip install`, scripts gerados nem serviços. Reveja versões de dependências e configuração antes de instalar ou expor o scaffold.
