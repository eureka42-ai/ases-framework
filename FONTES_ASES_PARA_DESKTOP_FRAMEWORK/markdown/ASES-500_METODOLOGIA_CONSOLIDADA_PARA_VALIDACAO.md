# ASES-500 — Metodologia interativa de especificação e engenharia de software com agentes

> **Natureza deste documento:** consolidação técnica reconstruída em 13/11/2026 a partir das definições anteriormente estabelecidas para o ASES-500, da obra-base **ASES-300 — Engenharia de Software Orientada a Agentes** e dos artefatos do projeto Eureka42. **Não é uma transcrição do Markdown independente original do ASES-500**, que não foi localizado. Está organizado para revisão e homologação pelo idealizador.
>
> **Compatibilidade:** respeita a base `ASES-300 + X`. Um projeto com 200 requisitos de domínio poderá ter uma matriz `REQ-001..REQ-500`, como no Eureka42. A escolha de 200 não é regra universal para qualquer projeto.

## 1. Visão

O ASES-500 é uma metodologia de **especificação interativa, implementação assistida por agentes e verificação contínua**. Seu objetivo é transformar um pedido inicialmente incompleto em um produto de software descrito de modo claro, rastreável, seguro, implementável e demonstravelmente funcional.

Ele articula cinco componentes:

1. **Entrevista progressiva:** a IA pergunta apenas o que falta decidir, com opções justificadas e perguntas contextualizadas.
2. **Engenharia de requisitos:** cada expectativa transforma-se em obrigação verificável, com ID estável, origem, prioridade e aceite.
3. **Especificação modular:** produto, domínio, arquitetura, dados, API, autorização, UX, segurança, IA, testes, operação e implantação são documentados em artefatos próprios.
4. **Harness de desenvolvimento:** agentes executam incrementos controlados, consultam regras, realizam testes e mantêm a memória operacional do repositório.
5. **Auditoria e entrega verificável:** nenhuma funcionalidade é declarada pronta sem satisfazer seus critérios de aceitação e oferecer evidências.

**Princípio de aplicação:** uma boa especificação não substitui testes; uma boa implementação não elimina a necessidade de decisões explícitas; e uma demonstração visual não comprova um sistema funcional.

## 2. Relação entre ASES-300, ASES-500 e REQ-500

| Elemento | Papel | Abrangência |
|---|---|---|
| ASES-300 | Base normativa e operacional reutilizável | 300 requisitos gerais (`REQ-001..300`) e práticas de engenharia, com complementação por requisitos de domínio |
| ASES-500 | Processo interativo de condução do projeto | Descoberta, especificação, governança, implementação incremental, evidência e conclusão |
| REQ-500 | Nome de uma matriz de 500 itens, quando adotada por um projeto | No Eureka42: 300 gerais + 200 específicos (`REQ-301..500`) |

**Atenção à nomenclatura:** o número 500 aparece tanto no nome da evolução metodológica quanto na matriz de 500 requisitos utilizada no Eureka42. Não se deve inferir que todo projeto ASES-500 precisa ter exatamente 500 itens; o núcleo geral da fonte é `300 + X`.

## 3. Princípios inegociáveis

- **Verdade de produto:** documentar decisões reais, distinguir confirmado de proposto e não inventar autorização, escolha, integração ou regra de negócio.
- **Responsabilidade humana:** decisões de alto impacto, políticas, custos e aprovações permanecem sob responsabilidade da pessoa responsável pelo projeto.
- **Requisitos únicos:** toda obrigação possui identificador imutável; alteração substantiva exige histórico e avaliação de impacto.
- **Segurança por padrão:** autorização sempre imposta no backend, tratamento seguro de secrets, proteção de dados pessoais e testes negativos.
- **Portabilidade documental:** Markdown para leitura e revisão; YAML/JSON para estado operacional e automação, quando necessário.
- **Agentes verificáveis:** nenhum `DONE/PASS` baseado apenas na afirmação textual do agente.
- **Dependências explícitas:** requisitos bloqueados não podem ser simulados como concluídos.
- **Escopo proporcional:** aplicar requisitos CORE, avaliar CONDITIONAL e justificar N/A; evitar burocracia sem valor.
- **Continuidade entre sessões:** preservar contexto, decisões, impedimentos, evidências e próximos passos em arquivos versionados.

## 4. Papel do GPT Especificador Interativo de Projetos

O agente de especificação atua como analista de requisitos, arquiteto colaborativo, revisor de segurança e facilitador da tomada de decisão. Ele **não** substitui o responsável pelo produto.

### 4.1 Comportamento esperado

1. Ler informações e artefatos já disponíveis antes de perguntar.
2. Resumir o objetivo do projeto em linguagem compreensível.
3. Identificar lacunas que alteram escopo, implementação, risco, custo ou aceite.
4. Fazer perguntas **progressivas**, priorizadas pelo impacto e pela dependência; evitar questionários gigantes desnecessários.
5. Oferecer alternativas e suas consequências quando a pessoa não souber responder.
6. Indicar recomendações como **PROPOSTA**, jamais como decisão confirmada.
7. Registrar a resposta em sua seção de origem (`PRODUCT`, `DOMAIN`, `AUTH`, etc.) e atualizar os REQs afetados.
8. Não repetir pergunta já respondida, salvo se surgir contradição concreta.
9. Apresentar contradições e decisões irreversíveis para validação explícita.
10. Consolidar os arquivos, produzir critérios de aceite e iniciar a implementação somente com as dependências mínimas resolvidas.

### 4.2 Estados de decisão

- `CONFIRMED`: decisão explicitamente tomada e registrada.
- `PROPOSED`: recomendação ainda não aprovada.
- `OPEN`: questão importante sem resposta.
- `VALIDATION_REQUIRED`: hipótese ou decisão de impacto significativo que exige validação.
- `SUPERSEDED`: decisão substituída, preservada para histórico.

Não misturar **estado da decisão** com **estado da implementação do requisito**.

## 5. Fluxo operacional de especificação

O percurso de referência recuperado dos materiais anteriores é:

```text
PRODUCT
  ↓
DOMAIN
  ↓
REQUIREMENTS
  ↓
ARCHITECTURE
  ↓
DATABASE
  ↓
API & INTEGRATIONS
  ↓
AUTH & AUTHORIZATION
  ↓
UX/UI
  ↓
SECURITY & PRIVACY
  ↓
AI (quando aplicável)
  ↓
TESTS & EVALS
  ↓
OBSERVABILITY
  ↓
DEPLOYMENT
  ↓
HARNESS
  ↓
DEFINITION OF DONE (DoD)
```

Este é um **roteiro de cobertura**, não uma obrigação de engenharia em cascata. Perguntas podem ser revisitadas e etapas executadas em incrementos, mantendo a rastreabilidade.

### 5.1 Perguntas orientadoras por módulo

| Módulo | Pergunta central | Entregável mínimo |
|---|---|---|
| PRODUCT | Que problema real será resolvido, para quem e por quê? | problema, público, objetivos, escopo e fora de escopo |
| DOMAIN | Que entidades, regras, estados e exceções governam o negócio? | glossário e invariantes |
| REQUIREMENTS | O que exatamente deve funcionar e como comprovar? | matriz de requisitos com aceite |
| ARCHITECTURE | Que componentes implementam esses contratos e por quê? | desenho técnico e ADRs |
| DATABASE | Como modelar, proteger e recuperar os dados? | esquema, migrações e política de backup |
| API & INTEGRATIONS | Como sistemas e serviços interagem de modo seguro? | contratos, autenticação, falhas e limites |
| AUTH | Quem pode fazer o quê, em qual escopo e por qual canal? | RBAC/ABAC e testes negativos |
| UX/UI | Como cada pessoa completa a jornada real? | fluxos, estados, responsividade, acessibilidade |
| SECURITY & PRIVACY | Que ataques, abusos e exposições devem ser prevenidos? | controles, ameaças e evidências de teste |
| AI | Onde a inferência agrega valor e onde uma regra determinística é obrigatória? | contratos, providers, guardrails e evals |
| TESTS & EVALS | Como provar critérios funcionais e não funcionais? | suíte de testes vinculada aos REQs |
| OBSERVABILITY | Como saber que o sistema funciona em operação? | logs, métricas, traces e alertas |
| DEPLOYMENT | Como publicar, reverter, recuperar e atualizar? | CI/CD, ambientes, migração e rollback |
| HARNESS | Como agentes continuam o trabalho com controle? | regras, Skills, STATUS e loop de verificação |
| DoD | Quando é permitido declarar concluído? | gates e evidências objetivas |

## 6. Catálogo de requisitos

### 6.1 Núcleo geral

A fonte do ASES-300 contém os requisitos `REQ-001` a `REQ-300`. Eles devem ser **reutilizados sem renumeração**, preservando sua proveniência e conteúdo de base. O catálogo foi organizado em grupos como identidade do produto, princípios de implementação, arquitetura, persistência, autenticação, CRUD, auditoria, UX, segurança e privacidade, IA, testes, observabilidade, Harness, rastreabilidade, memória operacional, autoauditoria e release.

### 6.2 Complementação por domínio

Os requisitos adicionais são elaborados a partir do `PRODUCT` e do `DOMAIN` do projeto. Para uma matriz de 500 itens, a convenção usada no Eureka42 é `REQ-301` a `REQ-500`. Esses itens **não são uma lista fixa universal**: expressam as particularidades do produto.

### 6.3 Classificação, prioridade e estado

**Aplicabilidade** (categorias de referência):

- `CORE`: preocupação central, normalmente aplicável.
- `CONDITIONAL`: aplicável conforme recursos e contexto do produto.
- `DOMAIN`: específico do negócio/produto.

**Prioridade:** `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, conforme impacto e política de risco estabelecida pelo projeto.

**Estado operacional** (preservado da fonte ASES-300): `PENDING`, `IN_PROGRESS`, `PASS`, `FAIL`, `BLOCKED`, `N/A`.

- `PASS` exige evidência efetiva, não mera intenção.
- `FAIL` indica critério testado e não atendido.
- `BLOCKED` indica dependência impeditiva identificada.
- `N/A` deve trazer justificativa de não aplicabilidade.

### 6.4 Modelo de registro de requisito

```yaml
id: REQ-301
name: "Exemplo de requisito específico"
origin: "DOMAIN.md / regra RB-001"
classification: DOMAIN
priority: HIGH
applicability: true
status: PENDING
description: "O comportamento verificável exigido pelo produto"
acceptance_criteria:
  - "Dado contexto X, quando Y ocorrer, então Z deve ser comprovável"
dependencies:
  - REQ-097
implementation_files: []
related_tests: []
evidence: []
owner: null
last_verified_at: null
```

Os campos acima formam um **modelo recomendado para o consolidado**, não uma transcrição exata de um schema ASES-500 original não localizado. `REQ-301` foi usado apenas para demonstrar o formato, sem substituir o requisito real de qualquer projeto.

## 7. Artefatos Markdown e operação do repositório

O ASES-300 estabelece uma organização de referência separando especificação, regras, estado operacional, requisitos processáveis, decisões e implementação. O ASES-500 utiliza essa mesma base.

```text
PROJECT/
├── README.md
├── AGENTS.md
├── spec/
│   ├── 00-MASTER-SPEC.md
│   ├── 01-PRODUCT.md
│   ├── 02-GENERAL-REQUIREMENTS.md
│   ├── 03-DOMAIN-REQUIREMENTS.md
│   ├── 04-ARCHITECTURE.md
│   ├── 05-DATABASE.md
│   ├── 06-API-INTEGRATIONS.md
│   ├── 07-AUTH-AUTHORIZATION.md
│   ├── 08-UX-UI.md
│   ├── 09-SECURITY-PRIVACY.md
│   ├── 10-AI.md
│   ├── 11-TESTS-EVALS.md
│   ├── 12-OBSERVABILITY.md
│   ├── 13-DEPLOYMENT.md
│   └── 14-DEFINITION-OF-DONE.md
├── harness/
│   ├── HARNESS.md
│   └── RULES.md
├── progress/
│   └── STATUS.md
├── requirements/
│   ├── general.yaml
│   ├── domain.yaml
│   └── traceability.yaml
├── skills/
├── evals/
├── scripts/
├── docs/adr/
├── tests/
└── src/
```

**Nota:** a árvore acima expande didaticamente o exemplo de estrutura do Capítulo 3 da obra-base; os nomes de arquivos após `04-ARCHITECTURE.md` são uma organização sugerida para este consolidado e não precisam ser copiados literalmente em todos os projetos.

## 8. Harness: ciclo de implementação verificável

```text
Ler SPEC + REQs + RULES + STATUS
           ↓
Selecionar REQ aplicável e desbloqueada
           ↓
Inspecionar repositório e dependências
           ↓
Planejar mudança + testes + riscos
           ↓
Implementar incremento mínimo funcional
           ↓
Executar validações relevantes
      ┌────┴────┐
      ↓         ↓
    FALHA      PASSOU
      ↓         ↓
Corrigir ou    Salvar evidências,
registrar      atualizar STATUS,
bloqueio       rastreabilidade e ADR
      └─────────┴──→ próxima REQ
```

O Harness deve controlar tentativas, respeitar permissões, evitar loops infinitos, preservar logs sem segredos e exigir aprovação humana quando existir impacto crítico.

### 8.1 Relatório mínimo por incremento

```text
Incremento: [número, título e escopo]
REQs atendidos: [IDs]
Decisões/ADRs: [IDs]
Arquivos alterados: [caminhos]
Testes executados: [comandos e resultados]
Evidências: [relatórios, screenshots, logs, testes]
Bloqueios/pendências: [IDs e razões]
Próximo incremento: [REQs liberados]
```

## 9. Gates e Definition of Done

A liberação de uma funcionalidade exige:

1. Aceite definido e vinculado à REQ.
2. Código real nos componentes devidos, sem recursos simulados disfarçados de produção.
3. Testes pertinentes executados e aprovados.
4. Verificação das permissões **também em endpoints e exportações**.
5. Segurança e privacidade proporcionalmente ao risco.
6. Atualização da documentação e do estado operacional.
7. Evidência registrada, reprodutível e vinculada ao requisito.

A **liberação do produto** segue gates adicionais da fonte ASES-300, incluindo aprovação dos itens `CRITICAL` e `HIGH` aplicáveis, build, typecheck, lint, testes unitários/de integração/E2E críticos, auditoria, backup/restore e ausência de funcionalidades falsas. Caso algum gate falhe, o release não pode ser chamado de aprovado.

## 10. Segurança e qualidade por padrão

- Autorização no servidor, nunca apenas ocultação de UI.
- Validação de dados nas fronteiras de entrada e saída.
- Privilégio mínimo para usuários, serviços e agentes.
- Secrets fora do repositório, dos logs e do código do navegador.
- Proteção contra XSS, CSRF, SQL injection e abuso de integração, conforme aplicabilidade.
- Tratamento explícito de LGPD, retenção de dados e auditoria.
- Backups testados com restauração real; plano de rollback.
- Controles de IA: prompt injection, uso indevido de ferramentas, custo e resultados não determinísticos.
- Testes positivos, negativos, de regressão e de falhas de serviço.

## 11. Controle de mudanças

Alteração de requisito ou decisão deve registrar **o que mudou, por quê, quem aprovou e o impacto** em código, banco, API, testes, UX, segurança, implantação e documentação. IDs existentes nunca devem ser reutilizados para semânticas diferentes. Decisões arquiteturais relevantes ficam em ADRs; o estado momentâneo fica no `STATUS.md`.

Quando a IA identificar inconsistência, deve explicitar o conflito antes de modificar componentes críticos. Alterações cosméticas podem ser resolvidas proporcionalmente; mudanças de política, permissões, dados sensíveis, custo ou arquitetura exigem validação humana.

## 12. Prompt-base para iniciar uma especificação ASES-500

> **Uso:** ponto de partida genérico, sintetizado neste consolidado. Não é reprodução literal do antigo prompt original.

```text
Atue como GPT Especificador Interativo de Projetos, seguindo ASES-500 e a
obra-base ASES-300. Seu papel é transformar minhas respostas e documentos
em especificações, requisitos verificáveis e um plano incremental de
implementação com Harness.

1. Leia primeiro o que eu já forneci; não repita perguntas respondidas.
2. Faça perguntas por lacunas, priorizadas por risco e dependência.
3. Quando eu não souber decidir, proponha alternativas com consequências,
   identificando explicitamente o que é PROPOSTO e o que está CONFIRMADO.
4. Utilize os REQ-001..300 como núcleo geral, sem renumerá-los, e acrescente
   requisitos específicos do domínio com IDs próprios.
5. Para cada requisito mantenha origem, prioridade, classificação,
   dependências, critérios de aceite, testes, evidências e estado.
6. Produza artefatos Markdown e, quando necessário, YAML/JSON operacionais.
7. Prepare arquitetura, segurança, UX/UI, banco, APIs, IA, testes, entrega
   e Harness, proporcionais à natureza do sistema.
8. Nunca apresente como concluída uma funcionalidade sem implementação real
   e testes/evidências que satisfaçam seu critério de aceite.
9. Registre decisões e pendências para continuidade entre sessões.
10. Ao final de cada incremento, informe requisitos atendidos, mudanças,
    testes, evidências, riscos e próximos passos.

Comece resumindo a visão do produto e apresente a primeira pergunta
realmente necessária para especificá-lo.
```

## 13. Aplicação documentada: Eureka42

No projeto Eureka42 há um conjunto documental que ilustra o processo:

- `01_EUREKA42_MASTER_SPEC.md`: visão, escopo, decisões, arquitetura e requisitos do produto.
- `05_EUREKA42_REQUISITOS_500_CONSOLIDADOS.md`: matriz de 500 requisitos; `REQ-001..300` extraídos do ASES-300 e `REQ-301..500` específicos do Eureka42.
- `08_PROMPT_EXECUCAO_ASES500.md`: prompt operacional de implementação do Eureka42, com regras de hierarquia de fontes, gates, rastreabilidade e formato de relatórios.

**Esses três arquivos são específicos do Eureka42.** Não devem ser usados como catálogo universal do ASES-500 para outros produtos. O prompt foi elaborado para esse produto e sua stack, não para quaisquer sistemas.

## 14. Proveniência e situação de validação

1. **Fonte primária recuperada:** `ASES-300_COMPLETO_Capitulos_1_a_25_ABNT.docx`, obra-base em versão de trabalho, 25 capítulos e catálogo de 300 requisitos gerais.
2. **Aplicação recuperada:** matriz de 500 requisitos e prompt de execução ASES-500 do Eureka42, elaborados em novembro de 2026.
3. **Definições recuperadas da evolução:** agente especificador, entrevista progressiva, perguntas por lacunas, seções do fluxo de projeto, estados de requisitos, rastreabilidade, Harness e Definition of Done.
4. **Limitação documental:** o texto literal do Markdown independente chamado ASES-500 não foi recuperado. Este material é uma **reconstrução consolidada para validação**, não um original textual certificado.

---

*Consolidação editorial: 13 de novembro de 2026. Preservar a autoria e verificar a redação final antes de publicar como versão oficial da metodologia.*
