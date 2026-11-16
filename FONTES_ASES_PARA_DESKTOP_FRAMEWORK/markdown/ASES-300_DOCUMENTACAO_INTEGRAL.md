ASES-300 — ENGENHARIA DE SOFTWARE ORIENTADA A AGENTES

Especificação, Harness Engineering, Requisitos, Skills, Evals e Desenvolvimento Verificável com Agentes de Inteligência Artificial

**Versão de trabalho — Capítulo 1**

# PREFÁCIO

A Engenharia de Software atravessa um período em que modelos de linguagem deixaram de atuar apenas como ferramentas de consulta ou geração pontual de código e passaram a integrar fluxos capazes de investigar repositórios, modificar múltiplos arquivos, executar comandos, utilizar ferramentas, observar resultados e corrigir tentativas. Essa transformação não elimina os fundamentos clássicos da Engenharia de Software. Ao contrário, torna ainda mais importante explicitar requisitos, limites, critérios de aceitação, decisões arquiteturais e mecanismos de verificação, pois parte do conhecimento que antes permanecia implicitamente distribuído entre pessoas precisa agora ser representada de maneira suficientemente clara para humanos e agentes computacionais.

O ASES-300 é apresentado nesta obra como um modelo didático e operacional para organizar esse cenário. Seu núcleo é formado por trezentos requisitos gerais, complementados por um conjunto variável de requisitos específicos do domínio. Ao redor desse núcleo são organizados artefatos de produto, arquitetura, dados, APIs, autorização, experiência do usuário, segurança, inteligência artificial, testes, observabilidade, implantação, regras, Skills, Harness, rastreabilidade, estado operacional, registros de decisões e Definition of Done. O propósito não é criar burocracia documental, mas estabelecer uma linguagem comum que permita responder de forma verificável o que deve existir, por que deve existir, como será construído e como será demonstrado que realmente funciona.

# CITAÇÃO

“Language model agents are increasingly being used to automate complicated tasks in digital environments.” (YANG et al., 2024, p. 1).

# SUMÁRIO

# PARTE I — FUNDAMENTOS

# CAPÍTULO 1 — DA ENGENHARIA DE SOFTWARE TRADICIONAL À ENGENHARIA DE SOFTWARE ORIENTADA A AGENTES

## 1.1 Engenharia de Software é organização da complexidade

A imagem popular do desenvolvimento de software costuma concentrar-se na programação: um profissional diante de um editor escrevendo funções, classes, consultas e componentes. Essa imagem é verdadeira, mas incompleta. Um sistema profissional nasce antes do código e continua existindo depois de sua implantação. É necessário compreender um problema, delimitar o escopo, identificar usuários e responsabilidades, estabelecer requisitos, modelar informações, definir interfaces, proteger dados, planejar testes, preparar implantação, monitorar o funcionamento e preservar as razões das decisões tomadas. O código é uma parte central desse processo, mas não é o processo inteiro. Essa distinção se torna ainda mais importante quando modelos de linguagem passam a produzir parcelas crescentes da implementação, porque a facilidade de gerar código pode criar a impressão equivocada de que especificar, validar e governar o desenvolvimento se tornaram menos necessários.

A Engenharia de Software pode ser entendida como uma disciplina de transformação controlada: transformar necessidades humanas, frequentemente vagas e contraditórias, em propriedades computacionais suficientemente precisas para serem implementadas e verificadas. Uma frase como “precisamos de um sistema de usuários” não descreve um sistema; ela inicia uma investigação. É necessário perguntar quem são os usuários, quais dados serão armazenados, quem poderá criá-los, quais campos são sensíveis, como ocorrerá a autenticação, se haverá hierarquias, como registros serão excluídos, quais ações serão auditadas e quais regras precisam permanecer válidas independentemente da interface utilizada. Em projetos convencionais, muitas respostas ficam dispersas em reuniões, tickets, mensagens e conhecimento tácito. Em projetos orientados a agentes, essa dispersão se torna particularmente perigosa, porque o agente raciocina a partir do contexto que consegue acessar.

Wang et al. (2024) organizam agentes baseados em grandes modelos de linguagem em torno de componentes como perfil, memória, planejamento e ação, mostrando que a agência emerge da composição de capacidades e não simplesmente de uma resposta textual mais sofisticada. Liu et al. (2024), ao revisar agentes baseados em LLMs aplicados à Engenharia de Software, destacam a extensão dos modelos por percepção, ferramentas, recursos externos e interação. A consequência para esta obra é direta: quando o agente participa da construção do software, a arquitetura do trabalho que o cerca passa a ser também um problema de engenharia.

## 1.2 Do assistente de código ao agente que atua sobre o projeto

Há uma diferença prática entre pedir a um modelo que escreva uma função e permitir que um agente trabalhe sobre um repositório. No primeiro caso, o humano fornece um problema, recebe uma resposta e decide manualmente o que fazer. No segundo, o agente pode localizar arquivos, escolher onde alterar código, executar comandos, observar falhas, modificar a estratégia e continuar. ReAct, de Yao et al. (2023), tornou explícita uma ideia importante para sistemas agênticos: raciocínio e ação podem ser intercalados, de modo que ações obtenham novas informações do ambiente e essas observações atualizem o plano. Toolformer, de Schick et al. (2023), explorou outra dimensão: modelos podem beneficiar-se de ferramentas externas, como calculadoras, mecanismos de busca e APIs, especialmente quando ferramentas especializadas são mais confiáveis do que a geração textual pura.

Na Engenharia de Software, essa transição pode ser observada com um exemplo. Um assistente recebe “escreva uma função para validar um identificador” e devolve um trecho de código. Um agente recebe “implemente a validação no cadastro” e precisa descobrir onde está o formulário, qual schema valida a requisição, onde fica a regra de domínio, quais testes existem, quais mensagens a interface utiliza e se importações em lote também precisam obedecer à regra. O objetivo textual é curto, mas o trabalho real é distribuído. O SWE-bench foi concebido justamente para aproximar avaliações de problemas reais: Jimenez et al. (2024) construíram 2.294 tarefas a partir de issues e pull requests de repositórios públicos, nas quais a solução frequentemente exige compreender e coordenar mudanças entre múltiplas funções, classes e arquivos.

O SWE-agent aprofunda essa discussão. Yang et al. (2024) argumentam que agentes de linguagem podem ser tratados como uma nova categoria de usuários de sistemas computacionais e que, assim como humanos se beneficiam de boas interfaces de desenvolvimento, agentes também se beneficiam de interfaces desenhadas para suas características. O trabalho mostra que o desenho da interface agente-computador influencia a capacidade de navegar em repositórios, editar arquivos e executar testes. Essa constatação é central para o ASES-300: não basta perguntar qual modelo é mais capaz; é necessário perguntar em qual ambiente ele trabalha, quais ações consegue executar, quais informações observa e quais mecanismos limitam ou verificam suas decisões.

## 1.3 Um exemplo didático: “crie um CRUD de usuários”

Considere um pedido aparentemente simples: “crie um CRUD de usuários”. Um modelo pode rapidamente produzir uma tabela, endpoints de criação, leitura, atualização e exclusão e uma interface com formulário. Em uma demonstração, o resultado pode parecer excelente. Entretanto, um sistema real exige perguntas que a frase original não respondeu: e-mails precisam ser únicos? A exclusão é física ou lógica? Administradores podem excluir a própria conta? Um gestor visualiza todos os usuários ou apenas os de sua unidade? Determinados campos podem ser vistos por um perfil, mas não editados? Uma exportação deve obedecer às mesmas permissões da tela? Alterações precisam registrar estado anterior e posterior? Há dados pessoais que exigem proteção adicional?

Suponha que exista o campo \`salario\`. A interface esconde a coluna para analistas. Visualmente, a aplicação parece correta. Contudo, se a API continua devolvendo o campo, qualquer usuário capaz de inspecionar a resposta da requisição poderá visualizá-lo. O erro nasce de uma especificação incompleta: “esconder a coluna” descreve uma decisão de interface, não uma política de autorização. Um requisito melhor estabelece que usuários sem permissão de leitura sobre o campo não o recebem por nenhum canal, incluindo API, interface e exportação. A partir daí, o requisito se torna verificável.

Esse exemplo demonstra uma ideia que acompanhará toda a obra: uma implementação pode parecer correta e ainda não satisfazer o estado desejado. O ASES-300 procura reduzir essa distância transformando intenções em requisitos rastreáveis, requisitos em critérios de aceite e critérios em mecanismos de verificação. Em vez de considerar “feito” aquilo que o agente afirma ter implementado, o método estabelece previamente quais evidências serão suficientes para declarar que determinado requisito passou.

## 1.4 O problema do megaprompt

Uma resposta intuitiva à imprevisibilidade dos agentes consiste em escrever prompts cada vez maiores. O desenvolvedor começa com dez instruções, descobre lacunas, acrescenta cinquenta regras e, depois de alguns projetos, possui um documento com centenas de itens. Essa evolução é positiva até certo ponto, pois especificações detalhadas reduzem ambiguidades. O problema aparece quando o documento é tratado como se a simples presença de uma instrução garantisse sua execução e verificação. Um prompt pode dizer “todas as rotas devem ser protegidas”, mas isso não demonstra que uma rota nova recebeu autorização. Pode dizer “não deve haver botões sem ação”, mas nada impede que o agente crie um botão visualmente perfeito sem comportamento funcional.

O ASES-300 distingue especificação de mecanismo operacional. A especificação descreve o que precisa ser verdadeiro. O Harness organiza como o agente lê a especificação, seleciona trabalho, verifica dependências, implementa, executa verificações, registra evidências e decide se pode avançar. A diferença pode ser comparada à diferença entre uma ordem de serviço e a oficina inteira. A ordem de serviço pode ser excelente, mas a oficina também precisa de ferramentas, procedimentos, instrumentos de medição, registros e regras de segurança. Prompt engineering continua relevante, mas não substitui a engenharia do ambiente no qual o agente trabalha.

Resultados recentes também mostram que complexidade agêntica, por si só, não garante qualidade. Xia et al. (2024), em Agentless, apresentam uma abordagem estruturada em localização, reparo e validação e mostram que processos mais simples podem competir fortemente com agentes mais complexos em tarefas de Engenharia de Software. A lição não é abandonar agentes, mas evitar a associação automática entre mais autonomia e melhor engenharia. O método deve perguntar qual combinação de autonomia, estrutura e verificação é adequada à tarefa.

## 1.5 Contexto como infraestrutura

Em equipes humanas, muito conhecimento permanece tácito. Um desenvolvedor sabe que determinada biblioteca foi rejeitada; outro lembra que a organização exige soft delete; uma pessoa de segurança sabe que certo dado não pode chegar ao navegador; o arquiteto conhece a razão pela qual o banco foi escolhido. Esse modelo já é arriscado para equipes tradicionais e se torna ainda mais frágil para agentes, porque uma nova sessão pode não possuir o histórico anterior e porque documentos extensos competem por espaço de contexto.

Por essa razão, o ASES-300 trata contexto como infraestrutura. Em vez de depositar tudo em um único arquivo, o conhecimento é separado conforme sua função. \`PRODUCT.md\` explica por que o produto existe. \`DOMAIN-REQUIREMENTS.md\` formaliza o que é específico do negócio. \`ARCHITECTURE.md\` registra como o sistema se organiza. \`RULES.md\` estabelece restrições. \`STATUS.md\` informa onde o trabalho se encontra. ADRs preservam decisões e justificativas. \`TESTING-EVALS.md\` explica como propriedades serão verificadas. Essa decomposição permite recuperar o contexto relevante para cada tarefa sem transformar um megaprompt em depósito de toda a memória do projeto.

Wang et al. (2024) destacam memória e planejamento como componentes centrais de agentes baseados em LLMs. No ASES-300, porém, é importante distinguir memória transitória do modelo e memória persistente do projeto. Decisões relevantes devem sobreviver à sessão, ao modelo e, idealmente, à troca da ferramenta utilizada. O projeto não deve depender de o agente “lembrar”; deve permitir que o agente encontre.

## 1.6 Da resposta plausível ao estado verificável

Modelos generativos são valiosos porque conseguem produzir soluções plausíveis para problemas abertos. Porém, plausibilidade não é conformidade. Um agente pode afirmar que “a exportação foi implementada com sucesso” porque criou uma função que gera XLSX. O sistema pode compilar e o arquivo pode abrir. Ainda assim, filtros podem ser ignorados, colunas ocultas podem reaparecer, registros de outra unidade podem ser incluídos e grandes volumes podem provocar falhas. A frase “exportação funciona” é ampla demais para ser verificada como uma unidade.

O ASES-300 decompõe essa afirmação em estados observáveis. Um requisito pode determinar que a exportação respeite filtros; outro, autorização por linha; outro, autorização por campo; outro, validade do arquivo; outro, auditoria da ação. Cada estado recebe critério de aceite e método de verificação. A consequência é que \`IMPLEMENTED\` deixa de ser sinônimo de \`DONE\`. Implementação é uma etapa de uma cadeia que inclui teste, avaliação, aceitação, evidência e rastreabilidade.

Chang et al. (2024), em uma ampla revisão sobre avaliação de LLMs, organizam a disciplina em torno de perguntas sobre o que avaliar, onde avaliar e como avaliar. Essa perspectiva é particularmente útil para software com componentes probabilísticos. Um cálculo determinístico deve ser testado de forma determinística sempre que possível; uma resposta gerada com base em documentos pode exigir evals de fidelidade, relevância e fundamentação. O princípio é escolher o mecanismo de verificação adequado à natureza do comportamento.

## 1.7 Autonomia graduada e human-in-the-loop

Engenharia orientada a agentes não deve confundir autonomia com ausência de governança. Há decisões locais e reversíveis que um agente pode tomar sozinho, decisões intermediárias que podem ser tomadas desde que justificadas e decisões críticas que exigem aprovação humana. Escolher o nome de uma variável e trocar o banco principal não pertencem à mesma classe. Corrigir tipagem e enfraquecer autorização também não.

Uma forma didática de organizar essa autonomia é pensar em três zonas. Na zona verde ficam decisões locais compatíveis com a arquitetura. Na zona amarela ficam decisões que afetam manutenção, custo ou dependências e precisam de registro, como adicionar uma biblioteca. Na zona vermelha ficam decisões que alteram contratos fundamentais, como remover requisito, trocar tecnologia estrutural, modificar política de acesso ou realizar migração destrutiva. Essas decisões devem exigir intervenção humana explícita.

AutoGen demonstra que fluxos com LLMs podem combinar agentes, ferramentas e participação humana em diferentes configurações (WU et al., 2024). No ASES-300, human-in-the-loop não é entendido como falha de autonomia. Em muitos contextos é uma propriedade desejável: o agente assume trabalho operacional verificável, enquanto pessoas preservam decisões de significado, risco, prioridade e responsabilidade.

## 1.8 Memória do projeto, ADR e STATUS

Projetos de software vivem mais do que sessões de IA. Essa assimetria cria risco de amnésia arquitetural. Em uma sessão, decide-se utilizar D1 como banco operacional e R2 para arquivos. Em outra, um agente observa uma necessidade local e introduz outro banco. Uma terceira sessão tenta consolidar os dois. Nenhuma decisão precisa ser absurda isoladamente; o problema é que a razão original desapareceu.

O ASES-300 utiliza dois mecanismos complementares. O ADR, Architecture Decision Record, registra contexto, alternativas, decisão, justificativa e consequências. O \`STATUS.md\` funciona como memória operacional: último requisito verificado, requisito atual, próximos itens, bloqueios e falhas críticas. O ADR responde “por que decidimos assim?”; o STATUS responde “onde estamos agora?”.

Para um agente, esses documentos funcionam como pontos de ancoragem. Antes de propor mudança estrutural, consulta ADRs. Antes de iniciar trabalho, consulta STATUS. Antes de modificar uma funcionalidade, localiza requisitos relacionados. A continuidade passa a depender menos da memória conversacional e mais de artefatos persistentes, versionáveis e auditáveis.

## 1.9 Da tarefa ao estado que precisa ser verdadeiro

Listas de tarefas descrevem atividades: “fazer permissões”, “criar logs”, “implementar exportação”. Elas não definem necessariamente o estado final esperado. Um agente pode concluir cada item de maneira incompatível com a intenção do produto e ainda marcá-lo como finalizado.

Um requisito verificável formula o que deverá ser verdadeiro. Em vez de “fazer permissões”, escreve-se que um usuário sem \`READ:salary\` não recebe \`salary\` por API, interface ou exportação. Em vez de “criar logs”, exige-se que alterações registrem ator, horário, entidade, identificador, estado anterior e posterior. Em vez de “implementar exportação”, exigem-se formatos, respeito a filtros e políticas de autorização e registro da operação.

Essa mudança de unidade é decisiva para agentes. O agente continua livre para escolher detalhes de implementação, mas o estado final deixa de depender de interpretação subjetiva. A pergunta “terminei?” é substituída por “os critérios observáveis foram satisfeitos e existe evidência?”.

## 1.10 O Método 300: núcleo geral mais X específico

O ASES-300 utiliza trezentos requisitos gerais como núcleo reutilizável. O número não significa que todo software tenha exatamente trezentos requisitos nem que todos os itens se apliquem igualmente. Os requisitos gerais formam uma lista estruturada de preocupações que devem ser conscientemente examinadas: identidade, escopo, arquitetura, persistência, autenticação, autorização, funcionalidades recorrentes, auditoria, UX, segurança, IA quando aplicável, testes, observabilidade, Harness, rastreabilidade, memória operacional, autoauditoria e Definition of Done.

A fórmula completa é \`ASES-300 + X\`. Os trezentos formam o núcleo comum; \`X\` representa os requisitos específicos do domínio. Um sistema acadêmico acrescentará requisitos sobre matrizes, disciplinas e equivalências. Uma revista jurídica acrescentará notícias, colunistas e fluxo editorial. Um CRUD hierárquico acrescentará estruturas dinâmicas, permissões por coluna, exportação e gestão organizacional. A metodologia impede que particularidades do domínio apaguem preocupações gerais e, ao mesmo tempo, impede que uma lista genérica seja confundida com a especificação completa do produto.

Alguns requisitos são \`CORE\`; outros são \`CONDITIONAL\`. Se um sistema não utiliza inteligência artificial, requisitos de RAG podem receber \`N/A\`. A decisão permanece explícita, permitindo distinguir não aplicabilidade de esquecimento.

## 1.11 Os 300 de Esparta e a ideia de formação

A escolha do número trezentos oferece uma metáfora didática com a narrativa dos trezentos espartanos associados à Batalha das Termópilas. A analogia deve ser usada com precisão: as forças gregas presentes não eram compostas apenas pelos trezentos espartanos; havia outros contingentes. Isso torna a comparação especialmente adequada à fórmula \`300 + X\`: os trezentos representam um núcleo reconhecível, mas não a totalidade da força. Do mesmo modo, os 300 requisitos gerais não representam a totalidade do projeto; são complementados pelos requisitos específicos.

A parte produtiva da metáfora não é a guerra, mas a formação. Trezentos indivíduos isolados não equivalem a uma força organizada. Da mesma forma, trezentas frases colocadas aleatoriamente em um prompt não constituem o Método 300. O valor surge quando cada requisito possui identidade, classificação, prioridade, relações, critérios de aceite, métodos de verificação, evidências e estado. A “formação” é produzida pelo Harness e pela rastreabilidade: dependências são conhecidas, falhas são detectadas e o avanço depende de condições objetivas.

Pode-se imaginar cada REQ como uma posição nessa formação. \`REQ-111\`, por exemplo, não vive isolado: permissão por campo depende de autenticação e autorização, afeta API, interface e exportação, precisa ser testada e deve deixar evidência. A força do método não está no número como fetiche, mas na disciplina de tratar requisitos como elementos relacionados de um sistema de engenharia.

## 1.12 N/A não significa “não quero fazer”

Um modelo reutilizável precisa reconhecer que alguns requisitos não fazem sentido em todos os sistemas. A solução não é apagá-los, pois isso destrói rastreabilidade e torna impossível distinguir esquecimento de decisão. O ASES-300 adota \`N/A — Not Applicable\`, ou “Não se aplica”. Esse estado significa que o requisito foi conscientemente analisado e existe justificativa objetiva para sua não aplicação.

Considere um sistema interno sem LLM, busca semântica ou geração de respostas a partir de documentos. O requisito de RAG pode ser \`N/A\`, com justificativa: “A aplicação não utiliza geração baseada em recuperação de conhecimento; os resultados são produzidos por regras determinísticas e consultas estruturadas”. Isso é diferente de \`PENDING\`, que significa que algo aplicável ainda não foi feito; \`BLOCKED\`, que indica impedimento; e \`FAIL\`, que significa que o requisito foi verificado e não atendido.

A obrigatoriedade de justificar N/A é deliberada. Sem justificativa, N/A pode virar atalho para retirar requisitos difíceis. Com justificativa, torna-se evidência de análise. Projetos podem ainda exigir aprovação humana para N/A em requisitos críticos.

## 1.13 Harness Engineering: a oficina em torno do agente

Uma analogia útil é a oficina. O modelo é comparável ao profissional capaz de executar trabalho. A SPEC corresponde à ordem de serviço e aos desenhos. Skills são procedimentos e manuais. Tools são ferramentas. Rules são normas. Tests e Evals são instrumentos de medição. STATUS é a ficha que informa onde o serviço parou. ADRs preservam decisões. A Definition of Done é o conjunto de condições que autoriza declarar o trabalho concluído. O Harness é a organização que conecta esses elementos e governa a sequência operacional.

Essa visão evita um erro comum: imaginar que Harness seja apenas mais um arquivo Markdown. \`HARNESS.md\` documenta o processo, mas o Harness real é o comportamento operacional produzido pela combinação de documentos, scripts, ferramentas, testes, estados e regras. Quanto mais partes puderem ser automatizadas — por exemplo, uma verificação única que execute typecheck, lint, testes, segurança e checagem de requisitos — menos o projeto dependerá de o agente lembrar espontaneamente de cada obrigação.

O SWE-agent oferece evidência interessante ao mostrar que o desenho da interface entre agente e computador influencia desempenho em tarefas de software (YANG et al., 2024). O ASES-300 amplia didaticamente essa ideia: importa não apenas a interface de comandos, mas também a interface epistemológica e normativa do projeto — aquilo que o agente consegue saber, aquilo que pode fazer, aquilo que deve verificar e aquilo que precisa registrar.

## 1.14 Passo a passo de um ciclo mínimo orientado a Harness

Um ciclo mínimo começa quando o agente carrega o estado do projeto e identifica qual requisito deve ser tratado. Em seguida, consulta os documentos relevantes, verifica dependências e restrições e formula um plano. Depois realiza alterações incrementais, executa verificações estáticas como typecheck e lint, executa testes relacionados e regressões necessárias e compara o resultado com o critério de aceite. Se falhar, corrige e repete. Se passar, registra evidências, atualiza rastreabilidade e STATUS e somente então seleciona o próximo requisito.

Observe que nenhuma etapa exige retirar raciocínio do agente. Ao contrário, o ciclo cria pontos em que seu raciocínio é alimentado por informações melhores e confrontado com resultados observáveis. O agente pode escolher uma solução, descobrir que um teste falhou, investigar a causa e corrigir. O Harness não prescreve necessariamente cada linha de código; ele prescreve a disciplina do trabalho.

Essa ideia também explica por que processos simples podem ser poderosos. Agentless estrutura a solução em fases claras de localização, reparo e validação (XIA et al., 2024). O ASES-300 não exige complexidade máxima; exige complexidade controlável, justificável e verificável.

## 1.15 Tests, Evals e evidência

Em sistemas tradicionais, testes automatizados são uma das principais formas de demonstrar comportamento. Em sistemas com LLMs, nem toda propriedade é facilmente reduzida a uma asserção exata. Torna-se útil distinguir \`TEST\` de \`EVAL\`. Um teste pode verificar que um endpoint retorna \`403\` quando o usuário não possui permissão. Um eval pode avaliar se uma resposta gerada está fundamentada nas fontes recuperadas, se segue determinada política ou se mantém qualidade mínima em um conjunto de casos.

Chang et al. (2024) defendem uma visão multidimensional da avaliação de LLMs. Para o ASES-300, a preocupação é incorporada ao ciclo: componentes determinísticos devem, sempre que possível, possuir testes determinísticos; componentes probabilísticos precisam de avaliações adequadas. Não se deve utilizar um LLM para avaliar aquilo que uma asserção simples pode verificar com maior confiabilidade, assim como não se deve fingir que uma igualdade de strings consegue avaliar adequadamente uma tarefa genuinamente semântica.

Evidência é o resultado registrável da verificação. Pode ser um teste aprovado, relatório de segurança, migration executada em ambiente de teste, log de auditoria, artefato exportado validado ou conjunto de resultados de eval. O objetivo é permitir que \`PASS\` tenha significado operacional e não seja apenas uma declaração do agente.

## 1.16 O humano permanece responsável pelo significado

Engenharia orientada a agentes não significa remover seres humanos do desenvolvimento. Agentes podem ampliar a capacidade operacional de uma pessoa ou equipe, mas objetivos, prioridades, riscos e consequências continuam exigindo julgamento. Um agente pode propor arquiteturas; a organização decide qual compromisso entre custo, portabilidade e complexidade é aceitável. Pode identificar conflito entre regras de negócio; alguém determina qual política é correta. Pode implementar uma política de retenção; a organização define qual política é legítima.

O ASES-300 procura deslocar participação humana para pontos de maior valor. Em vez de depender do humano para lembrar cada comando, o Harness automatiza verificações. Em vez de revisar manualmente toda formatação, ferramentas podem fazê-lo. Mas alterações de escopo, exceções de segurança, decisões jurídicas, aceitação de risco e redefinições de produto devem possuir gates humanos quando apropriado.

Essa combinação é compatível com arquiteturas que integram agentes, ferramentas e humanos em fluxos compostos, como AutoGen (WU et al., 2024). O objetivo não é maximizar autonomia como valor absoluto, mas construir uma divisão de trabalho em que autonomia produza eficiência sem eliminar responsabilidade.

## 1.17 O princípio do “não existe falso DONE”

Uma regra central do ASES-300 é a proibição do falso \`DONE\`. Em projetos assistidos por agentes, existe forte tentação de aceitar mensagens como “implementei”, “corrigi” ou “todos os requisitos foram atendidos” como conclusão. Essas frases são relatórios, não evidências. O agente pode estar sinceramente errado, pode ter testado apenas o caminho feliz ou pode não ter percebido que sua alteração quebrou outra funcionalidade.

No método, um requisito só alcança \`PASS\` quando o critério de aceite foi satisfeito e a evidência necessária está disponível. O projeto só alcança \`DONE\` quando os release gates da Definition of Done foram satisfeitos. Assim, é possível ter todos os arquivos aparentemente completos e o projeto continuar não concluído porque existe uma falha crítica de segurança, migration não testada ou E2E essencial quebrado.

Essa disciplina aproxima o desenvolvimento agêntico de práticas maduras de Engenharia de Software. A diferença é que os critérios precisam ser suficientemente explícitos para que agentes também consigam utilizá-los como parte do ciclo operacional.

## 1.18 O ASES-300 como linguagem comum

Um benefício adicional é criar linguagem comum. Quando alguém diz \`REQ-111\`, não precisa repetir toda a discussão sobre permissão por campo. Quando um agente encontra \`ADR-007\`, sabe que existe decisão arquitetural registrada. Quando \`STATUS.md\` informa \`REQ-418 IN_PROGRESS\`, a próxima sessão sabe onde continuar. Quando um item está \`N/A\`, a justificativa explica por que não pertence ao produto. Quando a Definition of Done exige \`CRITICAL = 100% PASS\`, o critério de release deixa de depender de sensação subjetiva.

Essa linguagem melhora também a comunicação entre pessoas. O ASES-300 não é exclusivamente uma metodologia para máquinas. Requisitos vagos, decisões não registradas, ausência de critérios de aceite, testes insuficientes e documentação contraditória prejudicam equipes humanas tanto quanto agentes. A presença do agente apenas torna mais visível a necessidade de formalizar aquilo que antes podia ser compensado por conversas e memória coletiva.

Por isso, a proposta não substitui a Engenharia de Software existente; organiza um novo tipo de participante do processo. Requisitos, arquitetura, testes, segurança e documentação permanecem. O que muda é que esses artefatos passam a ser desenhados também para orientar execução computacional.

## 1.19 Síntese do capítulo

Este capítulo partiu de uma distinção simples: gerar código não é o mesmo que construir software. À medida que LLMs evoluem de assistentes para agentes capazes de agir sobre ambientes, aumenta a necessidade de organizar contexto, ferramentas, autonomia, testes e memória. Trabalhos como SWE-bench e SWE-agent mostram que tarefas reais exigem interação com bases de código e ambientes de execução, enquanto ReAct, Toolformer, AutoGen e surveys recentes demonstram a importância de ação, ferramentas, memória, planejamento e orquestração em sistemas baseados em LLMs (YAO et al., 2023; SCHICK et al., 2023; WU et al., 2024; WANG et al., 2024).

O ASES-300 nasce desse cenário como proposta metodológica: trezentos requisitos gerais formam um núcleo reutilizável e são complementados por \`X\` requisitos específicos de domínio. Esses requisitos são conectados a contexto de produto, arquitetura, regras, Skills, Harness, testes, Evals, evidências, rastreabilidade, memória operacional, ADRs e Definition of Done. A metáfora dos 300 de Esparta serve como recurso mnemônico: os trezentos não são a totalidade, mas um núcleo organizado; sua força metodológica está menos na quantidade e mais na formação.

A partir do próximo capítulo, a obra avançará para os componentes técnicos que permitem compreender sistemas agênticos com maior precisão. O leitor verá como modelos de linguagem se diferenciam de agentes, como ferramentas ampliam capacidades, como memória e planejamento entram no ciclo e como esses elementos culminam no conceito de Harness Engineering. Quando os 300 requisitos forem apresentados individualmente, cada um deverá ser compreendido não como item burocrático, mas como parte de uma estrutura operacional destinada a transformar intenção em software verificável.

## 1.20 Quadro-síntese do Capítulo 1

| Conceito           | Pergunta principal                              | Função no ASES-300                                         |
|--------------------|-------------------------------------------------|------------------------------------------------------------|
| PRODUCT            | Por que construir?                              | Preserva problema, objetivos, público e escopo.            |
| DOMAIN             | O que é específico do negócio?                  | Representa regras e funcionalidades particulares.          |
| REQUIREMENT        | O que precisa ser verdadeiro?                   | Transforma intenção em estado verificável.                 |
| RULE               | O que não pode ser violado?                     | Limita o agente e o processo.                              |
| SKILL              | Como executar um tipo de trabalho?              | Padroniza procedimentos reutilizáveis.                     |
| HARNESS            | Como o agente trabalha de forma controlada?     | Orquestra contexto, execução, testes, correção e registro. |
| TEST / EVAL        | Como verificar?                                 | Produz evidência de comportamento.                         |
| TRACEABILITY       | Onde requisito, código e evidência se conectam? | Permite auditoria e análise de impacto.                    |
| STATUS             | Onde estamos?                                   | Preserva memória operacional.                              |
| ADR                | Por que decidimos assim?                        | Preserva memória arquitetural.                             |
| DEFINITION OF DONE | Quando terminou de verdade?                     | Define gates objetivos de conclusão.                       |

## 1.21 Referências utilizadas neste capítulo — registro provisório

As referências abaixo são mantidas provisoriamente junto ao capítulo para conferência acadêmica durante a redação. Na versão final da obra, serão consolidadas, em ordem alfabética, no Capítulo 25 — Referências, preservando o padrão ABNT e os links de acesso.

CHANG, Yupeng; WANG, Xu; WANG, Jindong; WU, Yuan; YANG, Linyi; ZHU, Kaijie; CHEN, Hao; YI, Xiaoyuan; WANG, Cunxiang; WANG, Yidong; YE, Wei; ZHANG, Yue; CHANG, Yi; YU, Philip S.; YANG, Qiang; XIE, Xing. A Survey on Evaluation of Large Language Models. **ACM Transactions on Intelligent Systems and Technology**, v. 15, n. 3, art. 39, p. 1-45, 2024. Disponível em: https://doi.org/10.1145/3641289. Acesso em: 20 set. 2026.

JIMENEZ, Carlos E.; YANG, John; WETTIG, Alexander; YAO, Shunyu; PEI, Kexin; PRESS, Ofir; NARASIMHAN, Karthik. SWE-bench: Can Language Models Resolve Real-World GitHub Issues? In: INTERNATIONAL CONFERENCE ON LEARNING REPRESENTATIONS, 12., 2024. Proceedings \[...\]. 2024. Disponível em: https://proceedings.iclr.cc/paper_files/paper/2024/hash/edac78c3e300629acfe6cbe9ca88fb84-Abstract-Conference.html. Acesso em: 20 set. 2026.

LIU, Junwei; WANG, Kaixin; CHEN, Yixuan; PENG, Xin; CHEN, Zhenpeng; ZHANG, Lingming; LOU, Yiling. Large Language Model-Based Agents for Software Engineering: A Survey. arXiv, 2024. Disponível em: https://arxiv.org/abs/2409.02977. Acesso em: 20 set. 2026.

SCHICK, Timo; DWIVEDI-YU, Jane; DESSÌ, Roberto; RAILEANU, Roberta; LOMELI, Maria; HAMBRO, Eric; ZETTLEMOYER, Luke; CANCEDDA, Nicola; SCIALOM, Thomas. Toolformer: Language Models Can Teach Themselves to Use Tools. **Advances in Neural Information Processing Systems**, v. 36, p. 68539-68551, 2023. Disponível em: https://proceedings.neurips.cc/paper/2023/hash/d842425e4bf79ba039352da0f658a906-Abstract-Conference.html. Acesso em: 20 set. 2026.

WANG, Lei; MA, Chen; FENG, Xueyang; ZHANG, Zeyu; YANG, Hao; ZHANG, Jingsen; CHEN, Zhiyuan; TANG, Jiakai; CHEN, Xu; LIN, Yankai; ZHAO, Wayne Xin; WEI, Zhewei; WEN, Jirong. A survey on large language model based autonomous agents. **Frontiers of Computer Science**, v. 18, art. 186345, 2024. Disponível em: https://doi.org/10.1007/s11704-024-40231-1. Acesso em: 20 set. 2026.

WU, Qingyun; BANSAL, Gagan; ZHANG, Jieyu; WU, Yiran; LI, Beibin; ZHU, Erkang; JIANG, Li; ZHANG, Xiaoyun; ZHANG, Shaokun; LIU, Jiale; AWADALLAH, Ahmed Hassan; WHITE, Ryen W.; BURGER, Doug; WANG, Chi. AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation. In: CONFERENCE ON LANGUAGE MODELING, 2024. Proceedings \[...\]. 2024. Disponível em: https://arxiv.org/abs/2308.08155. Acesso em: 20 set. 2026.

XIA, Chunqiu Steven; DENG, Yinlin; DUNN, Soren; ZHANG, Lingming. Agentless: Demystifying LLM-based Software Engineering Agents. arXiv, 2024. Disponível em: https://arxiv.org/abs/2407.01489. Acesso em: 20 set. 2026.

YANG, John; JIMENEZ, Carlos E.; WETTIG, Alexander; LIERET, Kilian; YAO, Shunyu; NARASIMHAN, Karthik; PRESS, Ofir. SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering. **Advances in Neural Information Processing Systems**, v. 37, 2024. Disponível em: https://papers.nips.cc/paper_files/paper/2024/hash/5a7c947568c1b1328ccc5230172e1e7c-Abstract-Conference.html. Acesso em: 20 set. 2026.

YAO, Shunyu; ZHAO, Jeffrey; YU, Dian; DU, Nan; SHAFRAN, Izhak; NARASIMHAN, Karthik; CAO, Yuan. ReAct: Synergizing Reasoning and Acting in Language Models. In: INTERNATIONAL CONFERENCE ON LEARNING REPRESENTATIONS, 2023. Proceedings \[...\]. 2023. Disponível em: https://mlanthology.org/iclr/2023/yao2023iclr-react/. Acesso em: 20 set. 2026.

# CAPÍTULO 2 — DO MODELO DE LINGUAGEM AO AGENTE: COMPONENTES, FERRAMENTAS, MEMÓRIA, PLANEJAMENTO E AÇÃO

## 2.1 Por que distinguir modelo, assistente, workflow e agente

Antes de construir uma metodologia para desenvolvimento orientado a agentes, é necessário separar conceitos que frequentemente aparecem misturados. Um grande modelo de linguagem, ou LLM, é o componente capaz de processar contexto e produzir uma continuação textual ou estruturada. Um assistente combina esse modelo com instruções, interface e, eventualmente, algumas ferramentas. Um workflow define uma sequência de etapas previamente organizada. Um agente acrescenta um grau relevante de decisão sobre como perseguir um objetivo: observa o estado disponível, escolhe ações, utiliza ferramentas, interpreta resultados e pode modificar o curso da execução. Essas categorias não são fronteiras matematicamente rígidas, mas são úteis porque evitam atribuir ao modelo propriedades que pertencem ao sistema construído ao redor dele.

Essa distinção é particularmente importante na Engenharia de Software. Quando um desenvolvedor envia um arquivo e pede “corrija este código”, o modelo pode responder com uma sugestão. Quando um ambiente permite que ele procure o arquivo correto, leia dependências, edite o repositório, execute testes e tente novamente após uma falha, já existe uma arquitetura muito mais próxima de um agente. Wang et al. (2024) descrevem agentes baseados em LLMs a partir de componentes como perfil, memória, planejamento e ação. Revisões mais recentes continuam tratando percepção, memória, planejamento, uso de ferramentas e interação com o ambiente como elementos estruturantes das arquiteturas agênticas.

Para o ASES-300, a consequência prática é que o modelo nunca deve ser confundido com o sistema completo. Um projeto pode trocar o modelo e preservar grande parte do Harness, das regras, dos requisitos, dos testes e da memória persistente. Essa separação reduz dependência tecnológica e ajuda a localizar responsabilidades. Se uma operação destrutiva ocorreu sem autorização, por exemplo, a pergunta não deve ser apenas “por que o modelo fez isso?”, mas também “por que o ambiente disponibilizou essa ação, por que a política permitiu sua execução e por que nenhum gate a interrompeu?”.

## 2.2 O LLM como motor probabilístico, não como banco de dados nem executor universal

Um LLM é treinado para modelar padrões em grandes volumes de dados e gerar saídas condicionadas ao contexto recebido. Isso lhe confere impressionante capacidade linguística, de síntese, transformação, programação e raciocínio aproximado, mas não o transforma automaticamente em banco de dados atualizado, mecanismo de busca, calculadora exata, sistema de autorização ou executor de operações. Essa diferença parece elementar, porém muitos projetos fracassam justamente por pedir ao modelo que assuma responsabilidades que poderiam ser executadas de maneira mais confiável por componentes determinísticos.

Considere o cálculo de uma mensalidade. Se a regra é \`valor_base - desconto + taxa\`, com parâmetros armazenados no banco, não há razão para pedir a um LLM que “raciocine” sobre o resultado em produção. A aplicação deve executar uma função determinística e testável. O modelo pode explicar a regra ao usuário, gerar uma mensagem ou ajudar um desenvolvedor a implementar a função, mas a verdade operacional deve permanecer no código e nos dados. De modo semelhante, se o sistema precisa saber o status atual de um processo, deve consultar a fonte de dados; não deve esperar que o modelo recorde esse estado a partir do treinamento.

Essa separação constitui uma regra arquitetural importante do ASES-300: utilizar inteligência artificial quando a tarefa se beneficia de interpretação, geração, classificação semântica, planejamento ou interação em linguagem; utilizar mecanismos determinísticos quando a propriedade pode ser expressa e verificada de forma objetiva. O agente mais confiável não é aquele que faz tudo com o LLM, mas aquele que sabe quando delegar para ferramentas especializadas.

## 2.3 Anatomia mínima de um agente

Uma representação didática de um agente pode ser organizada em seis elementos: objetivo, contexto, política, memória, ferramentas e ciclo de execução. O objetivo define o estado que se pretende alcançar. O contexto contém informações relevantes para a decisão atual. A política — implementada por instruções, regras, código e controles — delimita como o agente deve se comportar. A memória preserva informações necessárias além da interação imediata. As ferramentas permitem observar ou modificar o ambiente. O ciclo de execução conecta tudo isso: perceber, decidir, agir, observar e decidir novamente.

No desenvolvimento de software, o objetivo pode ser \`REQ-347 — permitir importação de históricos acadêmicos\`. O contexto inclui SPEC, arquitetura, arquivos relacionados e estado atual. A política informa que migrations destrutivas exigem aprovação e que nenhuma rota pode ignorar autorização. A memória persistente inclui ADRs e STATUS. As ferramentas incluem leitura e escrita de arquivos, terminal, testes e banco de desenvolvimento. O ciclo termina não quando o agente produz código, mas quando o requisito alcança seu estado de aceite.

Essa anatomia explica por que dois agentes baseados no mesmo modelo podem apresentar comportamentos muito diferentes. Um pode ter acesso apenas a texto; outro pode operar terminal e navegador. Um recebe documentação cuidadosamente selecionada; outro recebe um megaprompt contraditório. Um possui testes e release gates; outro depende de autoavaliação. O modelo é importante, mas o sistema que o envolve determina grande parte do comportamento observável.

## 2.4 Percepção: como o agente conhece o estado do ambiente

Em agentes de software, percepção significa obter informações do ambiente antes e depois de agir. Ela pode ocorrer pela leitura de arquivos, resultados de busca no repositório, saída do compilador, mensagens de erro, respostas HTTP, logs, schemas de banco, screenshots, árvores de acessibilidade ou resultados de testes. Sem percepção adequada, o agente tende a preencher lacunas por inferência, e inferência sobre um sistema real pode gerar alterações tecnicamente plausíveis, porém incompatíveis com o estado verdadeiro do projeto.

Imagine que o agente precise adicionar um botão de exportação. Sem investigar o projeto, ele pode criar um novo componente, instalar uma biblioteca e implementar outra camada de autorização. Com boa percepção, ele descobre que já existe um \`DataTable\`, um serviço de exportação e uma policy compartilhada. A tarefa deixa de ser “inventar uma solução” e passa a ser “integrar-se corretamente à solução existente”. Essa diferença reduz duplicação e inconsistência.

No ASES-300, percepção deve ser tratada como etapa explícita. Antes de editar, o agente deve localizar artefatos relacionados, compreender contratos e identificar testes existentes. Depois de editar, deve observar o resultado de build, testes e verificações. O ciclo \`agir sem observar\` é uma das formas mais simples de produzir cascatas de erros.

## 2.5 Ferramentas: quando o agente ultrapassa os limites da geração textual

Ferramentas permitem que o agente faça aquilo que o modelo isolado não pode fazer com confiabilidade: consultar dados atuais, executar código, manipular arquivos, acessar APIs, pesquisar um repositório, rodar testes ou interagir com um sistema externo. Xu et al. (2025), em revisão sobre tool learning para agentes baseados em LLMs, destacam que a integração com ferramentas envolve problemas de descoberta, seleção, planejamento e execução. Não basta possuir uma lista de ferramentas; o agente precisa identificar qual ferramenta atende à subtarefa, fornecer argumentos corretos e interpretar o resultado.

Um exemplo simples é a verificação de tipos. O agente pode ler TypeScript e acreditar que a alteração está correta, mas \`tsc\` é a ferramenta apropriada para testar a propriedade. Para verificar uma migration, a ferramenta adequada pode ser um banco temporário. Para conhecer uma versão atual de uma biblioteca, uma fonte documental atualizada é melhor do que memória paramétrica. O princípio geral é substituir suposições verificáveis por observações sempre que uma ferramenta confiável estiver disponível.

Ferramentas também ampliam risco. Uma ferramenta de leitura possui impacto diferente de uma ferramenta capaz de apagar tabelas ou realizar deploy. Por isso, o Harness deve classificar capacidades, limitar escopos e introduzir confirmação para operações de alto impacto. A questão de engenharia deixa de ser apenas “o agente consegue usar esta ferramenta?” e passa a incluir “deveria conseguir?”, “em qual ambiente?”, “com quais permissões?” e “que evidência será registrada?”.

## 2.6 Tool calling, contratos e schemas

Para que um agente utilize ferramentas de maneira robusta, a interface da ferramenta precisa ser explícita. Nome, descrição, parâmetros, tipos, valores obrigatórios, efeitos colaterais e possíveis erros constituem um contrato. Quanto mais ambíguo esse contrato, maior a probabilidade de chamadas incorretas. Essa é uma razão pela qual schemas estruturados são tão importantes em sistemas agênticos: eles transformam intenções linguísticas em chamadas com formato verificável.

Considere uma ferramenta \`delete_user(user_id, hard_delete)\`. Se a descrição não explicar a diferença entre exclusão lógica e física, o agente pode selecionar \`hard_delete=true\` sem compreender o impacto. Uma interface melhor pode separar capacidades: \`archive_user\` disponível ao fluxo normal e \`purge_user\` restrita a um processo administrativo com aprovação. O design da ferramenta, portanto, também é design de segurança.

No ASES-300, ferramentas devem ser documentadas como parte da superfície operacional do Harness. Para cada ferramenta relevante, convém registrar propósito, parâmetros, permissões, efeitos colaterais, idempotência, ambiente permitido, necessidade de confirmação e logs esperados. Ferramentas perigosas não devem depender apenas de uma instrução textual dizendo “tenha cuidado”.

## 2.7 Planejamento: decompor antes de executar

Planejamento é a capacidade de transformar um objetivo de alto nível em uma sequência ou estrutura de subtarefas. Huang et al. (2024) organizam a literatura de planejamento em agentes de LLM em categorias que incluem decomposição de tarefas, seleção de planos, uso de módulos externos, reflexão e memória. Para Engenharia de Software, a decomposição é especialmente importante porque tarefas aparentemente simples atravessam camadas diferentes.

Suponha o requisito “permitir que gestores exportem somente os registros de suas unidades”. Um plano razoável pode envolver: localizar o modelo de autorização organizacional; verificar como a listagem filtra registros; localizar o serviço de exportação; aplicar a mesma policy no backend; criar testes de unidade para o filtro; criar teste de integração para exportação; verificar que a interface não envia escopo arbitrário; registrar auditoria. Sem decomposição, o agente pode implementar apenas o botão e considerar a tarefa concluída.

O planejamento, contudo, não deve virar ritual burocrático. Para uma correção trivial de texto, um plano de vinte etapas desperdiça contexto e tempo. O Harness deve graduar a profundidade do plano conforme risco, abrangência e reversibilidade. Uma regra útil é: quanto maior a quantidade de componentes afetados e quanto maior o custo de erro, maior deve ser a explicitação do plano.

## 2.8 Planos estáticos, dinâmicos e replanejamento

Um plano estático é elaborado antes da execução e seguido até o fim. Ele funciona bem quando o ambiente é previsível. Desenvolvimento de software frequentemente exige planejamento dinâmico, porque novas informações surgem durante a execução. Um teste revela comportamento não documentado; uma dependência está incompatível; um endpoint existente já resolve parte do problema; uma migration falha. Nesses casos, insistir no plano original pode ser pior do que replanejar.

Um ciclo agêntico maduro diferencia desvio legítimo de improvisação descontrolada. O agente pode ajustar o plano quando recebe nova evidência, mas deve preservar requisitos e regras. Se a implementação planejada não funciona, pode escolher outra técnica; se o critério de aceite é inconveniente, não pode simplesmente alterá-lo. O plano é adaptável; o contrato do requisito não é livremente reescrito pelo executor.

Essa distinção é fundamental no ASES-300. Replanejamento é permitido dentro dos limites de produto, arquitetura, segurança e decisões registradas. Mudanças que ultrapassem esses limites devem produzir um bloqueio ou pedido de decisão, não uma alteração silenciosa do contrato.

## 2.9 Memória de curto prazo, memória persistente e memória do projeto

Agentes precisam lidar com diferentes horizontes de informação. A memória de curto prazo corresponde ao contexto necessário para a interação atual: objetivo, arquivos recentemente lidos, resultados de ferramentas e decisões locais. Memória persistente preserva informações entre sessões ou tarefas. Zhang et al. (2024) destacam a memória como componente central para interações de longo prazo entre agente e ambiente, discutindo mecanismos de construção, operação e avaliação de memória.

No ASES-300, entretanto, a memória mais importante para Engenharia de Software não deve ficar escondida em um mecanismo opaco de lembranças do agente. O projeto precisa possuir memória documental explícita. Requisitos, ADRs, changelogs, STATUS, schemas, testes e commits são formas de memória verificável. Eles podem ser versionados, revisados e utilizados por pessoas ou agentes diferentes.

Isso evita um problema conceitual: memória não é verdade. Uma lembrança pode estar desatualizada. Se \`STATUS.md\` diz que uma API utiliza \`/v1/users\`, mas o código atual foi migrado para \`/v2/users\`, o agente deve reconciliar as fontes e atualizar a documentação. Memória operacional precisa de governança, assim como qualquer outra fonte de conhecimento.

## 2.10 Recuperação de contexto e RAG

Quando o volume de informação ultrapassa aquilo que pode ou deve ser colocado integralmente no contexto, torna-se necessário recuperar seletivamente informações relevantes. Retrieval-Augmented Generation, ou RAG, combina recuperação de documentos ou trechos com geração condicionada ao material recuperado. Em um agente de desenvolvimento, uma ideia semelhante pode ser aplicada ao próprio repositório: localizar requisitos, decisões, arquivos e documentação relevantes para a tarefa atual em vez de carregar todo o projeto indiscriminadamente.

É importante, porém, não transformar RAG em sinônimo de qualquer busca. Busca textual, navegação por símbolos, consultas estruturadas, embeddings e recuperação híbrida são estratégias diferentes. Se o agente procura exatamente \`REQ-111\`, busca lexical é excelente. Se procura “onde está implementada a política que restringe campos sensíveis?”, recuperação semântica pode ajudar. Se precisa saber quais endpoints usam determinada função, análise estática pode ser superior às duas.

No ASES-300, a recuperação de contexto deve obedecer ao princípio da ferramenta apropriada. RAG é \`CONDITIONAL\`, não dogma. Quando utilizado, precisa de critérios de chunking, indexação, atualização, proveniência e avaliação. Quando não existe necessidade de recuperação semântica, o requisito pode ser marcado \`N/A\` com justificativa.

## 2.11 Ação: modificar o ambiente com limites claros

A ação diferencia um agente operacional de um sistema que apenas recomenda. Em Engenharia de Software, ações incluem editar arquivos, criar migrations, instalar dependências, executar testes, abrir pull requests, publicar artefatos e realizar deploy. Cada ação altera o estado do ambiente ou produz uma observação nova. Por isso, ações precisam ser classificadas por impacto e reversibilidade.

Uma edição local em branch descartável é altamente reversível. Um deploy em produção possui impacto maior. Uma migration destrutiva pode ser irreversível sem backup. O Harness deve refletir essas diferenças. Ações de baixo risco podem ser automáticas; ações de médio risco podem exigir evidência adicional; ações críticas podem exigir aprovação humana. Essa gradação permite autonomia sem tratar todas as capacidades como equivalentes.

Também é útil exigir idempotência quando possível. Se o agente repetir uma ação após timeout, o resultado não deve ser duplicado inadvertidamente. Scripts de seed, migrations e chamadas de automação precisam ser desenhados com essa possibilidade em mente. Agentes aumentam a importância de interfaces operacionais previsíveis.

## 2.12 Observação, feedback e reflexão

Depois de agir, o agente precisa observar. Uma edição seguida de \`npm test\` produz feedback. Uma requisição HTTP produz status e corpo. Um screenshot revela comportamento visual. Esse retorno fecha o ciclo agente-ambiente. Sem ele, a execução é essencialmente aberta: o agente age e presume sucesso.

Reflexão é um conceito mais amplo. O agente pode comparar o resultado com o objetivo, identificar discrepâncias e decidir o próximo passo. Em desenvolvimento, a reflexão útil não deve depender apenas de autocrítica textual. Ela deve ser ancorada em evidências: qual teste falhou, qual requisito não foi satisfeito, qual log indica erro, qual comportamento divergiu do esperado. A reflexão baseada em observações concretas é mais útil do que perguntar genericamente ao modelo “você tem certeza?”.

Esse princípio conduz diretamente ao Harness do ASES-300: \`IMPLEMENTAR → OBSERVAR → COMPARAR → CORRIGIR → VERIFICAR\`. A reflexão existe dentro de um sistema de controle e não como substituta de testes.

## 2.13 Agente único, múltiplos agentes e especialização

Sistemas multiagentes distribuem responsabilidades entre múltiplos agentes ou papéis. Um agente pode planejar, outro implementar, outro revisar segurança e outro avaliar testes. Li et al. (2024) e He, Treude e Lo (2025) discutem arquiteturas e aplicações de sistemas multiagentes baseados em LLMs, incluindo desafios de coordenação, comunicação e infraestrutura. A especialização pode melhorar separação de responsabilidades, mas também aumenta custo e complexidade.

Em um projeto ASES-300, não se deve criar múltiplos agentes apenas porque a arquitetura parece sofisticada. Se um único agente, bem equipado e bem verificado, consegue executar a tarefa, a solução simples pode ser preferível. Multiagentes tornam-se interessantes quando existe benefício concreto: revisão independente, paralelização de tarefas pouco acopladas, especialização por domínio ou necessidade de papéis adversariais, como implementador e auditor.

Mesmo nesses casos, a fonte de verdade deve permanecer compartilhada. Dois agentes não podem possuir definições incompatíveis de DONE. Ambos devem consultar os mesmos requisitos, ADRs e políticas. O Harness coordena não apenas agente e ferramentas, mas também agentes entre si.

## 2.14 Skills: conhecimento procedimental reutilizável

Uma Skill descreve como executar bem uma categoria de trabalho. Ela não é o requisito do produto e não é a regra de negócio. Se o requisito diz “o sistema deve exportar XLSX”, uma Skill de exportação pode explicar padrões de implementação, bibliotecas aprovadas, tratamento de tipos, limites de volume e testes recomendados. Se o requisito diz “todas as migrations devem ser reversíveis quando tecnicamente possível”, uma Skill de banco pode orientar criação, teste e rollback.

Separar Skills de requisitos evita repetição. Cem requisitos podem depender da mesma prática de segurança. Em vez de reescrever o procedimento completo em cada REQ, o requisito aponta para a Skill relevante. Isso também facilita evolução: a organização pode melhorar a Skill de testes sem alterar o significado de cada requisito.

No ASES-300, Skills funcionam como conhecimento procedimental versionado. Elas devem ser específicas o suficiente para orientar ação, mas gerais o suficiente para reutilização. Uma Skill não deve esconder decisões de produto; se uma regra é obrigatória para o sistema, precisa existir também em requisito, regra ou arquitetura apropriada.

## 2.15 Rules: limites que o agente não negocia

Rules representam restrições operacionais ou arquiteturais que não devem ser silenciosamente flexibilizadas pelo agente. Exemplos: não executar deploy em produção sem aprovação; não colocar secrets no repositório; não desabilitar testes para obter pipeline verde; não remover validação de autorização para corrigir um erro; não alterar um requisito crítico sem decisão humana. Enquanto requisitos descrevem estados do produto, Rules governam o comportamento de desenvolvimento.

Essa separação é importante porque uma regra pode valer para centenas de requisitos. \`Nunca resolver um teste falho removendo a asserção sem justificar a mudança\` não é funcionalidade do usuário, mas é essencial para integridade do processo. O Harness deve carregar essas regras antes de executar trabalho e, quando possível, convertê-las em controles técnicos.

A melhor Rule é aquela que não depende apenas de obediência textual. Secrets podem ser detectados por scanners; branches protegidas podem bloquear pushes; políticas de CI podem impedir merge com testes falhos. O ASES-300 procura transformar regras críticas em enforcement sempre que tecnicamente possível.

## 2.16 Guardrails e o princípio da defesa em profundidade

Guardrails são mecanismos que limitam, validam ou redirecionam comportamento. Podem existir na entrada, durante a decisão, na chamada de ferramenta, na saída ou na infraestrutura. Em agentes de software, exemplos incluem schemas de ferramenta, allowlists de comandos, ambientes sandbox, proteção de branches, políticas de autorização e confirmação humana para operações destrutivas.

É arriscado depender de um único guardrail. Uma instrução no prompt pode falhar; uma validação no frontend pode ser contornada; uma permissão excessiva no token pode transformar um erro em incidente. Defesa em profundidade combina camadas independentes. Se o agente tentar publicar diretamente em produção, a Rule pode proibir, a ferramenta pode não oferecer a capacidade e a infraestrutura pode exigir aprovação.

No ASES-300, guardrails críticos devem aparecer em mais de uma camada quando o risco justificar. O objetivo não é tornar o agente incapaz de trabalhar, mas reduzir a distância entre um erro de raciocínio e uma consequência grave.

## 2.17 Sandbox: liberdade para experimentar sem liberdade para destruir

Sandbox é um ambiente isolado no qual ações podem ser executadas com impacto limitado. Para agentes de desenvolvimento, uma sandbox pode ser um container, branch temporária, banco descartável, namespace isolado ou ambiente de preview. O agente pode instalar dependências, executar migrations, iniciar servidores e testar hipóteses sem tocar diretamente em produção.

A sandbox aumenta autonomia justamente porque reduz o custo do erro. Um agente autorizado a experimentar em ambiente descartável pode tentar, observar e corrigir. Sem isolamento, cada tentativa precisa ser tratada como potencial alteração permanente. Assim, segurança e produtividade não são necessariamente opostas; um ambiente seguro pode permitir mais experimentação.

O Harness deve saber em qual ambiente está operando. Comandos aceitáveis em desenvolvimento podem ser proibidos em produção. Scripts precisam tornar essa distinção explícita para evitar que uma mesma instrução tenha efeitos radicalmente diferentes dependendo do contexto.

## 2.18 MCP e padronização da conexão com ferramentas e contexto

À medida que agentes utilizam mais ferramentas e fontes de contexto, cresce a necessidade de interfaces padronizadas. O Model Context Protocol, conhecido pela sigla MCP, popularizou uma abordagem para conectar aplicações de IA a ferramentas, recursos e fontes de contexto por meio de contratos consistentes. Conceitualmente, seu valor para o ASES-300 está menos em uma tecnologia específica e mais no princípio de desacoplamento: o agente não deveria precisar de uma integração artesanal e completamente diferente para cada capacidade.

Em um projeto, um servidor ou conector pode expor documentação, banco de desenvolvimento, issues ou ferramentas internas. O agente descobre capacidades e utiliza interfaces estruturadas. Isso favorece reutilização e portabilidade, mas não elimina governança. Uma ferramenta exposta via protocolo padronizado continua precisando de autenticação, autorização, escopo e auditoria.

Por isso, MCP não é sinônimo de Harness. Ele pode ser uma parte da camada de ferramentas do Harness. O Harness é mais amplo: decide quando contexto é carregado, quais regras se aplicam, quais ferramentas são permitidas, como resultados são avaliados e quando um requisito pode avançar.

## 2.19 Observabilidade do agente

Se agentes tomam decisões e executam ações, torna-se necessário compreender o que ocorreu. Observabilidade inclui registros de chamadas de ferramentas, duração, erros, custos, requisitos trabalhados, artefatos modificados e resultados de verificações. Em componentes probabilísticos, também pode incluir versões de prompts, modelos e configurações relevantes.

Isso não significa registrar indiscriminadamente raciocínio interno ou dados sensíveis. O objetivo é produzir telemetria operacional suficiente para reconstruir eventos e diagnosticar falhas. Se um agente modificou cinco arquivos e um teste começou a falhar, deve ser possível relacionar tarefa, alterações e resultado. Se uma ferramenta externa apresentou timeout, esse fato deve aparecer como causa potencial.

No ASES-300, observabilidade sustenta rastreabilidade. Requisitos dizem o que deveria acontecer; logs e evidências ajudam a demonstrar o que aconteceu. Essa conexão será aprofundada nos capítulos dedicados a Evals, rastreabilidade e Definition of Done.

## 2.20 Custos, latência e limites de autonomia

Agentes executam ciclos e cada ciclo possui custo. Há custo de tokens, chamadas de ferramentas, processamento, armazenamento, APIs externas e tempo de execução. Um agente que relê o repositório inteiro a cada tarefa ou executa uma suíte E2E completa após cada alteração de uma linha pode ser correto, porém economicamente ineficiente. Engenharia de Harness também é engenharia de recursos.

Uma estratégia madura utiliza verificações em camadas. Durante implementação, executam-se testes diretamente relacionados e verificações rápidas. Em checkpoints, executam-se regressões mais amplas. Antes do release, executa-se a suíte completa exigida pela Definition of Done. De forma semelhante, contexto pode ser recuperado sob demanda em vez de sempre carregar todos os documentos.

O objetivo é minimizar custo sem reduzir garantias essenciais. Otimização não deve significar pular segurança, mas escolher o momento e o mecanismo mais eficientes para produzir a evidência necessária.

## 2.21 Falhas típicas de agentes em Engenharia de Software

Agentes podem apresentar padrões recorrentes de falha: modificar o arquivo errado, duplicar funcionalidade existente, resolver sintomas sem compreender causa, inventar APIs, introduzir dependências desnecessárias, enfraquecer testes, ignorar autorização, esquecer migrações, alterar contratos não relacionados ou declarar conclusão prematuramente. Esses problemas não significam que agentes sejam inúteis; indicam que autonomia precisa de estrutura.

Uma metodologia útil não tenta resolver todas as falhas com uma instrução genérica como “seja cuidadoso”. Cada classe de falha pode receber controles específicos. Duplicação é reduzida por investigação prévia e busca no repositório. APIs inventadas são reduzidas por documentação e typecheck. Regressões são detectadas por testes. Alterações arquiteturais são controladas por ADR e Rules. Falso DONE é bloqueado por critérios de aceite e release gates.

O ASES-300 transforma, portanto, falhas previsíveis em requisitos do próprio processo. O Harness não pressupõe perfeição do agente; ele é desenhado precisamente porque erros são possíveis.

## 2.22 Exemplo completo: um requisito atravessando o ciclo agêntico

Considere \`REQ-X — Usuários com perfil ANALISTA podem editar o campo status, mas não o campo valor\`. O agente começa lendo o requisito e identifica dependências: autenticação, modelo de papéis, endpoint de atualização e formulário. Em seguida investiga o repositório. Descobre que a interface já desabilita \`valor\`, mas a API aceita qualquer campo enviado. A percepção revela que o sistema está parcialmente correto e parcialmente vulnerável.

O plano é então decomposto: localizar policy de campos; adicionar regra de escrita; garantir que payload proibido seja rejeitado ou sanitizado conforme contrato; manter leitura se permitida; criar teste de integração enviando alteração de \`valor\`; criar teste positivo para \`status\`; verificar formulário; executar regressão de atualização; registrar evidência. O agente implementa e roda testes. O primeiro teste falha porque um service utiliza atualização genérica. O agente observa, corrige a camada de serviço e repete.

Somente quando o teste proibido demonstra que \`valor\` não pode ser alterado, o teste permitido confirma \`status\`, a regressão passa e a interface permanece consistente, o requisito pode receber \`PASS\`. O exemplo mostra todos os elementos deste capítulo: objetivo, contexto, percepção, planejamento, ação, ferramentas, feedback, memória e Harness.

## 2.23 Quando não usar um agente

Nem toda automação precisa de agência. Se uma sequência é completamente previsível, um script tradicional pode ser mais barato, rápido e auditável. Formatar arquivos, executar lint, gerar código a partir de schema, aplicar migration conhecida ou copiar artefatos entre diretórios são exemplos em que ferramentas determinísticas frequentemente são superiores. Inserir um LLM no meio apenas aumenta variabilidade.

Um bom critério é perguntar se a tarefa exige interpretação contextual e adaptação diante de situações não previstas. Quando a resposta é não, prefira automação convencional. Quando a resposta é sim, um agente pode ser apropriado, desde que o ambiente forneça controles. Essa escolha evita o chamado agent washing: chamar de agente qualquer sequência automatizada ou utilizar agentes apenas por novidade.

No ASES-300, a arquitetura pode conter scripts, workflows, serviços determinísticos e agentes simultaneamente. O método não é uma defesa de que tudo deve ser agêntico; é uma proposta para que, quando agentes forem usados, trabalhem dentro de uma estrutura de Engenharia de Software verificável.

## 2.24 Relação entre Agent, Harness, Product e Domain

É útil encerrar o capítulo conectando quatro conceitos. \`PRODUCT\` descreve o produto que deve existir: problema, público, objetivos, escopo e valor. \`DOMAIN\` descreve as regras específicas do universo em que o produto opera. \`AGENT\` é um executor capaz de perseguir objetivos por meio de contexto, decisão e ação. \`HARNESS\` é o ambiente de engenharia que organiza como esse executor trabalha no projeto.

Um erro de produto não é corrigido com um agente melhor. Se o objetivo foi definido incorretamente, o agente pode implementar com excelência a coisa errada. Um erro de domínio também não é solucionado apenas por mais raciocínio; a regra precisa estar corretamente representada. Da mesma forma, um bom Product e um bom Domain não garantem execução confiável se o agente não possui ferramentas, testes e limites adequados. As camadas são complementares.

Essa separação será importante quando o livro entrar nos 300 requisitos. Alguns requisitos descrevem produto e contexto; outros descrevem arquitetura e segurança; outros regulam o Harness. Todos pertencem ao mesmo método, mas não desempenham a mesma função.

## 2.25 Conclusão

O agente de software pode ser compreendido como um sistema no qual um LLM participa de um ciclo de percepção, decisão e ação, apoiado por contexto, memória e ferramentas. Sua capacidade real depende tanto do modelo quanto da arquitetura que o envolve. A literatura recente converge em componentes como planejamento, memória, uso de ferramentas, interação com ambiente e mecanismos de feedback, embora diferentes trabalhos organizem essas dimensões de maneiras distintas (WANG et al., 2024; HUANG et al., 2024; XU et al., 2025).

Para o ASES-300, a principal conclusão é operacional: não se deve confiar apenas na inteligência aparente do modelo. O projeto precisa fornecer contexto correto, ferramentas adequadas, permissões proporcionais ao risco, memória persistente, critérios de aceite, testes, Evals, observabilidade e gates. Um agente poderoso dentro de um ambiente mal desenhado continua sendo um sistema mal desenhado.

No Capítulo 3, essa base permitirá aprofundar o conceito de Harness Engineering: sua arquitetura, seus documentos, o ciclo operacional, a separação entre SPEC, Rules, Skills, Tools, Evals, STATUS e ADRs e a forma pela qual esses elementos transformam autonomia em desenvolvimento controlado.

## 2.26 Quadro comparativo: modelo, workflow, agente e Harness

| Elemento | Função principal                                  | Decide próximos passos?           | Age no ambiente?                    | Exemplo                                                      |
|----------|---------------------------------------------------|-----------------------------------|-------------------------------------|--------------------------------------------------------------|
| LLM      | Gerar/transformar informação a partir de contexto | Limitadamente, dentro da resposta | Não necessariamente                 | Produzir uma função ou explicar um erro                      |
| Workflow | Executar sequência previamente definida           | Em geral, pouco                   | Sim, conforme etapas fixas          | Build → test → deploy                                        |
| Agente   | Perseguir objetivo adaptando ações                | Sim                               | Sim, quando possui ferramentas      | Investigar issue, editar, testar e corrigir                  |
| Harness  | Governar e instrumentar o trabalho do agente      | Orquestra limites e ciclo         | Controla as capacidades disponíveis | SPEC + Rules + Skills + Tools + Tests/Evals + STATUS + gates |

## 2.27 Exemplo de ciclo operacional em pseudocódigo

> while project.has_pending_requirements():  
> req = harness.select_next_requirement()  
> context = harness.load_relevant_context(req)  
> plan = agent.plan(req, context)  
>   
> while not req.accepted:  
> agent.implement(plan)  
> evidence = harness.verify(req)  
>   
> if evidence.passed:  
> harness.record_pass(req, evidence)  
> else:  
> plan = agent.replan(evidence)  
> harness.record_failure(req, evidence)  
>   
> release = harness.evaluate_definition_of_done()

O pseudocódigo é propositalmente simples. Ele não representa uma implementação obrigatória, mas torna visível a lógica do método: selecionar requisito, carregar contexto, planejar, implementar, verificar, corrigir e registrar. O elemento decisivo é que \`accepted\` não depende de uma frase do agente. Ele depende da verificação associada ao requisito. A Definition of Done, por sua vez, atua como gate global depois que os requisitos individuais foram processados.

## 2.28 Perguntas de fixação

1\. Qual é a diferença entre um LLM e um agente?

2\. Por que um agente não deve utilizar o próprio LLM para tarefas determinísticas que possuem ferramenta mais confiável?

3\. O que significa percepção em um agente de Engenharia de Software?

4\. Por que o design de uma ferramenta também é um problema de segurança?

5\. Qual é a diferença entre plano e requisito?

6\. Em que situação o agente pode replanejar sem pedir autorização?

7\. Por que ADR e STATUS representam tipos diferentes de memória?

8\. Quando RAG pode ser marcado como N/A?

9\. Qual é a diferença entre Skill e Rule?

10\. Por que um Harness não é apenas um arquivo HARNESS.md?

11\. Quando um script tradicional deve ser preferido a um agente?

12\. O que transforma a afirmação “implementei” em evidência de conclusão?

## 2.29 Referências utilizadas neste capítulo — registro provisório

As referências deste capítulo serão consolidadas no Capítulo 25 — Referências. Mantêm-se aqui, provisoriamente, para conferência durante a construção da obra. Foram priorizados trabalhos recentes, de acesso aberto e provenientes de periódicos, conferências ou repositórios acadêmicos reconhecidos.

ABOU ALI, Mohamad; DORNAIKA, Fadi; CHARAFEDDINE, Jinan. Agentic AI: a comprehensive survey of architectures, applications, and future directions. **Artificial Intelligence Review**, v. 59, art. 11, 2026. Disponível em: https://doi.org/10.1007/s10462-025-11422-4. Acesso em: 20 set. 2026.

HE, Junda; TREUDE, Christoph; LO, David. LLM-Based Multi-Agent Systems for Software Engineering: Literature Review, Vision, and the Road Ahead. **ACM Transactions on Software Engineering and Methodology**, v. 34, n. 5, art. 124, p. 1-30, 2025. Disponível em: https://doi.org/10.1145/3712003. Acesso em: 20 set. 2026.

HUANG, Xu; LIU, Weiwen; CHEN, Xiaolong; WANG, Xingmei; WANG, Hao; LIAN, Defu; WANG, Yasheng; TANG, Ruiming; CHEN, Enhong. Understanding the planning of LLM agents: A survey. arXiv, 2024. Disponível em: https://arxiv.org/abs/2402.02716. Acesso em: 20 set. 2026.

LI, Xinyi; WANG, Sai; ZENG, Siqi; WU, Yu; YANG, Yi. A survey on LLM-based multi-agent systems: workflow, infrastructure, and challenges. **Vicinagearth**, v. 1, art. 9, 2024. Disponível em: https://doi.org/10.1007/s44336-024-00009-2. Acesso em: 20 set. 2026.

LI, Xinzhe. A Review of Prominent Paradigms for LLM-Based Agents: Tool Use (Including RAG), Planning, and Feedback Learning. arXiv, 2024. Disponível em: https://doi.org/10.48550/arXiv.2406.05804. Acesso em: 20 set. 2026.

WANG, Lei; MA, Chen; FENG, Xueyang; ZHANG, Zeyu; YANG, Hao; ZHANG, Jingsen; CHEN, Zhiyuan; TANG, Jiakai; CHEN, Xu; LIN, Yankai; ZHAO, Wayne Xin; WEI, Zhewei; WEN, Jirong. A survey on large language model based autonomous agents. **Frontiers of Computer Science**, v. 18, art. 186345, 2024. Disponível em: https://doi.org/10.1007/s11704-024-40231-1. Acesso em: 20 set. 2026.

XU, Weikai; HUANG, Chengrui; GAO, Shen; SHANG, Shuo. LLM-Based Agents for Tool Learning: A Survey. **Data Science and Engineering**, v. 10, p. 533-563, 2025. Disponível em: https://doi.org/10.1007/s41019-025-00296-9. Acesso em: 20 set. 2026.

ZHANG, Zeyu; BO, Xiaohe; MA, Chen; LI, Rui; CHEN, Xu; DAI, Quanyu; ZHU, Jieming; DONG, Zhenhua; WEN, Jirong. A Survey on the Memory Mechanism of Large Language Model based Agents. arXiv, 2024. Disponível em: https://arxiv.org/abs/2404.13501. Acesso em: 20 set. 2026.

# CAPÍTULO 3 — HARNESS ENGINEERING: A ENGENHARIA DO AMBIENTE QUE TORNA O AGENTE CONFIÁVEL

## 3.1 Do agente capaz ao sistema confiável

Os dois capítulos anteriores estabeleceram duas ideias que precisam agora ser reunidas. A primeira é que gerar código não equivale a construir software. A segunda é que um agente não é apenas um modelo de linguagem: ele atua dentro de um sistema composto por contexto, ferramentas, memória, políticas, mecanismos de observação e ciclos de decisão. Harness Engineering surge exatamente no encontro dessas duas ideias. Se o agente será utilizado como participante ativo do processo de desenvolvimento, torna-se necessário projetar o ambiente que transforma sua capacidade generativa em trabalho disciplinado, observável, recuperável e verificável.

Em 2026, o termo harness engineering passou a aparecer explicitamente no vocabulário de equipes que desenvolvem software com agentes. Um relato técnico da OpenAI descreve uma experiência em que engenheiros deixaram de escrever diretamente o código e passaram a concentrar seu trabalho em sistemas, scaffolding, especificação de intenção e loops de feedback que permitissem aos agentes operar de maneira confiável. A formulação é especialmente relevante para o ASES-300 porque desloca a pergunta central: em vez de perguntar apenas “como escrever um prompt melhor?”, pergunta-se “que capacidades, informações, restrições e mecanismos de feedback precisam existir para que o agente consiga produzir e verificar uma mudança correta?”.

Essa mudança não diminui a importância do modelo. Um modelo mais capaz pode planejar melhor, interpretar mais contexto e resolver problemas mais difíceis. Entretanto, a capacidade do modelo é apenas uma variável. Um agente excelente, colocado em um repositório sem documentação, sem testes, sem comandos padronizados e com permissões excessivas, pode produzir resultados inferiores aos de um agente menos capaz trabalhando em um ambiente legível, testável e bem delimitado. Harness Engineering é, portanto, engenharia do entorno operacional do agente.

## 3.2 O que é um Harness no contexto desta obra

Nesta obra, Harness é definido como o conjunto de mecanismos que envolve o agente e organiza a transformação de uma intenção em uma execução verificável. Ele inclui carregamento e seleção de contexto, instruções operacionais, ferramentas, permissões, estado de trabalho, memória persistente, planejamento, ciclos de execução, testes, Evals, observabilidade, critérios de aceite, tratamento de falhas, evidências e gates de conclusão. O Harness pode possuir componentes documentais, componentes executáveis e controles de infraestrutura.

É importante distinguir Harness de \`HARNESS.md\`. O arquivo Markdown documenta o protocolo operacional, mas não é o Harness inteiro. Da mesma forma que um manual de laboratório não é o laboratório, o documento não executa sozinho typecheck, não impede um deploy destrutivo e não registra automaticamente evidências. Um Harness maduro combina texto legível por humanos e agentes com scripts, CI, políticas de acesso, testes, schemas e mecanismos de estado.

A documentação atual do Microsoft Agent Framework utiliza uma definição convergente: o agent harness é o scaffolding de runtime que transforma um modelo em um agente capaz de executar trabalho, dirigindo chamadas ao modelo e às ferramentas, gerenciando estado e contexto e aplicando políticas de aprovação. Embora implementações específicas variem, essa formulação reforça a ideia central do ASES-300: o Harness é uma camada operacional, não apenas um prompt.

## 3.3 Harness Engineering não é Prompt Engineering com outro nome

Prompt Engineering trabalha principalmente com a formulação de instruções e exemplos fornecidos ao modelo. Context Engineering amplia esse foco para a seleção, transformação e gerenciamento sistemático das informações disponibilizadas durante a inferência. Harness Engineering incorpora ambos, mas acrescenta execução, ferramentas, políticas, estado, feedback e verificação. As três disciplinas se relacionam, porém não são equivalentes.

Um prompt pode dizer “execute os testes antes de terminar”. Context Engineering pode garantir que o agente receba os comandos corretos e saiba quais testes correspondem ao módulo alterado. Harness Engineering pode efetivamente executar o comando, capturar o exit code, impedir a marcação de PASS se houver falha e registrar o resultado como evidência. A diferença está na passagem de uma recomendação linguística para um mecanismo operacional.

Pesquisas recentes sobre Context Engineering tratam o contexto como objeto sistemático de projeto, envolvendo recuperação, geração, processamento e gerenciamento de informação. Mohsenimofidi et al. (2025), especificamente no contexto de agentes para software open source, observam a necessidade de fornecer informações sobre arquitetura, interfaces, convenções e workflows do projeto. Para o ASES-300, Context Engineering é uma camada essencial do Harness, mas o Harness continua além dela porque governa também ação e verificação.

## 3.4 A equação conceitual do Harness

Uma forma didática de representar o Harness do ASES-300 é por meio da seguinte relação: \`HARNESS = CONTEXTO + REGRAS + ESTADO + FERRAMENTAS + EXECUÇÃO + FEEDBACK + VERIFICAÇÃO + EVIDÊNCIA + CONTROLE\`. Cada termo resolve uma classe diferente de problema. Contexto reduz ignorância; regras limitam decisões; estado permite continuidade; ferramentas conectam o agente ao ambiente; execução transforma intenção em mudança; feedback informa o que ocorreu; verificação compara resultado e requisito; evidência torna a conclusão auditável; controle determina quando o agente pode continuar ou precisa de intervenção.

Essa equação não deve ser lida como fórmula matemática, mas como checklist arquitetural. Um sistema pode possuir ferramentas e execução, porém não possuir memória persistente; nesse caso, funciona em tarefas curtas, mas perde continuidade. Pode possuir contexto e regras, mas nenhuma verificação; nesse caso, produz alterações bem orientadas, porém não comprovadas. Pode possuir testes, mas não associá-los a requisitos; nesse caso, há qualidade técnica, mas pouca rastreabilidade.

O objetivo do ASES-300 é tornar explícitas essas dimensões para que o projeto consiga evoluir gradualmente. Nem todo Harness começa sofisticado. Um projeto pequeno pode iniciar com \`AGENTS.md\`, SPEC, testes e um script \`verify\`. À medida que cresce, pode adicionar STATUS, ADRs, matriz de rastreabilidade, Evals especializados, políticas de aprovação e observabilidade. A arquitetura é progressiva, mas o princípio permanece: autonomia deve ser acompanhada por mecanismos proporcionais de controle e prova.

## 3.5 O Harness como sistema de controle em malha fechada

Uma analogia poderosa vem da teoria de controle. Um processo em malha aberta executa uma ação sem utilizar o resultado para corrigir o comportamento. Um processo em malha fechada mede a saída, compara com uma referência e ajusta a ação. Agentes de desenvolvimento sem Harness frequentemente operam como malha aberta: recebem uma tarefa, modificam arquivos e declaram conclusão. O ASES-300 procura construir uma malha fechada: requisito como referência, implementação como ação, testes e Evals como sensores, falhas como erro observado e nova tentativa como correção.

O ciclo pode ser resumido como \`OBJETIVO → AÇÃO → OBSERVAÇÃO → COMPARAÇÃO → CORREÇÃO → NOVA OBSERVAÇÃO\`. O valor dessa estrutura é que o agente não precisa acertar tudo na primeira tentativa. Ele precisa conseguir detectar que não acertou e possuir meios seguros para corrigir. Essa característica é particularmente adequada aos modelos generativos, cuja primeira resposta pode ser plausível sem ser perfeita.

Yang et al. (2024), ao apresentarem SWE-agent, demonstram empiricamente que a interface entre agente e computador influencia desempenho em tarefas de Engenharia de Software. O Harness amplia esse princípio: a qualidade do loop depende não apenas da inteligência do modelo, mas da qualidade dos sinais que o ambiente devolve e da clareza das ações que disponibiliza.

## 3.6 A arquitetura documental do ASES-300

O ASES-300 propõe uma arquitetura documental deliberadamente separada por responsabilidade. \`README.md\` é a porta de entrada humana. \`AGENTS.md\` ensina ao agente como trabalhar no repositório. A pasta \`spec/\` contém a constituição do projeto e seus contratos. \`harness/HARNESS.md\` descreve o ciclo operacional e \`harness/RULES.md\` registra leis de execução. \`progress/STATUS.md\` preserva continuidade. \`requirements/\*.yaml\` fornece representação processável dos requisitos. \`skills/\` contém procedimentos reutilizáveis. \`evals/\` e \`tests/\` verificam comportamento. \`docs/adr/\` preserva decisões arquiteturais.

A separação evita um documento monolítico com milhares de linhas que precisa ser carregado integralmente em todas as tarefas. Um agente que modifica uma migration pode precisar de MASTER-SPEC, DATABASE, SECURITY, RULES e uma Skill de migrations; não precisa necessariamente receber todo o capítulo de UX. Um agente que altera uma tabela de interface pode precisar de PRODUCT, DOMAIN, UX-UI, AUTH-AUTHORIZATION e testes relacionados. O Harness seleciona contexto conforme a tarefa.

Essa organização também permite governança. Documentos possuem níveis diferentes de autoridade. Uma Skill não pode contradizer uma Rule; uma implementação não pode contradizer a SPEC; um STATUS não redefine requisito; um ADR explica decisão arquitetural, mas não pode apagar silenciosamente uma regra de produto. A hierarquia documental reduz ambiguidades quando duas fontes parecem divergir.

## 3.7 Hierarquia de autoridade entre os artefatos

Um Harness precisa saber não apenas quais documentos existem, mas qual prevalece quando há conflito. O ASES-300 recomenda que a \`00-MASTER-SPEC.md\` defina formalmente essa precedência. Um exemplo possível é: decisões humanas explícitas e requisitos legais; MASTER-SPEC; requisitos de produto e domínio; regras de segurança e autorização; ADRs vigentes; arquitetura; Skills; STATUS; implementação atual. Essa ordem pode ser adaptada, mas precisa ser explícita.

Imagine que o código atual permita exclusão física de usuários, enquanto \`DOMAIN-REQUIREMENTS.md\` exige retenção por soft delete. O agente não deve concluir que o código é a fonte de verdade simplesmente porque ele existe. O conflito indica dívida ou implementação incorreta. Em sentido inverso, se uma documentação antiga descreve endpoint que não existe mais e um ADR posterior registra sua substituição, a decisão mais recente e autorizada precisa prevalecer.

Hierarquia de autoridade é uma ferramenta contra deriva documental. Ela também orienta correções: quando código e requisito divergem, corrige-se código; quando dois requisitos se contradizem, não se escolhe arbitrariamente um deles — o agente deve bloquear e solicitar resolução.

## 3.8 O papel do AGENTS.md

\`AGENTS.md\` funciona como manual operacional de entrada para agentes que trabalham no repositório. Ele deve ser curto o suficiente para ser lido com frequência e completo o suficiente para direcionar o agente às fontes corretas. Em vez de repetir toda a SPEC, informa o que ler antes de começar, quais comandos utilizar, quais práticas são obrigatórias, como localizar requisitos e quando interromper o trabalho para solicitar decisão humana.

Um \`AGENTS.md\` eficiente pode conter: visão rápida da estrutura; comandos oficiais de instalação, desenvolvimento, testes e verificação; ordem de leitura; regras de alteração; política de dependências; política de migrations; definição de evidência; proibição de falso DONE; procedimento para atualizar STATUS e rastreabilidade; situações que exigem aprovação. Ele é uma espécie de mapa do Harness.

Pesquisas de 2025 sobre Context Engineering em projetos open source observam a emergência de arquivos versionados de orientação para agentes e citam \`AGENTS.md\` como formato potencialmente consolidado para reunir instruções de projeto. No ASES-300, seu papel é deliberadamente limitado: orientar o agente para o sistema documental e operacional, não carregar sozinho toda a inteligência do projeto.

## 3.9 PRODUCT, DOMAIN e GENERAL REQUIREMENTS dentro do Harness

\`PRODUCT.md\` responde por que o sistema existe, para quem e com qual escopo. \`GENERAL-REQUIREMENTS.md\` contém as trezentas preocupações estruturais do método. \`DOMAIN-REQUIREMENTS.md\` acrescenta aquilo que torna aquele produto particular. Os três documentos se complementam. PRODUCT fornece intenção; GENERAL fornece disciplina transversal; DOMAIN fornece especificidade.

Considere uma plataforma acadêmica. PRODUCT pode declarar que o objetivo é reduzir erros na análise de equivalência curricular. GENERAL exige autorização, auditoria, testes e rastreabilidade. DOMAIN estabelece como comparar disciplinas, quais percentuais são relevantes e quando uma análise exige validação humana. Se o agente receber apenas GENERAL, construirá algo tecnicamente organizado, porém sem compreender o negócio. Se receber apenas DOMAIN, poderá implementar regras corretas em uma arquitetura insegura. Se receber apenas PRODUCT, conhecerá o objetivo, mas não os contratos verificáveis.

O Harness usa esses documentos em conjunto e de forma seletiva. A tarefa atual determina quais partes precisam ser recuperadas. Essa é uma das razões para manter IDs estáveis como \`REQ-111\`: eles permitem que ferramentas e agentes encontrem relações sem depender de buscas vagas.

## 3.10 RULES: as leis operacionais do agente

Rules são restrições que não devem ser negociadas durante a execução ordinária. Exemplos: não remover teste para fazê-lo passar; não reduzir segurança para corrigir erro; não executar migration destrutiva em produção; não expor secrets; não alterar requisito para adequá-lo ao código; não declarar DONE sem evidência; não instalar dependência sem justificativa quando solução nativa é suficiente.

A força de uma Rule aumenta quando ela é executável. “Não commitar secrets” pode ser reforçada por secret scanning. “Não fazer merge com testes falhos” pode ser reforçada por branch protection. “Não executar migration destrutiva sem aprovação” pode ser reforçada pelo pipeline. Assim, o Harness transforma parte da governança linguística em governança técnica.

Rules também ajudam a controlar comportamentos oportunistas. Um agente orientado apenas a fazer testes passarem pode encontrar o caminho mais curto: remover a asserção. A Rule redefine o objetivo: não basta produzir verde; é preciso preservar a propriedade que o teste representa.

## 3.11 Skills: procedimentos que evitam reinventar o trabalho

Skills são instruções especializadas para categorias recorrentes de atividade. Uma Skill \`create-api-endpoint.md\` pode ensinar o padrão de controller, service, schema, autorização, tratamento de erro, logging e testes adotado pela organização. Uma Skill \`create-migration.md\` pode exigir backup em operações críticas, reversibilidade quando possível e teste em banco descartável. Uma Skill \`security-review.md\` pode orientar inspeção de autorização, validação, secrets e exposição de dados.

Quando o Harness seleciona uma tarefa, pode carregar automaticamente as Skills relacionadas. Isso reduz contexto desnecessário e aumenta consistência. O agente não precisa receber todas as práticas da organização em todas as tarefas; recebe o procedimento adequado ao trabalho atual.

É importante que Skills não se tornem uma segunda SPEC. A Skill explica como executar; o requisito explica o que deve ser verdadeiro. Se a Skill for atualizada, o requisito continua válido. Essa separação permite evolução técnica sem reescrever contratos de produto.

## 3.12 STATUS como memória de turno entre agentes e sessões

Long-running agents enfrentam um problema semelhante a equipes trabalhando em turnos: uma nova sessão pode começar sem memória detalhada da anterior. A Anthropic descreveu em 2025 um Harness para agentes de longa duração baseado em artefatos persistentes deixados entre sessões, justamente para que o próximo agente consiga retomar o trabalho sem reconstruir toda a história. Essa preocupação coincide diretamente com a função de \`STATUS.md\` no ASES-300.

\`STATUS.md\` deve responder rapidamente: qual versão do projeto está em andamento? Qual foi o último requisito verificado? Qual requisito está em progresso? O que está bloqueado? Quais falhas críticas permanecem? Quais são os próximos itens? Qual commit ou estado foi verificado? Quais ADRs recentes são relevantes? O arquivo não substitui Git, issue tracker ou testes; ele sintetiza o estado operacional necessário para continuidade.

Um bom STATUS é conciso e factual. Ele não deve virar diário de centenas de páginas. O histórico detalhado pertence a commits, logs e eventos. STATUS representa a fotografia operacional mais recente.

## 3.13 ADR como memória das decisões que não podem ser redescobertas toda semana

Architecture Decision Records preservam decisões cujo contexto poderia desaparecer. Um ADR típico contém contexto, opções consideradas, decisão, justificativa, consequências e status. Para agentes, ADRs são particularmente valiosos porque evitam que cada sessão redescubra a arquitetura do zero e escolha novamente entre alternativas já analisadas.

Imagine que o projeto tenha decidido usar Cloudflare D1 em vez de outro banco por requisitos de implantação, custo e integração. Sem ADR, um agente pode observar uma limitação local e instalar uma segunda infraestrutura. Com ADR, entende que existe decisão consciente e que qualquer revisão exige processo explícito. Isso não congela a arquitetura para sempre; apenas transforma mudança em decisão rastreável.

No Harness, ADRs podem ser consultados automaticamente quando uma tarefa toca módulos ou tecnologias relacionadas. Um requisito de rastreabilidade pode ainda exigir que mudanças arquiteturais relevantes criem ou atualizem ADR.

## 3.14 Requirements YAML: quando requisitos deixam de ser apenas texto

Documentos Markdown são excelentes para leitura humana e explicação. Entretanto, automação se beneficia de estruturas processáveis. Por isso, o ASES-300 propõe arquivos como \`general.yaml\`, \`domain.yaml\` e \`traceability.yaml\`. Eles podem representar ID, título, categoria, prioridade, dependências, arquivos relacionados, testes, critérios de aceite, status e evidências.

Essa representação permite consultas automáticas. Um script pode perguntar quais requisitos CRITICAL estão PENDING, quais PASS não possuem evidência, quais arquivos estão ligados a REQs bloqueados ou quais testes correspondem a determinado requisito. A documentação deixa de ser apenas narrativa e passa a alimentar o Harness.

O YAML não substitui a explicação didática em Markdown. O ideal é manter uma fonte de verdade bem definida e gerar ou sincronizar representações quando possível. O risco a evitar é possuir duas listas independentes que divergem silenciosamente.

## 3.15 Rastreabilidade como grafo, não como planilha decorativa

Rastreabilidade conecta \`REQUISITO → IMPLEMENTAÇÃO → TESTE/EVAL → EVIDÊNCIA → STATUS\`. Em sistemas maiores, essa relação se comporta como um grafo. Um requisito pode afetar vários arquivos e possuir vários testes; um teste pode validar vários requisitos; uma decisão arquitetural pode influenciar dezenas de REQs. Pensar em grafo ajuda a compreender impacto e cobertura.

Suponha que \`REQ-111\` trate de permissão por coluna. A rastreabilidade pode apontar para policy de autorização, serialização da API, tabela de UI, exportação e três testes. Se alguém alterar a policy, o Harness consegue identificar quais requisitos e testes precisam de atenção. Se o requisito muda, os arquivos relacionados podem ser localizados rapidamente.

Uma matriz de rastreabilidade só possui valor se for atualizada e utilizada. No ASES-300, ela participa do release gate: requisitos críticos sem implementação ou evidência não podem desaparecer em uma planilha esquecida.

## 3.16 O loop operacional completo

O coração do Harness é um loop. Primeiro, carregar STATUS e regras globais. Segundo, selecionar o próximo requisito elegível conforme prioridade e dependências. Terceiro, recuperar contexto relevante. Quarto, inspecionar o estado real do código antes de editar. Quinto, elaborar plano proporcional ao risco. Sexto, implementar em incremento pequeno. Sétimo, executar verificações rápidas. Oitavo, executar testes e Evals relacionados. Nono, comparar com critério de aceite. Décimo, corrigir e repetir em caso de falha. Décimo primeiro, registrar evidência e atualizar rastreabilidade. Décimo segundo, atualizar STATUS. Décimo terceiro, selecionar próximo trabalho ou avaliar release gate.

Esse ciclo impede duas classes de erro: começar sem compreender o estado atual e terminar sem comprovar o estado final. Ele também facilita recuperação. Se a sessão for interrompida depois da etapa sete, o próximo agente encontra STATUS e evidências parciais, em vez de tentar adivinhar o que aconteceu.

A filosofia é incremental. Grandes alterações devem ser quebradas em unidades verificáveis. Quanto menor o intervalo entre ação e feedback, menor a superfície de investigação quando algo falha.

## 3.17 Seleção do próximo requisito e dependências

Um agente não deve escolher trabalho apenas pelo primeiro item PENDING. Requisitos possuem prioridade e dependências. \`REQ-136 — Exportação XLSX\`, por exemplo, pode depender de autorização e filtros. Implementá-la antes das policies pode produzir retrabalho ou, pior, criar uma funcionalidade que vaza dados. O Harness precisa considerar o grafo de dependências.

Uma estratégia simples é selecionar o requisito de maior prioridade cujas dependências estejam em PASS ou N/A justificadamente. Requisitos BLOCKED são ignorados até que a causa seja resolvida. Requisitos CRITICAL podem interromper trabalho de menor prioridade. Em projetos com múltiplos agentes, requisitos independentes podem ser distribuídos em paralelo.

A seleção automática não elimina planejamento humano de produto. Prioridade de negócio continua sendo decisão de governança. O Harness apenas transforma prioridades e dependências declaradas em execução consistente.

## 3.18 Planejar antes de modificar, mas sem burocratizar o trivial

O plano é uma hipótese de execução. Para tarefas pequenas, pode ter três passos. Para alterações arquiteturais, pode incluir investigação, migrations, compatibilidade, rollout e rollback. O importante é que o plano torne explícita a relação entre requisito e mudanças pretendidas.

Um bom plano deve citar arquivos ou módulos prováveis, testes a criar ou atualizar e riscos conhecidos. Depois da investigação, pode ser revisado. O agente não precisa pedir aprovação humana para cada replanejamento local, mas precisa respeitar gates definidos para mudanças estruturais.

O Harness pode exigir planos apenas acima de determinado risco. Essa política evita transformar Engenharia de Software orientada a agentes em produção excessiva de texto. O objetivo é aumentar controle, não maximizar documentação.

## 3.19 Verificação em camadas: feedback rápido antes da suíte completa

Executar toda a suíte após cada caractere seria ineficiente. O ASES-300 recomenda uma pirâmide operacional de feedback. Primeiro, verificações locais muito rápidas: formatação, typecheck parcial, testes do módulo. Depois, integração e regressões relacionadas. Em checkpoints ou antes do merge, suíte mais ampla. No release, todos os gates exigidos pela Definition of Done.

Essa organização reduz latência do ciclo. Um erro de tipagem pode ser detectado em segundos sem esperar E2E. Depois que a alteração está estável, testes mais caros aumentam confiança. O Harness pode automatizar essa progressão conforme o status do requisito.

Verificação em camadas também economiza tokens e chamadas do agente. Em vez de pedir ao modelo para analisar dezenas de logs quando um lint já identifica a causa, utiliza-se o sinal mais barato e preciso primeiro.

## 3.20 Evals no Harness: verificando o que não cabe em uma asserção simples

Evals são necessários quando a qualidade não pode ser completamente expressa por testes determinísticos. Em funcionalidades de IA, podem medir fidelidade a fontes, aderência a instruções, qualidade de classificação ou comportamento em conjuntos de casos. Em UX, avaliações automatizadas podem verificar acessibilidade, enquanto inspeções estruturadas avaliam fluxos mais subjetivos.

O Harness precisa saber quais Evals correspondem a quais requisitos. \`REQ-200 — Evals de IA\`, por exemplo, não deve ser satisfeito por uma demonstração única. É necessário um conjunto representativo de casos, métrica ou rubrica, threshold e procedimento de regressão. Mudanças em prompts ou modelos podem disparar nova avaliação.

O princípio permanece: não usar julgamento probabilístico quando uma verificação determinística resolve. Evals complementam testes; não são licença para tornar toda qualidade subjetiva.

## 3.21 Evidência: o que significa provar que um requisito passou

Evidência é qualquer artefato confiável que demonstre satisfação do critério de aceite. Pode ser resultado de teste, relatório de lint, screenshot validado, log de auditoria, hash de migration aplicada, saída de scanner de segurança, relatório de eval ou registro de aprovação humana. O tipo de evidência depende do requisito.

Para evitar evidência decorativa, o Harness deve registrar origem, data, versão ou commit e resultado. Um screenshot sem contexto pode mostrar que uma tela existiu em algum momento, mas não prova qual versão foi testada. Um relatório de teste sem ligação ao requisito pode ser difícil de auditar. A rastreabilidade resolve essas lacunas.

Em projetos de alto risco, evidência pode exigir independência: o agente que implementou não deve ser o único avaliador. Outro agente, uma ferramenta determinística ou um humano pode atuar como revisor.

## 3.22 Retry, recuperação e limites para loops infinitos

Um agente que falha pode tentar novamente, mas retries ilimitados são perigosos. Eles consomem recursos, podem produzir alterações cada vez mais distantes do objetivo e dificultam diagnóstico. O Harness deve definir limites de tentativa e critérios de escalonamento.

Uma política simples pode permitir duas ou três correções automáticas para falhas locais. Se o mesmo critério continuar falhando, o requisito passa a BLOCKED com evidências e resumo das tentativas. Falhas de segurança, conflito de requisitos ou ausência de informação essencial podem bloquear imediatamente.

Recuperação também exige checkpoints. Antes de alteração destrutiva, o sistema deve permitir rollback. Branches, commits pequenos, bancos descartáveis e migrations reversíveis funcionam como mecanismos de recuperação. Autonomia confiável depende tanto de avançar quanto de conseguir voltar.

## 3.23 Gates humanos: onde o Harness deve parar

Human-in-the-loop precisa ser desenhado, não improvisado. O Harness deve conhecer situações que exigem aprovação: mudança de escopo, remoção de requisito, alteração de arquitetura principal, nova dependência crítica, acesso a produção, migration destrutiva, modificação de política de autorização, aceitação de risco de segurança ou liberação de release.

Isso evita dois extremos. No primeiro, o agente pede autorização para cada detalhe e perde produtividade. No segundo, possui autonomia irrestrita e toma decisões organizacionais que não lhe pertencem. Gates humanos concentram atenção onde julgamento e responsabilidade são mais importantes.

A documentação moderna de agent harnesses também enfatiza políticas de aprovação e controle do operador como capacidades de runtime. No ASES-300, esse princípio é formalizado como parte da governança do projeto.

## 3.24 Segurança do Harness e princípio do menor privilégio

O agente deve receber apenas as capacidades necessárias para a tarefa. Um agente que revisa documentação não precisa de credenciais de produção. Um agente que executa testes não precisa apagar buckets. Um agente que prepara migration pode trabalhar em banco descartável até o momento de aprovação. Esse é o princípio do menor privilégio aplicado à agência.

Credenciais devem possuir escopo, ambiente e validade compatíveis com a operação. Ferramentas perigosas podem ser separadas das ferramentas ordinárias. Logs devem registrar ações sem expor secrets. Sandboxes devem limitar impacto. A segurança do Harness é tão importante quanto a segurança do software produzido, porque o agente opera com capacidades de desenvolvimento.

Uma Rule textual dizendo “não faça nada perigoso” não é controle suficiente. O Harness deve impedir tecnicamente o que não precisa ser permitido.

## 3.25 Observabilidade: enxergar o trabalho sem registrar informação indevida

Um Harness observável registra eventos necessários para responder: qual requisito estava sendo executado? quais ferramentas foram chamadas? quais arquivos mudaram? quais testes rodaram? quanto tempo e recursos foram consumidos? onde ocorreu a falha? qual versão do sistema estava ativa? Esse histórico permite diagnóstico e melhoria contínua.

Observabilidade não significa armazenar todo conteúdo sensível ou raciocínio interno do modelo. É possível registrar eventos estruturados, parâmetros seguros, IDs de correlação, resultados e métricas sem capturar secrets. A política de logs precisa obedecer aos mesmos princípios de minimização e retenção aplicados ao produto.

No ASES-300, request IDs e IDs de requisito podem conectar eventos. Assim, uma execução pode ser reconstruída do requisito até a evidência final.

## 3.26 Compaction e gestão de contexto em trabalhos longos

Agentes de longa duração enfrentam limites de contexto. Repetir toda a história indefinidamente é caro e eventualmente impossível. Harnesses modernos utilizam técnicas de compaction, resumos estruturados e memória em arquivos para preservar o essencial enquanto descartam detalhes transitórios. O desafio é não resumir justamente a informação que será necessária depois.

O ASES-300 reduz esse risco por separação semântica. Decisões permanentes vão para ADR; estado atual vai para STATUS; contratos vão para SPEC; evidências vão para rastreabilidade; procedimentos vão para Skills. A compactação da conversa pode então ser agressiva porque o conhecimento importante já foi materializado fora dela.

Essa estratégia transforma o repositório em memória compartilhada. A sessão deixa de ser o único lugar onde o projeto “sabe” o que está acontecendo.

## 3.27 Harness e multiagentes

Quando múltiplos agentes trabalham simultaneamente, o Harness precisa resolver coordenação. Dois agentes não devem editar a mesma migration sem conhecimento mútuo. Um agente de segurança pode revisar a mudança do implementador. Um supervisor pode decompor requisitos independentes e consolidar resultados. A paralelização precisa respeitar dependências e conflitos.

Uma arquitetura possível utiliza supervisor, workers especializados e verificador. O supervisor seleciona tarefas e contexto; workers executam mudanças limitadas; o verificador roda critérios de aceite e regressões. Entretanto, essa arquitetura só deve ser adotada quando traz benefício. Mais agentes significam mais comunicação, custo e possibilidades de inconsistência.

O princípio do ASES-300 permanece: a fonte de verdade é compartilhada. Todos os agentes trabalham contra a mesma SPEC, Rules, STATUS e Definition of Done.

## 3.28 O repositório como ambiente legível para agentes

Harness Engineering também influencia a própria organização do código. Um repositório com comandos previsíveis, módulos coerentes, nomes claros, documentação próxima do código e testes fáceis de executar é mais legível para humanos e agentes. A experiência relatada pela OpenAI em 2026 enfatiza justamente a necessidade de tornar capacidades e restrições legíveis e aplicáveis ao agente.

Isso sugere um novo critério de qualidade: agent legibility. Não significa escrever código para agradar a um modelo, mas reduzir ambiguidades desnecessárias. Um único comando oficial de verificação é melhor do que seis combinações não documentadas. Uma convenção de módulos consistente é melhor do que padrões diferentes em cada pasta. Erros com mensagens claras são melhores do que falhas silenciosas.

Muitas dessas melhorias beneficiam também novos membros humanos da equipe. Harness Engineering, portanto, pode funcionar como força de organização geral do projeto.

## 3.29 O comando único de verificação

Uma das práticas mais valiosas é oferecer ao agente um comando canônico, como \`npm run verify\`, que agregue as verificações necessárias ao estado atual. Internamente, ele pode executar typecheck, lint, testes unitários, integração, segurança, checagem de requisitos, rastreabilidade e auditorias. O agente não precisa memorizar uma sequência variável de comandos.

O comando único não impede comandos menores durante desenvolvimento. Ele funciona como contrato: antes de declarar conclusão, existe uma porta de verificação padronizada. Em CI, o mesmo comando ou pipeline equivalente reduz diferença entre ambiente local e release.

Quando uma verificação falha, a saída precisa ser acionável. O Harness deve dizer qual etapa falhou e, quando possível, qual requisito está afetado. Feedback ruim produz tentativas ruins.

## 3.30 Exemplo de estrutura física do Harness ASES-300

Uma estrutura de referência pode ser representada da seguinte maneira. Ela não é obrigatória em cada detalhe, mas serve como padrão inicial para novos projetos. A organização separa especificação, operação, progresso, requisitos processáveis, Skills, Evals, scripts, decisões, testes e código.

> PROJECT/  
> ├── README.md  
> ├── AGENTS.md  
> ├── spec/  
> │ ├── 00-MASTER-SPEC.md  
> │ ├── 01-PRODUCT.md  
> │ ├── 02-GENERAL-REQUIREMENTS.md  
> │ ├── 03-DOMAIN-REQUIREMENTS.md  
> │ ├── 04-ARCHITECTURE.md  
> │ └── ...  
> ├── harness/  
> │ ├── HARNESS.md  
> │ └── RULES.md  
> ├── progress/STATUS.md  
> ├── requirements/  
> │ ├── general.yaml  
> │ ├── domain.yaml  
> │ └── traceability.yaml  
> ├── skills/  
> ├── evals/  
> ├── scripts/  
> ├── docs/adr/  
> ├── tests/  
> └── src/

A estrutura física serve também como interface cognitiva. Ao entrar no repositório, o agente consegue inferir onde procurar intenção, regras, estado, procedimentos e evidências. Essa previsibilidade reduz busca desnecessária e facilita automação. Projetos existentes podem adaptar a estrutura sem mover todo o código; o importante é preservar responsabilidades e pontos de entrada claros.

## 3.31 Exemplo completo de execução de uma REQ

Considere \`REQ-136 — Exportação XLSX\`. O Harness começa verificando se a funcionalidade é aplicável. Como o produto possui tabelas exportáveis, a REQ é \`CONDITIONAL → APLICÁVEL\`. Em seguida consulta dependências: \`REQ-105 — EXPORT\`, \`REQ-114 — Segurança de exportação\`, filtros e autorização. Se alguma dependência crítica estiver PENDING, a exportação não é selecionada para conclusão.

O agente carrega a Skill de exportação, os documentos de autorização e os arquivos do módulo. Investiga se já existe exportação CSV e identifica padrões reutilizáveis. Planeja implementação e testes. Cria XLSX, aplica filtros server-side, remove campos sem permissão e registra auditoria. Executa testes positivos e negativos. Um teste detecta que o campo \`salary\` aparece para perfil sem \`READ:salary\`. A REQ permanece FAIL; o agente corrige a serialização e repete.

Após todos os critérios passarem, o Harness registra: commit, testes, arquivo gerado de amostra, resultado da policy e log de auditoria. \`REQ-136\` passa para PASS. A conclusão não foi “o botão apareceu”; foi a satisfação demonstrada do contrato.

## 3.32 Anti-padrões de Harness Engineering

O primeiro anti-padrão é o Harness teatral: muitos arquivos, nomes sofisticados e nenhuma automação real. O segundo é o megaprompt operacional, em que toda a metodologia é colocada em uma instrução gigantesca e espera-se que o agente se lembre de tudo. O terceiro é a autoavaliação circular: o mesmo agente implementa e simplesmente declara que está correto sem teste independente. O quarto é a memória fantasma: decisões importantes existem apenas em conversas passadas. O quinto é o gate decorativo: existe Definition of Done, mas releases ignoram suas condições.

Outro anti-padrão é excesso de autonomia sem observabilidade. Se o agente pode alterar produção, mas não existe trilha clara de ações, qualquer incidente se torna difícil de reconstruir. O oposto também é problemático: Harness tão restritivo que toda ação exige aprovação humana e a autonomia deixa de produzir ganho.

Um bom Harness procura o menor conjunto de controles capaz de produzir confiança adequada ao risco. Essa ideia será importante quando os requisitos do ASES-300 forem classificados entre CORE, CONDITIONAL e DOMAIN.

## 3.33 Maturidade de Harness em cinco níveis

Para fins didáticos, pode-se imaginar cinco níveis de maturidade. Nível 0: agente recebe prompts e edita código sem protocolo persistente. Nível 1: existem instruções de repositório, comandos padronizados e testes. Nível 2: existem SPEC, Rules, STATUS e verificação automática. Nível 3: requisitos são rastreáveis, evidências são registradas e existem gates humanos e de segurança. Nível 4: o Harness seleciona contexto e tarefas, coordena agentes, mantém observabilidade e executa release gates de forma amplamente automatizada.

Os níveis não constituem certificação formal e não devem ser usados como ranking universal. Servem para mostrar que Harness Engineering pode ser adotada progressivamente. Um projeto pequeno talvez nunca precise de multiagentes, mas ainda pode se beneficiar enormemente de requisitos verificáveis e de um comando canônico de verificação.

A maturidade deve acompanhar risco e escala. A pergunta não é “quantos mecanismos possuímos?”, mas “os mecanismos existentes controlam adequadamente os modos de falha relevantes deste projeto?”.

## 3.34 A relação elegante entre todos os componentes do ASES-300

A arquitetura conceitual completa pode ser lida como uma sequência de perguntas. \`PRODUCT\` responde “por que construir?”. \`DOMAIN\` responde “o que é específico deste negócio?”. \`GENERAL + DOMAIN REQUIREMENTS\` respondem “o que precisa ser verdadeiro?”. \`ARCHITECTURE\` responde “como o sistema será estruturado?”. \`DATABASE\`, \`API\`, \`AUTH\` e \`UX\` detalham como dados, comunicação, acesso e interação serão realizados. \`SECURITY\` estabelece como riscos serão controlados. \`AI\` define onde componentes probabilísticos entram e como são governados.

\`RULES\` respondem “o que o agente não pode violar?”. \`SKILLS\` respondem “como nossa organização executa este tipo de trabalho?”. \`HARNESS\` responde “como o trabalho será conduzido?”. \`TESTS\` e \`EVALS\` respondem “como saberemos que funciona?”. \`TRACEABILITY\` responde “onde está a ligação entre requisito, implementação e prova?”. \`STATUS\` responde “onde estamos agora?”. \`ADR\` responde “por que tomamos esta decisão?”. \`DEPLOYMENT\` responde “como a mudança chega ao ambiente?”. \`DEFINITION OF DONE\` responde “quando podemos afirmar que terminou?”.

Essa sequência é uma das ideias centrais do livro. Nenhum documento existe por ornamentação. Cada artefato responde uma pergunta diferente. O Harness é o mecanismo que faz essas respostas participarem do trabalho real.

## 3.35 Conclusão

Harness Engineering representa uma mudança de foco: a unidade de produtividade deixa de ser apenas a quantidade de código que um modelo consegue gerar e passa a ser a capacidade do sistema de produzir mudanças corretas, verificadas e recuperáveis com uso eficiente da atenção humana. O modelo continua importante, mas a engenharia se desloca para o ambiente: contexto, ferramentas, memória, políticas, feedback, testes, evidências e gates.

O ASES-300 transforma essa ideia em estrutura operacional. Os trezentos requisitos gerais não são uma lista entregue ao agente e esquecida. Eles alimentam um Harness que seleciona trabalho, carrega contexto, executa verificações, registra estado e impede falso DONE. A metáfora dos 300 volta a fazer sentido: a força não está em trezentos elementos isolados, mas em sua organização coordenada.

No capítulo seguinte, a obra passará do mecanismo de execução para o primeiro grande artefato de especificação: \`PRODUCT.md\`. Será detalhado como transformar uma ideia inicial em definição de produto legível por pessoas e agentes, incluindo problema, público, objetivos, escopo, não escopo, jornadas, regras de negócio, riscos e exemplos práticos.

## 3.36 Quadro-síntese: artefato, pergunta e papel no Harness

| Artefato                | Pergunta                            | Natureza             | Papel no Harness                         |
|-------------------------|-------------------------------------|----------------------|------------------------------------------|
| PRODUCT.md              | Por que construir?                  | Contexto de produto  | Orienta objetivos, usuários e escopo.    |
| DOMAIN-REQUIREMENTS.md  | O que é específico?                 | Contrato de domínio  | Define regras particulares do negócio.   |
| GENERAL-REQUIREMENTS.md | O que todo projeto deve considerar? | Baseline             | Fornece as 300 preocupações estruturais. |
| ARCHITECTURE.md         | Como organizar?                     | Decisão estrutural   | Limita e orienta implementação.          |
| RULES.md                | O que não pode ser violado?         | Governança           | Impõe limites operacionais.              |
| skills/                 | Como executar?                      | Procedimento         | Padroniza trabalho especializado.        |
| HARNESS.md              | Qual é o ciclo?                     | Orquestração         | Define sequência operacional.            |
| STATUS.md               | Onde estamos?                       | Memória operacional  | Permite continuidade entre sessões.      |
| ADR/                    | Por que decidimos assim?            | Memória arquitetural | Evita redescoberta e deriva.             |
| tests/ + evals/         | Funciona?                           | Verificação          | Produz sinais e evidências.              |
| traceability.yaml       | Onde está a prova?                  | Rastreabilidade      | Conecta REQ, código, teste e evidência.  |
| DEFINITION-OF-DONE.md   | Terminou?                           | Release gate         | Impede falso DONE.                       |

## 3.37 Fluxo de referência do Harness

> START  
> ↓  
> LOAD STATUS + RULES  
> ↓  
> SELECT NEXT ELIGIBLE REQ  
> ↓  
> LOAD RELEVANT SPEC + SKILLS + ADRs  
> ↓  
> INSPECT CURRENT IMPLEMENTATION  
> ↓  
> PLAN  
> ↓  
> IMPLEMENT SMALL INCREMENT  
> ↓  
> TYPECHECK / LINT / TARGETED TESTS  
> ↓  
> EVALUATE ACCEPTANCE CRITERIA  
> ├── FAIL → RECORD → FIX / REPLAN → RETEST  
> ├── BLOCKED → RECORD → HUMAN / DEPENDENCY  
> └── PASS → RECORD EVIDENCE → TRACEABILITY → STATUS  
> ↓  
> NEXT REQ / RELEASE GATE

O fluxo acima será retomado em capítulos posteriores e transformado em requisitos específicos do bloco de Harness, especialmente REQ-226 a REQ-245. Por enquanto, sua função é mostrar que o Harness não é uma camada abstrata: ele é um protocolo executável que controla entrada, trabalho, feedback, falha, prova e continuidade.

## 3.38 Perguntas de fixação

1\. Por que HARNESS.md não é o Harness completo?

2\. Qual é a diferença entre Prompt Engineering, Context Engineering e Harness Engineering?

3\. Como o Harness pode ser entendido como sistema de controle em malha fechada?

4\. Por que a hierarquia documental precisa ser explícita?

5\. Qual é o papel específico de AGENTS.md?

6\. Por que Skills não devem substituir requisitos?

7\. Qual é a diferença entre STATUS e ADR?

8\. Que vantagens surgem quando requisitos também possuem representação YAML?

9\. Por que rastreabilidade deve conectar requisito, implementação, teste e evidência?

10\. Quando um retry deve transformar-se em BLOCKED?

11\. Quais tipos de decisão justificam um gate humano?

12\. O que significa menor privilégio aplicado a agentes?

13\. Por que compaction e memória documental são complementares?

14\. O que é um Harness teatral?

15\. Como o comando único de verificação reduz falso DONE?

## 3.39 Referências utilizadas neste capítulo — registro provisório

As referências abaixo serão consolidadas no Capítulo 25 — Referências. Mantêm-se provisoriamente neste capítulo para conferência da fundamentação. Foram priorizados trabalhos e documentos técnicos recentes, de acesso aberto e provenientes de fontes acadêmicas reconhecidas ou de organizações diretamente responsáveis pelas tecnologias discutidas.

HUA, Qishuo; YE, Lyumanshan; FU, Dayuan; XIAO, Yang; CAI, Xiaojie; WU, Yunze; LIN, Jifan; WANG, Junfei; LIU, Pengfei. Context Engineering 2.0: The Context of Context Engineering. arXiv, 2025. Disponível em: https://arxiv.org/abs/2510.26493. Acesso em: 20 set. 2026.

MEI, Lingrui; YAO, Jiayu; GE, Yuyao; WANG, Yiwei; BI, Baolong; CAI, Yujun; LIU, Jiazhi; LI, Mingyu; LI, Zhong-Zhi; ZHANG, Duzhen; ZHOU, Chenlin; MAO, Jiayi; XIA, Tianze; GUO, Jiafeng; LIU, Shenghua. A Survey of Context Engineering for Large Language Models. arXiv, 2025. Disponível em: https://arxiv.org/abs/2507.13334. Acesso em: 20 set. 2026.

MOHSENIMOFIDI, Seyedmoein; GALSTER, Matthias; TREUDE, Christoph; BALTES, Sebastian. Context Engineering for AI Agents in Open-Source Software. arXiv, 2025. Disponível em: https://arxiv.org/abs/2510.21413. Acesso em: 20 set. 2026.

NING, Xuying et al. Code as Agent Harness. arXiv, 2026. Disponível em: https://doi.org/10.48550/arXiv.2605.18747. Acesso em: 20 set. 2026.

YANG, John; JIMENEZ, Carlos E.; WETTIG, Alexander; LIERET, Kilian; YAO, Shunyu; NARASIMHAN, Karthik; PRESS, Ofir. SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering. **Advances in Neural Information Processing Systems**, v. 37, 2024. Disponível em: https://proceedings.neurips.cc/paper_files/paper/2024/hash/5a7c947568c1b1328ccc5230172e1e7c-Abstract-Conference.html. Acesso em: 20 set. 2026.

ZHANG, Qizheng; HU, Changran; UPASANI, Shubhangi; MA, Boyuan; HONG, Fenglu; KAMANURU, Vamsidhar; RAINTON, Jay; WU, Chen; JI, Mengmeng; LI, Hanchen; THAKKER, Urmish; ZOU, James; OLUKOTUN, Kunle. Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models. arXiv, 2025. Disponível em: https://arxiv.org/abs/2510.04618. Acesso em: 20 set. 2026.

ANTHROPIC. Effective harnesses for long-running agents. 2025. Disponível em: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents. Acesso em: 20 set. 2026.

MICROSOFT. Agent Harness. Microsoft Learn, 2026. Disponível em: https://learn.microsoft.com/agent-framework/agents/harness. Acesso em: 20 set. 2026.

OPENAI. Harness engineering: leveraging Codex in an agent-first world. 2026. Disponível em: https://openai.com/index/harness-engineering/. Acesso em: 20 set. 2026.

# CAPÍTULO 4 — PRODUCT: DO PROBLEMA HUMANO À DEFINIÇÃO DO PRODUTO

## 4.1 Antes de especificar o software, é preciso especificar o problema

A etapa PRODUCT ocupa uma posição deliberadamente anterior à arquitetura, ao banco de dados, às APIs e aos requisitos detalhados. Isso ocorre porque um sistema tecnicamente impecável pode fracassar de maneira completa se resolver o problema errado. A facilidade contemporânea de produzir interfaces, endpoints e estruturas de dados com auxílio de inteligência artificial aumenta esse risco: quanto mais rapidamente uma equipe consegue construir, mais rapidamente também consegue construir algo que nunca deveria ter sido construído. Por isso, o ASES-300 inicia a especificação formal perguntando não “qual framework será usado?”, mas “qual problema humano, organizacional ou operacional justifica a existência deste produto?”.

Em Engenharia de Requisitos, compreender necessidades de stakeholders continua sendo uma atividade central. Umar e Lano (2024), em revisão sistemática sobre suporte automatizado à Engenharia de Requisitos, mostram que a área vem incorporando técnicas de automação em atividades como elicitação, análise, classificação e gestão, mas a automação não elimina a necessidade de compreender o contexto no qual os requisitos surgem. De modo semelhante, Ahmad et al. (2023), ao analisar Engenharia de Requisitos para sistemas de inteligência artificial, identificam novos desafios relacionados a dados, ética, explicabilidade, confiança e especificação. A lição para o ASES-300 é que a qualidade do artefato técnico depende da qualidade da compreensão anterior do problema.

PRODUCT, portanto, não é uma apresentação comercial do sistema. Ele é um artefato de engenharia que transforma uma ideia vaga em um contexto suficientemente claro para que requisitos possam ser derivados sem depender de adivinhações. Seu propósito é responder por que o produto existe, para quem existe, quais resultados pretende produzir, quais limites possui, quais atores participam e quais situações concretas precisam mudar depois de sua implantação.

## 4.2 PRODUCT não é DOMAIN, SPEC nem lista de funcionalidades

Uma das confusões mais comuns em projetos é misturar problema, domínio, solução e implementação em um único documento. O resultado costuma ser uma descrição que começa com uma necessidade organizacional, pula para nomes de tabelas, retorna a objetivos estratégicos, inclui tecnologias e termina com uma lista de telas. Para pessoas, isso já dificulta compreensão; para agentes, cria ambiguidade sobre quais afirmações são objetivos, quais são restrições e quais são apenas ideias preliminares.

No ASES-300, PRODUCT responde principalmente às perguntas “por quê?”, “para quem?” e “qual transformação é esperada?”. DOMAIN descreve conceitos e regras particulares do negócio. REQUIREMENTS formaliza estados que precisam ser verdadeiros. ARCHITECTURE define como o sistema será organizado. Essa separação não significa que os documentos sejam independentes; significa que cada um possui responsabilidade semântica própria. Um bom PRODUCT alimenta DOMAIN e REQUIREMENTS, mas não tenta substituí-los.

Considere um sistema universitário de equivalência curricular. PRODUCT pode registrar que estudantes, atendentes e coordenações enfrentam dificuldade para compreender aproveitamento entre matrizes e cursos, produzindo demora e decisões inconsistentes. DOMAIN explicará o que são matriz, componente curricular, carga horária, ementa, equivalência e convalidação. REQUIREMENTS determinará, por exemplo, que o sistema deve comparar disciplinas de origem e destino e apresentar evidências utilizadas na recomendação. ARCHITECTURE decidirá onde executar embeddings, regras determinísticas e persistência. Misturar essas quatro camadas em um único parágrafo torna o projeto mais difícil de evoluir e verificar.

## 4.3 O problema central: escrever a situação antes da solução

Um PRODUCT bem construído começa descrevendo a situação problemática sem pressupor prematuramente a solução. Essa disciplina é importante porque equipes frequentemente chegam à especificação já apaixonadas por uma tecnologia. “Precisamos de um chatbot com IA” não é um problema; é uma proposta de solução. O problema pode ser que usuários não encontram respostas em milhares de documentos, que o suporte recebe perguntas repetitivas ou que informações estão fragmentadas. Depois de compreender o problema, talvez um chatbot seja adequado; talvez busca estruturada seja melhor; talvez o verdadeiro gargalo seja a qualidade documental.

Uma técnica didática é escrever o problema em quatro camadas: situação atual, atores afetados, consequência observável e causa conhecida ou hipótese de causa. Por exemplo: “A universidade mantém múltiplas matrizes curriculares históricas. Atendentes e coordenadores precisam comparar manualmente históricos de estudantes com a matriz vigente. O processo consome tempo, produz decisões pouco uniformes e dificulta oferecer alternativas de formação. Parte do problema decorre da dispersão de ementas, cargas horárias e regras de equivalência em fontes diferentes”. Observe que nenhuma tecnologia foi escolhida. O texto descreve o mundo que existe antes do produto.

Esse cuidado é ainda mais importante quando LLMs participam da elicitação. ClarifyGPT, de Mu et al. (2024), parte justamente do problema de requisitos ambíguos ou insuficientes na geração de código por LLMs e propõe mecanismos de clarificação antes da implementação. A mensagem metodológica é compatível com o ASES-300: quando a intenção está incompleta, a resposta correta não é inventar silenciosamente; é identificar a lacuna, explicitar a hipótese ou solicitar esclarecimento conforme sua importância.

## 4.4 Passo 1 — escrever a declaração do problema

O primeiro bloco de PRODUCT.md deve conter uma declaração do problema suficientemente curta para ser compreendida rapidamente e suficientemente concreta para impedir que o projeto perca sua finalidade. Uma fórmula útil é: “Atualmente, \[atores\] enfrentam \[situação\], o que provoca \[consequências\]. O produto será criado para alterar esse estado, permitindo \[resultado\], sem pressupor ainda os detalhes da implementação”. Essa fórmula não é obrigatória, mas ajuda a evitar descrições promocionais como “plataforma inovadora e inteligente para revolucionar a gestão”.

Uma boa declaração permite reconhecer o problema mesmo que o nome do software seja removido. Se o texto depende de dizer que haverá IA, dashboard, aplicativo ou blockchain para parecer relevante, provavelmente descreve a solução e não o problema. O teste é perguntar: se esta tecnologia fosse proibida amanhã, o problema continuaria existindo? Se sim, ele foi corretamente separado da solução.

No estudo de caso do CRUD hierárquico utilizado nesta obra, uma declaração poderia ser: “A organização precisa registrar e compartilhar dados operacionais entre pessoas com diferentes níveis de responsabilidade. Planilhas convencionais oferecem flexibilidade, mas não conseguem aplicar de forma consistente permissões por função, registro e coluna, nem produzir auditoria confiável das alterações. O produto deverá preservar a familiaridade de uma tabela editável, acrescentando controle de acesso, rastreabilidade, exportação e administração centralizada”.

## 4.5 Passo 2 — identificar stakeholders e usuários

Stakeholder e usuário não são necessariamente sinônimos. Usuário é quem interage diretamente com o sistema; stakeholder é qualquer parte interessada ou afetada. Um diretor pode consumir relatórios sem operar o CRUD diariamente. A equipe de segurança pode impor requisitos sem ser usuária funcional. Uma pessoa cujos dados são armazenados pode ser afetada pelo sistema mesmo sem possuir conta. Essa distinção impede que requisitos sejam derivados exclusivamente da perspectiva de quem clica na interface.

PRODUCT.md deve listar grupos, não apenas nomes individuais, e explicar interesses, responsabilidades, riscos e nível de influência. Para o CRUD hierárquico, podemos ter administrador da plataforma, gestor organizacional, analista, operador, auditor, responsável por segurança e titular dos dados. Cada grupo enxerga o produto de forma diferente. O operador deseja rapidez; o auditor deseja rastreabilidade; a segurança deseja menor privilégio; o gestor deseja visibilidade adequada; o titular deseja tratamento legítimo e protegido de suas informações.

Em sistemas com IA, Habiba et al. (2024) observam que Engenharia de Requisitos precisa lidar com desafios adicionais de qualidade e implicações éticas. Isso amplia a necessidade de mapear stakeholders: decisões automatizadas podem afetar pessoas que não participam da operação do sistema. PRODUCT deve tornar esses atores visíveis antes que requisitos sejam formalizados.

## 4.6 Passo 3 — definir público-alvo e personas sem transformar personas em ficção

Personas podem ajudar a tornar necessidades concretas, mas devem ser utilizadas com cautela. Uma persona útil sintetiza características relevantes de um grupo real: objetivos, frequência de uso, conhecimentos, limitações e contexto. Uma persona ruim inventa detalhes decorativos — nome, hobbies, fotografia e biografia — que não alteram nenhuma decisão de produto. No ASES-300, personas são opcionais; perfis operacionais são obrigatórios quando diferenças entre usuários alteram requisitos.

Por exemplo, “Analista Operacional” pode ser descrito como pessoa que utiliza a plataforma diariamente, manipula grande volume de registros, precisa de filtros rápidos, edição eficiente e exportação, mas não administra usuários nem políticas de acesso. “Administrador” utiliza o sistema com menor frequência, porém possui tarefas de alto impacto: criar perfis, atribuir permissões e revisar logs. Essas diferenças justificam fluxos e controles distintos.

O agente de desenvolvimento deve utilizar personas como contexto, não como autorização para inventar funcionalidades. Se a persona diz que o analista trabalha com muitos registros, isso pode justificar paginação e atalhos; não autoriza o agente a criar automaticamente uma funcionalidade de aprovação que nunca foi especificada.

## 4.7 Passo 4 — objetivo principal e objetivos secundários

O objetivo principal descreve a transformação mais importante que o produto pretende produzir. Ele deve ser mais específico do que “melhorar a gestão” e mais estável do que uma funcionalidade. Um objetivo adequado para o CRUD poderia ser: “permitir gestão colaborativa de dados tabulares com controle granular de acesso e rastreabilidade das operações”. Essa frase sobreviveria à troca de framework, banco ou design visual.

Objetivos secundários complementam o principal: reduzir retrabalho, permitir exportações controladas, centralizar logs, facilitar administração de usuários, diminuir dependência de planilhas dispersas e oferecer experiência familiar. Eles ajudam a priorizar requisitos quando surgem conflitos. Se uma funcionalidade sofisticada aumenta complexidade sem contribuir para nenhum objetivo, sua necessidade deve ser questionada.

É útil diferenciar objetivo de métrica. “Reduzir o tempo de processamento” é objetivo; “reduzir o tempo mediano de 20 para 8 minutos” é indicador mensurável. PRODUCT pode registrar ambos quando existe baseline confiável. Não se deve inventar números apenas para tornar o documento aparentemente científico.

## 4.8 Passo 5 — resultados esperados e critérios de sucesso do produto

Requisitos verificam propriedades do sistema; critérios de sucesso verificam se o produto produz valor no contexto de uso. Um software pode cumprir todos os requisitos técnicos e ainda não melhorar o processo. Por isso, PRODUCT deve registrar resultados esperados que possam ser avaliados após implantação.

No CRUD, resultados podem incluir redução de planilhas paralelas, menor número de acessos indevidos, capacidade de reconstruir alterações por auditoria e diminuição do tempo necessário para consolidar dados. No sistema de matrizes, resultados podem incluir redução do tempo de análise de equivalência, maior consistência entre decisões e capacidade de explicar por que disciplinas foram consideradas semelhantes.

Esses critérios não devem ser confundidos com promessa absoluta. Alguns dependem de fatores organizacionais. O documento deve indicar como serão medidos, quais dados estão disponíveis e quais resultados são apenas hipóteses a validar. Essa honestidade é preferível a metas arbitrárias.

## 4.9 Passo 6 — escopo obrigatório

Escopo define aquilo que o produto se compromete a entregar. No ASES-300, o escopo de PRODUCT é escrito em nível funcional suficientemente alto para orientar derivação de requisitos, mas sem descer imediatamente a detalhes de implementação. Para o CRUD: autenticação; gestão de usuários; estrutura hierárquica; tabelas e formulários; permissões granulares; logs; importação e exportação; administração. Cada item posteriormente será decomposto em múltiplos REQs.

Uma técnica útil é perguntar para cada item: se ele não existir, o produto ainda resolve o problema central? Se a resposta for não, provavelmente pertence ao escopo obrigatório. Se a resposta for “seria interessante”, pode ser backlog futuro. Essa separação combate o crescimento descontrolado de escopo.

O escopo também funciona como proteção contra a criatividade excessiva do agente. Um agente capaz de gerar rapidamente gráficos, chat, notificações e integrações pode acrescentar complexidade não solicitada. PRODUCT fornece o limite semântico: inovação é bem-vinda dentro do problema e dos objetivos, não como expansão silenciosa do produto.

## 4.10 Passo 7 — fora do escopo

Declarar o que não será construído é tão importante quanto declarar o que será. Fora do escopo reduz interpretações divergentes e impede que ausência seja confundida com esquecimento. Um projeto pode registrar: “não haverá aplicativo móvel nativo na primeira versão”; “não haverá billing”; “não haverá edição offline”; “não haverá decisão automática de equivalência curricular sem revisão humana”.

Para agentes, esse bloco é especialmente valioso. Se o sistema é web responsivo e o agente encontra menção a dispositivos móveis, pode decidir criar um aplicativo. Uma declaração explícita de não escopo evita esse salto. O mesmo vale para IA: se PRODUCT determina que a IA apenas recomenda e que decisões acadêmicas permanecem humanas, o agente não deve transformar recomendação em aprovação automática.

Fora do escopo não é permanente. Pode mudar por decisão de produto e gerar nova versão da SPEC. O que não deve ocorrer é uma mudança implícita durante implementação.

## 4.11 Passo 8 — premissas, restrições e dependências externas

Premissa é algo considerado verdadeiro para planejar o produto, mas que pode precisar ser validado. Restrição é um limite que precisa ser respeitado. Dependência externa é algo fora do controle direto do produto de que uma funcionalidade depende. Misturar os três conceitos dificulta gestão de risco.

Exemplo de premissa: “as matrizes curriculares estarão disponíveis em formato digital”. Restrição: “o sistema deverá operar dentro do ecossistema Cloudflare e utilizar serviços compatíveis com o orçamento definido”. Dependência: “a autenticação institucional depende do provedor de identidade da organização”. Se a premissa se mostrar falsa, o projeto pode precisar de OCR ou digitalização. Se a dependência ficar indisponível, o sistema precisa de comportamento definido. Se a restrição mudar, a arquitetura pode ser revisada.

PRODUCT registra essas informações porque elas alteram requisitos e arquitetura. O agente não deve descobrir no meio da implementação que uma integração essencial não existe ou que uma tecnologia escolhida viola uma restrição conhecida.

## 4.12 Passo 9 — jornadas e cenários de uso

Jornadas descrevem sequências significativas do ponto de vista do usuário. Elas são mais úteis do que listas isoladas de telas porque mostram contexto, intenção e transições. Uma jornada pode ser: administrador cria usuário → atribui unidade → atribui papel → usuário recebe acesso → entra no sistema → visualiza apenas dados permitidos. Outra: analista filtra registros → edita campo permitido → sistema valida → salva → auditoria registra alteração → gestor consulta histórico.

Essas jornadas ajudam a descobrir requisitos ausentes. Se a jornada diz que o usuário “recebe acesso”, como ocorre o primeiro login? Existe convite? Senha temporária? SSO? Se a alteração é auditada, quem consulta logs? Por quanto tempo ficam armazenados? Cada pergunta pode gerar requisito.

LLMs podem ajudar a explorar cenários, mas não devem ser autorizados a transformá-los automaticamente em verdade de produto. Saleem et al. (2025) mostram potencial de modelos generativos em tarefas de Engenharia de Requisitos, mas também limitações e variabilidade. No ASES-300, IA pode sugerir lacunas; a SPEC aprovada continua sendo a fonte normativa.

## 4.13 Passo 10 — regras de negócio preliminares

PRODUCT pode registrar regras de negócio de alto nível quando elas são essenciais para compreender o produto, mas o detalhamento normativo deve migrar para DOMAIN e requisitos. Por exemplo: “gestores só podem administrar pessoas dentro de seu escopo organizacional” é importante para entender o produto. A matriz completa de papéis, recursos e ações pertence a AUTH/AUTHORIZATION e aos REQs correspondentes.

Essa divisão evita dois extremos. O primeiro é PRODUCT tão abstrato que não explica o funcionamento do negócio. O segundo é PRODUCT transformado em especificação técnica de centenas de páginas. O documento precisa ser suficientemente concreto para orientar derivação, mas modular o bastante para que detalhes tenham local próprio.

Quando uma regra aparece em PRODUCT e depois é formalizada em DOMAIN, deve haver consistência e, idealmente, rastreabilidade. Se a regra mudar, os dois artefatos precisam ser revisados conforme a hierarquia normativa definida no MASTER-SPEC.

## 4.14 Passo 11 — dados e informações sensíveis em nível de produto

Antes de modelar tabelas, PRODUCT deve reconhecer categorias de informação relevantes. O objetivo não é desenhar schema, mas tornar visíveis consequências de privacidade e segurança. O sistema armazenará dados pessoais? Dados financeiros? Documentos? Informações acadêmicas? Segredos comerciais? Logs com identificadores? Essa classificação inicial influencia requisitos posteriores.

No CRUD, um campo pode ser configurado pelo administrador. Isso cria uma questão importante: o produto permitirá que organizações criem colunas contendo dados sensíveis? Se sim, talvez seja necessário classificar campos, aplicar mascaramento, limitar exportação e registrar acesso. Essa necessidade pode não aparecer se a equipe pensar apenas na estrutura técnica de uma tabela genérica.

Em sistemas de IA, Ahmad et al. (2023) e Habiba et al. (2024) destacam a emergência de requisitos relacionados a dados, confiança, ética e explicabilidade. PRODUCT é o primeiro ponto no qual essas preocupações devem aparecer, mesmo que sua implementação seja detalhada posteriormente.

## 4.15 Passo 12 — riscos de produto

Risco de produto é uma condição que pode impedir o sistema de entregar valor ou produzir dano relevante. Ele não se limita a falhas técnicas. Pode incluir baixa adoção, dados insuficientes, dependência de integração, interpretação errada de recomendações, permissões excessivas, custos imprevisíveis ou confiança indevida em IA.

Uma matriz simples pode registrar risco, probabilidade qualitativa, impacto, mitigação e requisito relacionado. Por exemplo: “usuários podem interpretar similaridade semântica como equivalência acadêmica automática”; impacto alto; mitigação: interface deve distinguir recomendação de decisão, exigir revisão humana e mostrar evidências. Esse risco posteriormente gera requisitos de UX, IA e governança.

O agente de desenvolvimento não deve decidir sozinho quais riscos a organização aceita. Pode identificar e sugerir, mas aceitação de risco é uma decisão humana ou institucional.

## 4.16 Passo 13 — glossário do produto

Termos ambíguos são uma fonte clássica de defeitos em requisitos. “Usuário”, “cliente”, “gestor”, “matriz”, “status”, “aprovação” e “exclusão” podem possuir significados diferentes para grupos diferentes. PRODUCT deve iniciar um glossário que será aprofundado em DOMAIN.

Um glossário não é dicionário genérico. Ele define o significado do termo dentro do sistema. “Exclusão lógica: alteração do estado de um registro para removê-lo das operações normais sem apagar fisicamente seu histórico”. Essa definição orienta requisitos, código, testes e interface.

Agentes se beneficiam particularmente de glossários porque palavras próximas podem levar a inferências diferentes. Uma terminologia controlada reduz a probabilidade de o agente criar entidades duplicadas para conceitos equivalentes.

## 4.17 Passo 14 — hipóteses de produto e perguntas em aberto

Nem toda informação estará disponível no início. Em vez de esconder incerteza, PRODUCT deve registrá-la. Uma seção de hipóteses e perguntas em aberto impede que o agente converta ausência de decisão em decisão implícita. Exemplos: “a organização utilizará SSO?”; “qual o volume máximo de registros?”; “exportações precisam de assinatura digital?”; “a análise de equivalência será apenas recomendatória?”.

Cada pergunta deve possuir responsável e, quando relevante, prazo ou condição para resolução. Se a questão bloqueia arquitetura ou segurança, o requisito relacionado pode ficar \`BLOCKED\`. Se pode ser adiada sem risco, o projeto registra a hipótese temporária explicitamente.

Clarificação é particularmente importante em desenvolvimento com LLMs. Mu et al. (2024) mostram que requisitos incompletos podem levar modelos a gerar programas desalinhados à intenção e exploram clarificação interativa como forma de reduzir esse problema. O ASES-300 institucionaliza essa postura: incerteza identificada deve ser representada, não escondida.

## 4.18 Como transformar PRODUCT em DOMAIN e REQs

PRODUCT não é um documento terminal. Ele é uma fonte para derivação. Cada problema, ator, objetivo, jornada, risco e regra preliminar deve ser examinado para identificar elementos de domínio e requisitos. A transformação pode ser feita em uma oficina humana, com apoio de IA, desde que o resultado seja revisado.

Exemplo: PRODUCT afirma que analistas só podem editar determinados campos. DOMAIN identifica conceitos \`Role\`, \`Permission\`, \`Field\` e \`Scope\`. AUTHORIZATION define o modelo de política. REQUIREMENTS geram itens como “REQ-XXX — permissão de leitura por campo” e “REQ-YYY — permissão de edição por campo”. TESTING cria verificações positivas e negativas. TRACEABILITY liga todos os artefatos.

Essa cadeia evita que requisitos apareçam sem justificativa. Idealmente, é possível caminhar de um REQ até o problema ou objetivo que o originou e, no sentido contrário, verificar se cada objetivo relevante possui requisitos capazes de realizá-lo.

## 4.19 Rastreabilidade vertical desde o problema

Rastreabilidade costuma ser lembrada como relação entre requisito e teste, mas o ASES-300 propõe uma cadeia vertical mais longa: problema → objetivo → capacidade → requisito → implementação → teste/eval → evidência. Essa cadeia permite responder não apenas “este requisito foi testado?”, mas “por que este requisito existe?”.

Considere uma organização que deseja evitar exposição indevida de dados. O problema aparece em PRODUCT. O objetivo é aplicar controle granular. Uma capacidade é autorização por campo. O requisito estabelece que campos não autorizados não sejam retornados. A implementação está na policy. O teste simula usuário sem permissão. A evidência é o resultado aprovado. Se alguém propõe remover a policy, a rastreabilidade mostra imediatamente qual objetivo de produto será comprometido.

Essa visão também ajuda a combater requisitos órfãos: itens que consomem esforço, mas não contribuem para objetivo, obrigação ou risco conhecido. Nem todo requisito precisa derivar de uma funcionalidade; alguns derivam de segurança, legislação ou qualidade. Mas todos devem possuir razão identificável.

## 4.20 O papel da IA na elaboração do PRODUCT

LLMs podem ser excelentes parceiros para explorar perguntas, identificar inconsistências, sugerir stakeholders esquecidos, gerar cenários alternativos e revisar clareza textual. Revisões recentes mostram crescimento do uso de LLMs em atividades de Engenharia de Requisitos, incluindo elicitação, análise, especificação e validação (HEMMAT et al., 2025; SALEEM et al., 2025). Entretanto, a capacidade de produzir texto convincente também cria risco de fabricar consenso ou preencher lacunas sem evidência.

Por isso, o ASES-300 estabelece uma separação: IA pode auxiliar a elaborar PRODUCT; não pode inventar fatos organizacionais e tratá-los como aprovados. Toda informação não confirmada deve ser marcada como hipótese, sugestão ou pergunta. Se o modelo sugere que “o sistema deve possuir aprovação em dois níveis”, essa ideia só entra no escopo quando houver fundamento no problema ou decisão do responsável.

Uma prática útil é pedir ao agente não apenas soluções, mas perguntas. Em fases iniciais, perguntas de alta qualidade podem ser mais valiosas do que funcionalidades. “Quem pode desfazer uma exclusão?”, “o que ocorre quando um gestor muda de unidade?”, “exportação herda filtros e permissões?” são exemplos de perguntas que revelam requisitos futuros.

## 4.21 Anti-padrão: PRODUCT escrito como propaganda

Documentos de produto frequentemente utilizam linguagem promocional: “plataforma revolucionária”, “solução inteligente”, “experiência incomparável”. Essas expressões podem ter função comercial, mas possuem baixo valor normativo. Um agente não consegue transformar “experiência intuitiva” em comportamento verificável sem interpretação adicional.

No ASES-300, adjetivos vagos devem ser substituídos ou acompanhados por significado operacional. Em vez de “interface intuitiva”, PRODUCT pode dizer que usuários operacionais precisam concluir tarefas recorrentes com baixa necessidade de treinamento; UX posteriormente define critérios. Em vez de “alta segurança”, o documento identifica riscos e dados protegidos; SECURITY e REQs formalizam controles.

O objetivo não é tornar o texto frio, mas separar visão de evidência. PRODUCT pode comunicar propósito e ambição, desde que não substitua definições concretas por slogans.

## 4.22 Anti-padrão: começar pela stack

Outro erro recorrente é iniciar o projeto com “React + Node + PostgreSQL + IA” antes de compreender o problema. Tecnologias são importantes, mas pertencem principalmente a restrições e arquitetura. Quando escolhidas cedo demais, podem moldar artificialmente o problema para justificar a solução.

PRODUCT pode registrar restrições técnicas reais — por exemplo, a organização exige Cloudflare por razões operacionais —, mas deve diferenciar restrição de preferência. “Gostamos de React” não possui o mesmo peso de “a equipe de infraestrutura suporta apenas determinado ambiente”. Essa distinção permite que arquitetura seja uma decisão fundamentada.

Agentes tendem a responder prontamente quando recebem stack explícita. Isso é útil depois que a decisão foi tomada; antes disso, pode acelerar uma escolha prematura. O Harness deve impedir que preferências ocasionais sejam promovidas silenciosamente a decisões arquiteturais.

## 4.23 Anti-padrão: confundir feature com valor

Uma lista extensa de funcionalidades pode criar sensação de produto bem definido, mas features não explicam necessariamente valor. “Dashboard”, “chat”, “exportação”, “notificações” e “IA” podem existir sem resolver o problema central. PRODUCT precisa manter a relação entre capacidade e resultado.

Uma técnica simples é perguntar “para quê?” repetidamente. “Precisamos de exportação.” Para quê? “Para que gestores consolidem dados em reuniões externas.” Isso revela contexto e pode gerar requisitos sobre formato, filtros, segurança e auditoria. “Precisamos de IA.” Para quê? “Para comparar semanticamente ementas que não possuem códigos padronizados.” Agora existe uma função clara e passível de avaliação.

Quando uma feature não possui resposta convincente para “para quê?”, ela deve ser questionada antes de virar requisito.

## 4.24 Exemplo passo a passo — PRODUCT do CRUD hierárquico

Vamos consolidar o raciocínio em um exemplo. Problema: dados operacionais estão distribuídos em planilhas, com baixa capacidade de aplicar autorização granular e reconstruir alterações. Atores: administrador, gestor, analista, operador, auditor e titular de dados. Objetivo principal: permitir gestão tabular colaborativa com controle granular e auditoria. Escopo: autenticação, usuários, hierarquia, tabelas configuráveis, formulários, permissões, logs, importação e exportação. Fora do escopo inicial: aplicativo nativo, edição offline e billing.

Jornada principal: administrador configura estrutura e permissões; gestor cadastra ou importa registros; analista visualiza somente escopo permitido; edita campos autorizados; sistema valida no backend; alteração é registrada; exportação reproduz filtros e permissões. Riscos: exposição de campos sensíveis, configuração excessivamente complexa, exportação que contorna autorização e crescimento de volume. Restrições: tecnologias web, implantação em infraestrutura definida e custos compatíveis com o projeto.

Desse PRODUCT derivam requisitos gerais e de domínio. A necessidade de granularidade alimenta RBAC/ABAC e field-level permissions. A necessidade de reconstruir alterações gera logs com before/after. A familiaridade de planilha gera requisitos de tabela, redimensionamento e filtros. O risco de exportação gera requisitos de segurança. O PRODUCT não implementa nada, mas torna a implementação justificável.

## 4.25 Exemplo passo a passo — PRODUCT do sistema de matrizes curriculares

Considere agora um produto muito diferente. Problema: instituições mantêm matrizes curriculares de diferentes anos e cursos; estudantes que ingressam, reingressam ou mudam de curso precisam ter disciplinas comparadas manualmente; ementas e cargas horárias variam; decisões podem demandar análise extensa. Objetivo: apoiar análise de aderência entre histórico e matriz de destino, apresentando correspondências, diferenças e evidências para decisão humana.

Escopo pode incluir cadastro/versionamento de matrizes, importação de históricos, normalização de disciplinas, comparação de carga horária e ementa, similaridade semântica, regras institucionais, relatório de adequação e revisão humana. Fora do escopo: conceder automaticamente equivalência oficial sem autoridade acadêmica; alterar histórico de origem; inventar ementas ausentes. Riscos: falso positivo semântico, documentos incompletos, confiança excessiva na porcentagem e mudança de regras regulatórias.

Observe como PRODUCT já produz decisões importantes sobre IA. O modelo não é autoridade. Similaridade não é equivalência. Evidência precisa ser mostrada. Regras determinísticas e semânticas devem ser separadas. Esses princípios posteriormente aparecem em DOMAIN, AI, UX, TESTING/EVALS e requisitos específicos.

## 4.26 Template comentado de PRODUCT.md

O template a seguir será utilizado ao longo do livro. Ele não deve ser preenchido mecanicamente. Cada seção existe para responder uma pergunta de engenharia e pode ser expandida conforme complexidade do produto.

> \# PRODUCT.md  
>   
> \## 1. Identidade do produto  
> Nome:  
> Versão:  
> Responsável:  
>   
> \## 2. Resumo executivo  
> O que é o produto em linguagem objetiva?  
>   
> \## 3. Problema central  
> Qual situação existe hoje?  
> Quem é afetado?  
> Quais consequências são observadas?  
>   
> \## 4. Stakeholders  
> Grupo \| Interesse \| Responsabilidade \| Risco  
>   
> \## 5. Usuários e perfis  
> Quem utiliza?  
> Com qual frequência?  
> Para executar quais tarefas?  
>   
> \## 6. Objetivo principal  
> Qual transformação principal o produto pretende produzir?  
>   
> \## 7. Objetivos secundários  
> Quais resultados complementares são esperados?  
>   
> \## 8. Critérios de sucesso  
> Como saberemos se o produto gerou valor?  
>   
> \## 9. Escopo obrigatório  
> Quais capacidades precisam existir?  
>   
> \## 10. Fora do escopo  
> O que explicitamente não será construído nesta versão?  
>   
> \## 11. Premissas  
> O que estamos assumindo como verdadeiro?  
>   
> \## 12. Restrições  
> Quais limites técnicos, financeiros, legais ou organizacionais existem?  
>   
> \## 13. Dependências externas  
> De quais serviços, pessoas ou sistemas dependemos?  
>   
> \## 14. Jornadas principais  
> Quais sequências de uso precisam funcionar de ponta a ponta?  
>   
> \## 15. Regras de negócio preliminares  
> Quais regras são essenciais para compreender o produto?  
>   
> \## 16. Dados relevantes e sensíveis  
> Quais categorias de informação serão tratadas?  
>   
> \## 17. Riscos de produto  
> Risco \| Impacto \| Mitigação \| Responsável  
>   
> \## 18. Glossário  
> Termo \| Definição no contexto do produto  
>   
> \## 19. Hipóteses e perguntas em aberto  
> Questão \| Impacto \| Responsável \| Estado  
>   
> \## 20. Relação com DOMAIN e REQUIREMENTS  
> Quais elementos devem ser formalizados nos próximos artefatos?

## 4.27 Checklist de qualidade do PRODUCT

1\. O problema está descrito sem depender da solução tecnológica?

2\. Os grupos afetados e usuários estão identificados?

3\. O objetivo principal descreve uma transformação e não apenas uma feature?

4\. Existem critérios de sucesso observáveis?

5\. O escopo obrigatório está separado de ideias futuras?

6\. O fora do escopo está explícito?

7\. Premissas, restrições e dependências foram diferenciadas?

8\. As jornadas principais atravessam o processo de ponta a ponta?

9\. Riscos relevantes estão registrados?

10\. Dados sensíveis são reconhecidos antes da modelagem?

11\. Termos ambíguos possuem definição?

12\. Perguntas não resolvidas estão visíveis em vez de escondidas?

13\. É possível derivar DOMAIN e REQs a partir do documento?

14\. Há alguma tecnologia apresentada como solução sem justificativa?

15\. Há alguma funcionalidade sem relação clara com problema, objetivo, risco ou obrigação?

## 4.28 Matriz de derivação PRODUCT → REQUIREMENT

| Origem em PRODUCT             | Necessidade derivada              | Artefato intermediário   | REQ esperado                         | Verificação futura        |
|-------------------------------|-----------------------------------|--------------------------|--------------------------------------|---------------------------|
| Dados sensíveis               | Impedir exposição indevida        | AUTHORIZATION / SECURITY | Permissão de leitura por campo       | Teste API + exportação    |
| Auditoria                     | Reconstruir alterações            | DOMAIN / DATABASE        | Before/after + ator + data           | Teste de integração       |
| Jornada de exportação         | Exportar visão autorizada         | API / DOMAIN             | Exportação respeita filtros e escopo | Teste XLSX/CSV            |
| Risco de falso positivo de IA | Não automatizar decisão acadêmica | AI / DOMAIN              | Human-in-the-loop obrigatório        | Eval + teste de fluxo     |
| Escopo web responsivo         | Acesso em diferentes telas        | UX/UI                    | Responsividade mínima                | E2E visual/acessibilidade |

## 4.29 Exercício orientado

Escolha um produto que você pretende desenvolver e escreva apenas três elementos: problema central, objetivo principal e fora do escopo. Em seguida, faça o teste da tecnologia: remova do texto todos os nomes de frameworks, bancos, modelos de IA e plataformas. Se o problema e o objetivo deixarem de fazer sentido, provavelmente a solução foi confundida com a necessidade. Depois identifique cinco stakeholders e escreva uma jornada principal. Somente então liste funcionalidades. O objetivo do exercício é experimentar, na prática, a mudança de ordem proposta pelo ASES-300: problema antes de feature; valor antes de stack; contexto antes de código.

## 4.30 Conclusão

PRODUCT é o primeiro mecanismo de defesa do ASES-300 contra a construção eficiente da coisa errada. Ele transforma uma ideia em contexto de engenharia, registra problema, atores, objetivos, sucesso, escopo, limites, jornadas, riscos e incertezas e cria uma base da qual requisitos podem ser derivados. Sua qualidade não é medida pelo tamanho do texto, mas pela capacidade de reduzir ambiguidades relevantes sem antecipar decisões que pertencem a outras camadas.

A pesquisa recente em Engenharia de Requisitos reforça tanto o potencial de automação quanto a necessidade de atenção à qualidade, ambiguidade e validação, especialmente quando LLMs e componentes de IA participam do processo (UMAR; LANO, 2024; MU et al., 2024; HABIBA et al., 2024; HEMMAT et al., 2025; SALEEM et al., 2025). O ASES-300 incorpora essa literatura em uma regra operacional simples: inteligência artificial pode ajudar a explorar e organizar o problema, mas fatos não confirmados não devem ser transformados silenciosamente em especificação normativa.

No Capítulo 5, avançaremos para DOMAIN. Se PRODUCT responde por que o produto existe e qual transformação procura produzir, DOMAIN responde qual é o universo conceitual no qual esse produto opera: entidades, termos, invariantes, regras, estados, eventos, exceções e relações. Será o passo que transforma a linguagem do problema em uma linguagem de negócio suficientemente precisa para sustentar os requisitos específicos do sistema.

## 4.31 Referências utilizadas neste capítulo — registro provisório

As referências abaixo serão consolidadas no Capítulo 25 — Referências. Mantêm-se neste ponto durante a construção da obra para facilitar conferência e rastreabilidade acadêmica. Foram priorizados artigos recentes, de acesso aberto, publicados em periódicos, conferências ou repositórios acadêmicos reconhecidos.

AHMAD, Khlood; ABDELRAZEK, Mohamed; ARORA, Chetan; BANO, Muneera; GRUNDY, John. Requirements engineering for artificial intelligence systems: A systematic mapping study. **Information and Software Technology**, v. 158, art. 107176, 2023. Disponível em: https://doi.org/10.1016/j.infsof.2023.107176. Acesso em: 20 set. 2026.

BAMBAZEK, Peter; GROHER, Iris; SEYFF, Norbert. Requirements engineering for sustainable software systems: a systematic mapping study. **Requirements Engineering**, v. 28, p. 481-505, 2023. Disponível em: https://doi.org/10.1007/s00766-023-00402-1. Acesso em: 20 set. 2026.

HABIBA, Umm-e-; HAUG, Markus; BOGNER, Justus; WAGNER, Stefan et al. How mature is requirements engineering for AI-based systems? A systematic mapping study on practices, challenges, and future research directions. **Requirements Engineering**, v. 29, p. 567-600, 2024. Disponível em: https://doi.org/10.1007/s00766-024-00432-3. Acesso em: 20 set. 2026.

HEMMAT, Ali; SHARBAF, Mehdi; KOLAHDouz-RAHIMI, Shekoufeh; LANO, Kevin; TEHRANI, Seyed Yasser. Research directions for using LLM in software requirement engineering: a systematic review. **Frontiers in Computer Science**, v. 7, art. 1519437, 2025. Disponível em: https://doi.org/10.3389/fcomp.2025.1519437. Acesso em: 20 set. 2026.

KAUR, Kamaljit; KAUR, Parminder. The application of AI techniques in requirements classification: a systematic mapping. **Artificial Intelligence Review**, v. 57, art. 57, 2024. Disponível em: https://doi.org/10.1007/s10462-023-10667-1. Acesso em: 20 set. 2026.

MU, Fangwen; SHI, Lin; WANG, Song; YU, Zhuohao; ZHANG, Binquan; WANG, ChenXue; LIU, Shichao; WANG, Qing. ClarifyGPT: A Framework for Enhancing LLM-Based Code Generation via Requirements Clarification. **Proceedings of the ACM on Software Engineering**, v. 1, n. FSE, art. 103, p. 2332-2354, 2024. Disponível em: https://doi.org/10.1145/3660810. Acesso em: 20 set. 2026.

SALEEM, Summra; ASIM, Muhammad Nabeel; VAN ELST, Ludger; DENGEL, Andreas et al. Generative language models potential for requirement engineering applications: insights into current strengths and limitations. **Complex & Intelligent Systems**, v. 11, art. 278, 2025. Disponível em: https://doi.org/10.1007/s40747-024-01707-6. Acesso em: 20 set. 2026.

UMAR, Muhammad Aminu; LANO, Kevin. Advances in automated support for requirements engineering: a systematic literature review. **Requirements Engineering**, v. 29, p. 177-207, 2024. Disponível em: https://doi.org/10.1007/s00766-023-00411-0. Acesso em: 20 set. 2026.

# CAPÍTULO 5 — DOMAIN: DA LINGUAGEM DO NEGÓCIO AO MODELO QUE O SOFTWARE PRECISA RESPEITAR

## 5.1 PRODUCT explica o problema; DOMAIN explica o mundo no qual o problema existe

Depois de compreender por que o produto deve existir, o próximo passo é compreender o universo no qual ele irá operar. Esse universo é o domínio. Em termos práticos, domínio é o conjunto de conceitos, relações, regras, estados, eventos, restrições, exceções e significados que existem no contexto do problema. Uma universidade possui cursos, matrizes, disciplinas, estudantes, históricos, equivalências, cargas horárias e regras acadêmicas. Uma revista possui matérias, autores, colunas, edições, revisões e publicação. Um sistema administrativo possui usuários, papéis, unidades, registros, permissões e auditoria. O software não cria esses significados do nada: ele precisa representá-los.

No ASES-300, \`DOMAIN.md\` funciona como uma ponte entre a linguagem humana de PRODUCT e a formalização verificável de REQUIREMENTS. PRODUCT pode dizer que uma instituição precisa comparar históricos acadêmicos com matrizes atuais. DOMAIN precisa explicar o que significa matriz curricular, como uma matriz é versionada, o que diferencia disciplina cursada de disciplina aproveitada, o que é equivalência, quais fatores participam de uma análise e quem possui autoridade para tomar a decisão final. Somente depois disso um requisito como “calcular aderência entre histórico e matriz de destino” pode ser escrito sem depender de interpretações ocultas.

A literatura de modelagem reforça o valor de abstrações específicas do domínio. Bucaioni, Cicchetti e Ciccozzi (2022), ao revisar modelagem em desenvolvimento low-code, destacam o papel de abstrações e linguagens específicas de domínio para deslocar atenção de detalhes de programação para conceitos significativos do problema. Soavi et al. (2022), ao estudar a transformação de contratos legais em especificações formais, mostram uma cadeia que inclui identificação de conceitos, relações, modelagem de domínio e posterior formalização. Embora os contextos sejam diferentes, a mensagem é compatível com o ASES-300: antes de automatizar uma realidade, é preciso representá-la semanticamente.

## 5.2 O domínio não é o banco de dados

Um erro muito frequente é confundir modelagem de domínio com desenho de tabelas. Uma tabela \`students\` não é o conceito estudante; é uma forma técnica de persistir determinados atributos de estudantes. Uma tabela \`permissions\` não é a política de autorização; é uma parte de sua representação. Essa distinção parece teórica, mas possui efeitos concretos. Quando o banco passa a ditar o domínio, decisões acidentais de persistência começam a ser tratadas como regras do negócio.

Imagine que uma disciplina possa possuir múltiplas versões de ementa ao longo do tempo. Um banco simplificado pode conter apenas \`disciplina.nome\` e \`disciplina.ementa\`. Se o modelo conceitual não reconhece a noção de versão, a estrutura técnica apaga uma característica real do domínio. Posteriormente, comparações históricas ficam incorretas. O problema não nasceu na consulta SQL; nasceu na representação insuficiente do mundo.

Por isso, o ASES-300 recomenda a ordem \`PRODUCT → DOMAIN → REQUIREMENTS → ARCHITECTURE/DATABASE\`, ainda que na prática exista iteração entre essas etapas. O domínio deve ser compreendido antes de ser comprimido em estruturas de armazenamento.

## 5.3 Linguagem ubíqua: uma palavra deve significar a mesma coisa para negócio, documentação, agente e código

Projetos acumulam defeitos quando pessoas utilizam palavras iguais com significados diferentes ou palavras diferentes para o mesmo conceito. Um setor chama determinada operação de “convalidação”; outro, de “equivalência”; o código utiliza \`credit_transfer\`; a interface mostra “aproveitamento”. Talvez sejam sinônimos; talvez representem processos distintos. Se ninguém formaliza a diferença, o software passa a incorporar ambiguidades.

O ASES-300 utiliza o princípio de linguagem ubíqua como disciplina documental: termos centrais devem possuir definições explícitas e ser utilizados de maneira consistente em PRODUCT, DOMAIN, REQs, APIs, código e testes sempre que isso for razoável. O objetivo não é transformar toda linguagem humana em nomenclatura rígida, mas reduzir ambiguidade nos conceitos que alteram comportamento.

Para agentes de IA, esse cuidado é ainda mais relevante. Um LLM consegue lidar com sinônimos, mas justamente por isso pode aproximar conceitos que o domínio precisa manter separados. Se \`matriz vigente\` significa a versão oficialmente ativa para determinado ingresso, essa definição deve aparecer no domínio. O agente não deve inferir que a matriz com data mais recente é necessariamente a vigente.

## 5.4 Passo 1 — extrair substantivos, verbos, estados e regras do PRODUCT

Uma técnica didática para iniciar DOMAIN consiste em reler PRODUCT procurando quatro categorias. Substantivos sugerem conceitos ou entidades: usuário, curso, matriz, disciplina, registro, unidade. Verbos sugerem capacidades e relações: pertence, aprova, edita, compara, exporta. Estados sugerem ciclos de vida: rascunho, ativo, bloqueado, publicado, arquivado. Expressões condicionais sugerem regras: “somente se”, “exceto quando”, “deve”, “não pode”, “depende de”.

Essa extração não deve ser automatizada mecanicamente. Nem todo substantivo vira entidade e nem todo verbo vira operação de domínio. “Tela” pode aparecer em PRODUCT sem pertencer ao domínio. O objetivo é produzir uma lista inicial para discussão. A partir dela, especialistas e equipe técnica refinam significados.

LLMs podem auxiliar nessa etapa, inclusive sugerindo conceitos esquecidos. Ben Chaaben et al. (2024) investigam o uso de LLMs como assistência à modelagem de domínio e relatam potencial para apoiar modeladores, embora a utilidade dependa de qualidade, contexto e validação. No ASES-300, sugestões do modelo são candidatas; o domínio aprovado continua dependendo de validação humana e evidência organizacional.

## 5.5 Passo 2 — classificar conceitos: entidade, valor, política, serviço, evento ou referência

Depois de extrair conceitos, é útil classificá-los. Uma entidade possui identidade ao longo do tempo: um usuário continua sendo o mesmo usuário mesmo que seu nome mude. Um objeto de valor é definido principalmente por seus atributos: um intervalo de datas ou uma carga horária podem ser representados dessa forma. Uma política expressa decisão ou restrição: quem pode editar determinado campo. Um serviço de domínio representa comportamento que não pertence naturalmente a uma única entidade: calcular aderência entre duas matrizes. Um evento representa algo relevante que aconteceu: \`MatrizPublicada\`, \`UsuarioBloqueado\`, \`RegistroExportado\`.

Essa classificação não precisa reproduzir uma escola específica de arquitetura. Seu valor é forçar perguntas. Se \`Equivalência\` possui identidade, histórico, responsável e decisão, talvez seja entidade. Se é apenas o resultado transitório de uma comparação, pode ser valor calculado. A escolha afeta persistência, auditoria e requisitos.

O ASES-300 não exige que todo projeto utilize todos esses tipos. O importante é que conceitos relevantes sejam conscientemente modelados e que sua natureza não seja decidida acidentalmente pela primeira estrutura de código gerada.

## 5.6 Entidades e identidade

Identidade responde à pergunta: o que torna este objeto o mesmo ao longo do tempo? Um estudante pode mudar nome, e-mail e curso, mas seu registro institucional continua representando a mesma pessoa dentro daquele contexto. Uma matriz curricular pode receber correções; dependendo das regras institucionais, uma alteração pode criar nova versão ou atualizar a existente. Essas decisões são de domínio.

Para cada entidade importante, DOMAIN deve registrar identificador conceitual, atributos relevantes, relações, estados e invariantes. O identificador técnico — UUID, inteiro, ULID — pode ser decidido em DATABASE ou ARCHITECTURE. DOMAIN precisa dizer se existe uma identidade de negócio, como matrícula acadêmica ou código oficial, e quais propriedades ela possui.

Essa separação impede que decisões técnicas sejam confundidas com identidade semântica. Um UUID pode identificar uma linha; não explica o que torna uma matriz diferente de outra versão.

## 5.7 Objetos de valor e conceitos que não precisam de identidade própria

Nem tudo precisa virar entidade. Objetos de valor são úteis para representar conceitos cuja igualdade depende do conteúdo. Uma faixa de permissão, um percentual de aderência acompanhado de metodologia, uma carga horária ou um endereço podem ser tratados como valores, conforme o contexto. A principal pergunta é se precisamos acompanhar aquele objeto como indivíduo ou apenas seu significado.

No sistema de matrizes, \`SimilarityScore\` não deveria ser apenas um número solto. Pode ser um valor composto por percentual, método, versão do modelo, evidências e data. Isso evita que \`82%\` circule pelo sistema sem contexto. No CRUD, uma \`FieldPermission\` pode combinar capacidade de leitura, edição e exportação para determinado escopo.

Objetos de valor bem definidos reduzem primitive obsession: a tendência de representar conceitos ricos apenas como strings, números e booleanos. Para agentes, tipos conceituais claros também fornecem contexto adicional e diminuem interpretações equivocadas.

## 5.8 Invariantes: aquilo que nunca pode deixar de ser verdadeiro

Invariantes são regras que devem permanecer verdadeiras em todos os estados válidos do domínio. Elas são extremamente importantes porque se transformam naturalmente em validações e testes. Exemplos: uma matriz publicada deve possuir ao menos uma versão identificável; uma permissão de edição não deve conceder acesso fora do escopo organizacional; uma equivalência aprovada deve possuir responsável; uma porcentagem deve permanecer dentro do intervalo definido.

Uma boa forma de descobrir invariantes é perguntar: “que situação, se existir no banco, significa que o sistema está logicamente corrompido?”. Se um usuário pertence simultaneamente a unidades mutuamente exclusivas, talvez exista uma invariante. Se um registro arquivado pode ser editado normalmente, talvez exista outra.

No ASES-300, invariantes importantes devem sair de DOMAIN e gerar REQs, validações e testes. Não basta descrevê-las em prosa e esperar que o agente se lembre.

## 5.9 Regras de negócio: condições, decisões e exceções

Regra de negócio é uma afirmação que governa comportamento ou decisão dentro do domínio. Ela pode ser simples — “somente administradores podem criar papéis” — ou composta — “uma disciplina pode ser candidata à equivalência quando carga horária e conteúdo atendem critérios institucionais, mas a decisão final depende de autoridade acadêmica”.

Regras devem ser escritas de forma que condições e consequências fiquem visíveis. Uma estrutura útil é \`DADO / QUANDO / ENTÃO / EXCETO\`. Isso aproxima domínio de testes sem transformar DOMAIN em arquivo de teste. Exemplo: DADO que o usuário é ANALISTA e pertence à unidade A; QUANDO consulta registros; ENTÃO recebe apenas registros do escopo permitido; EXCETO quando possui delegação adicional válida.

Exceções merecem atenção especial. Sistemas falham frequentemente não no caminho normal, mas em situações como transferência de unidade, matrícula cancelada, disciplina sem ementa, registro restaurado ou permissão temporária. DOMAIN deve capturar exceções conhecidas antes que elas apareçam como condicionais improvisados no código.

## 5.10 Estados e máquinas de estado

Muitos conceitos possuem ciclo de vida. Um artigo pode ser rascunho, em revisão, aprovado, publicado e arquivado. Uma solicitação pode ser aberta, em análise, bloqueada, aprovada ou rejeitada. Uma matriz pode estar em elaboração, aprovada, vigente ou encerrada. Quando esses estados existem, DOMAIN deve representá-los explicitamente.

Uma máquina de estados descreve transições permitidas. \`RASCUNHO → PUBLICADO\` pode ser proibido se revisão for obrigatória. \`ARQUIVADO → ATIVO\` pode exigir restauração. Além de documentar comportamento, a máquina de estados impede que a interface seja a única responsável por controlar fluxo. O backend deve validar transições.

Para agentes, diagramas ou tabelas de transição são especialmente úteis porque transformam regras dispersas em estrutura. Um requisito pode apontar para uma transição específica e testes podem cobrir caminhos válidos e inválidos.

## 5.11 Eventos de domínio: registrar o que aconteceu, não apenas o estado atual

Estado responde como algo está agora; evento responde o que aconteceu. \`UsuarioCriado\`, \`PermissaoAlterada\`, \`MatrizPublicada\` e \`EquivalenciaAprovada\` são exemplos. Nem todo sistema precisa implementar Event Sourcing, mas reconhecer eventos importantes ajuda a descobrir auditoria, notificações, integrações e efeitos colaterais.

Se a publicação de uma matriz precisa atualizar disponibilidade para estudantes, invalidar caches e gerar registro de auditoria, o evento \`MatrizPublicada\` organiza essas consequências melhor do que espalhar chamadas em múltiplos pontos. DOMAIN pode registrar o evento mesmo que a arquitetura posteriormente implemente-o de forma simples.

Essa distinção também melhora rastreabilidade: uma alteração crítica pode precisar de evidência de quem provocou o evento, quando ocorreu e qual estado anterior existia.

## 5.12 Agregados e fronteiras de consistência

Alguns conceitos precisam ser modificados como unidade lógica. Em Domain-Driven Design, agregados ajudam a estabelecer fronteiras de consistência. O ASES-300 utiliza essa ideia de maneira pragmática: identificar conjuntos de objetos cujas invariantes precisam ser preservadas conjuntamente.

Uma \`MatrizCurricular\` pode agregar componentes, versões e regras de vigência; uma alteração que publica nova versão precisa garantir consistência do conjunto. Um \`Role\` pode agregar permissões; salvar parcialmente uma configuração pode criar janela de acesso incorreto. A fronteira ajuda a decidir transações e APIs.

Não é necessário transformar todo projeto em arquitetura DDD completa. A pergunta relevante é: quais dados e regras precisam mudar juntos para preservar validade? Essa resposta alimenta DATABASE, SERVICES e testes.

## 5.13 Contextos delimitados: quando a mesma palavra muda de significado

Sistemas grandes frequentemente possuem subdomínios nos quais o mesmo termo possui significados diferentes. \`Usuário\` no contexto de autenticação é uma identidade capaz de iniciar sessão; no contexto acadêmico pode ser estudante, professor ou coordenador; no contexto financeiro pode ser responsável por cobrança. Tentar criar um único modelo universal pode gerar entidades gigantes e acoplamento.

Contextos delimitados ajudam a reconhecer fronteiras semânticas. Dentro de cada contexto, a linguagem deve ser consistente. Entre contextos, integrações traduzem conceitos. No ASES-300, essa técnica é especialmente útil em produtos que combinam administração, conteúdo, financeiro, acadêmico e IA.

O objetivo não é multiplicar microsserviços. Contexto delimitado é primeiro uma fronteira conceitual. Um monólito modular pode possuir vários contextos bem definidos sem existir uma infraestrutura distribuída.

## 5.14 Subdomínio central, de apoio e genérico

Nem todas as partes do domínio possuem o mesmo valor estratégico. O subdomínio central é aquilo que diferencia o produto e merece maior atenção. Subdomínios de apoio são necessários, mas não constituem a principal diferenciação. Capacidades genéricas podem ser atendidas por soluções existentes.

No sistema de matrizes, comparação e explicação de equivalências podem formar o núcleo. Autenticação é essencial, mas genérica. Envio de e-mail é infraestrutura. Essa classificação ajuda a distribuir esforço: não faz sentido construir um provedor de autenticação próprio se o valor do produto está em análise curricular.

Para agentes, essa informação orienta autonomia e profundidade. No núcleo do domínio, alterações exigem maior contexto e validação; em capacidades genéricas, reutilização de bibliotecas maduras pode ser preferível.

## 5.15 DOMAIN e autorização: permissão também é regra de negócio

Autorização costuma ser tratada apenas como segurança técnica, mas muitas políticas de acesso expressam o próprio domínio. “Gestor pode visualizar subordinados da sua unidade” contém conceitos de hierarquia, pertencimento e escopo. “Professor pode editar nota até o fechamento do diário” combina papel, recurso, estado e tempo.

DOMAIN deve registrar a semântica dessas relações; AUTHORIZATION transforma-as em política executável. Se a semântica ficar apenas em middleware, o sistema pode até funcionar, mas ninguém consegue explicar adequadamente por que determinada decisão de acesso existe.

No CRUD hierárquico, o domínio pode definir \`OrganizationalScope\`, \`Role\`, \`Resource\`, \`Action\` e \`Field\`. AUTH posteriormente decide como RBAC e ABAC representam essas relações. Essa separação permite trocar mecanismo de autorização sem alterar a regra de negócio.

## 5.16 DOMAIN e temporalidade

Tempo é frequentemente um elemento oculto. Regras podem valer a partir de determinada data; matrizes possuem vigência; permissões podem expirar; preços mudam; vínculos começam e terminam. Modelar apenas o estado atual destrói informação necessária para decisões históricas.

DOMAIN deve perguntar para cada conceito relevante: precisamos saber apenas como está agora ou também como estava quando determinado evento ocorreu? No sistema acadêmico, comparar um histórico de 2022 com uma matriz atual pode exigir conhecer a ementa válida em 2022. Atualizar a ementa em uma única linha apagaria esse contexto.

Temporalidade gera requisitos de versionamento, \`valid_from\`, \`valid_to\`, histórico e auditoria. Esses detalhes serão formalizados em DATABASE, mas sua necessidade nasce no domínio.

## 5.17 DOMAIN e porcentagens: números precisam de significado

Percentuais são sedutores porque parecem objetivos. Um sistema pode dizer que um estudante possui “82% de aderência” a um curso. Sem definição de domínio, porém, esse número é quase vazio. O que entra no denominador? Carga horária? Quantidade de disciplinas? Créditos? Similaridade semântica? Disciplinas obrigatórias possuem peso maior? Atividades complementares entram?

DOMAIN deve definir a semântica da métrica antes de a IA ou o código calculá-la. Pode existir mais de uma métrica: cobertura de carga horária, similaridade de conteúdo e estimativa de tempo restante. Misturá-las em um único número pode ocultar informação.

Esse exemplo mostra por que domínio não pode ser delegado ao modelo. O LLM consegue propor fórmulas plausíveis, mas a instituição precisa decidir qual fórmula representa sua política.

## 5.18 DOMAIN e inteligência artificial: separar inferência de autoridade

Quando IA entra no produto, DOMAIN precisa distinguir aquilo que o modelo infere daquilo que o negócio decide. Em equivalência curricular, embeddings podem indicar proximidade semântica entre ementas. Isso é evidência. A decisão oficial pode depender de carga horária, conteúdos mínimos, normas institucionais e análise humana. Transformar similaridade em equivalência automática seria uma mudança de domínio, não apenas de tecnologia.

Por isso, resultados de IA devem receber nomes semanticamente honestos: \`SimilaritySuggestion\` é diferente de \`ApprovedEquivalence\`. A primeira pode conter score, trechos relevantes, modelo e confiança; a segunda possui autoridade, responsável e data. Essa nomenclatura reduz risco de automatização indevida.

Jahić, Guelfi e Ries (2023), ao propor uma linguagem específica de domínio para requisitos de datasets e reconhecimento por redes neurais, mostram como componentes de aprendizado de máquina introduzem propriedades que precisam ser representadas explicitamente. O ASES-300 aplica o mesmo princípio de separação conceitual: dados, inferência, regra e decisão não devem ser fundidos.

## 5.19 DOMAIN e qualidade: requisitos não funcionais também nascem do contexto

Desempenho, disponibilidade, segurança e usabilidade são frequentemente chamados de requisitos de qualidade. Eles não surgem no vazio. O domínio ajuda a explicar por que determinado nível importa. Um atraso de cinco segundos pode ser irrelevante em relatório mensal e inaceitável em operação repetida centenas de vezes por hora.

Olsson, Sentilles e Papatheocharous (2022), em revisão sistemática sobre requisitos de qualidade, mostram que esse campo continua apresentando desafios de tratamento sistemático na prática. No ASES-300, DOMAIN contribui registrando características que justificam qualidade: volume, criticidade, frequência, sensibilidade e consequências de falha. QUALITY REQs posteriormente transformam isso em critérios mensuráveis.

Assim, DOMAIN não substitui os requisitos de qualidade; fornece o contexto que impede números arbitrários.

## 5.20 Modelos visuais: diagramas como complemento, não como decoração

Diagramas podem tornar relações complexas mais compreensíveis. Um modelo conceitual pode mostrar Curso → Matriz → Componente Curricular. Uma máquina de estados mostra transições. Um mapa de contexto mostra fronteiras. Um diagrama de eventos mostra consequências. Entretanto, diagramas precisam ser acompanhados por definições textuais.

Um diagrama bonito com caixas chamadas \`User\`, \`Role\` e \`Permission\` não explica se um usuário pode ter múltiplos papéis, se papéis variam por organização ou se permissões podem ser negadas explicitamente. A prosa e as regras completam o significado.

Para agentes, formatos textuais versionáveis como Mermaid podem ser úteis porque permitem leitura e atualização no repositório. O ASES-300 recomenda que o diagrama represente uma fonte compreensível e rastreável, não uma imagem isolada cuja semântica não possa ser processada.

## 5.21 Exemplo de modelo conceitual em Mermaid

Um modelo simples do sistema de matrizes pode ser representado da seguinte forma. O objetivo não é antecipar o schema físico, mas mostrar relações conceituais.

> flowchart LR  
> Student\[Estudante\] --\> History\[Histórico Acadêmico\]  
> History --\> Completed\[Disciplina Cursada\]  
> Course\[Curso\] --\> Matrix\[Matriz Curricular\]  
> Matrix --\> Version\[Versão da Matriz\]  
> Version --\> Component\[Componente Curricular\]  
> Completed --\> Analysis\[Análise de Aderência\]  
> Component --\> Analysis  
> Analysis --\> Suggestion\[Sugestão de Correspondência\]  
> Suggestion --\> Decision\[Decisão Acadêmica\]  
> Authority\[Autoridade Acadêmica\] --\> Decision

## 5.22 Passo 3 — documentar cada conceito com ficha de domínio

Depois do mapa inicial, cada conceito importante deve possuir uma ficha curta e padronizada. A ficha evita definições dispersas. Ela pode conter nome, definição, tipo conceitual, identidade, atributos relevantes, relações, estados, invariantes, eventos, regras, exceções e requisitos derivados.

Por exemplo, \`MatrizCurricular\`: conjunto estruturado de componentes curriculares aplicável a determinado curso e contexto de vigência. Identidade: código institucional mais versão. Estados: rascunho, aprovada, vigente, encerrada. Invariante: uma versão vigente precisa estar aprovada. Evento: \`MatrizTornadaVigente\`. Exceção: correção administrativa que não altera conteúdo pode seguir procedimento específico. A ficha já fornece material para REQs e testes.

Essas fichas também são excelentes unidades de contexto para agentes: em vez de carregar todo DOMAIN, o Harness pode recuperar as fichas relacionadas à tarefa.

## 5.23 Passo 4 — registrar regras em catálogo

Regras de negócio merecem identificadores próprios, especialmente quando são numerosas. Um catálogo pode usar \`BR-001\`, \`BR-002\` e assim por diante. Esses identificadores não substituem REQs: a regra descreve a lógica do domínio; o requisito determina o que o sistema deve fazer para respeitá-la.

Exemplo: \`BR-014 — uma disciplina aprovada como equivalente deve possuir decisão humana identificável\`. A partir dela podem nascer \`REQ-327 — registrar responsável pela aprovação\`, \`REQ-328 — impedir aprovação sem responsável\` e \`REQ-329 — exibir decisão no relatório\`. Um teste pode referenciar ambos.

Essa separação permite que uma única regra gere vários comportamentos sem duplicar sua definição conceitual.

## 5.24 Passo 5 — identificar exceções antes que virem bugs

Uma oficina de domínio deve perguntar explicitamente “quando essa regra não vale?”. Exceções podem ser legítimas ou sinais de que a regra foi mal definida. No acadêmico: uma disciplina sem ementa pode ser analisada? Uma matriz encerrada pode receber correção? No CRUD: um administrador global está sujeito ao mesmo escopo de unidade? Um usuário bloqueado continua aparecendo em auditoria?

Registrar exceções reduz condicionais improvisados. Quando a exceção é legítima, ela ganha nome e regra. Quando é rara e perigosa, pode exigir fluxo administrativo separado. Quando não deveria existir, transforma-se em invariante.

Agentes são particularmente propensos a implementar apenas o caminho mais evidente. Uma seção de exceções torna o espaço de estados mais explícito e melhora geração de testes.

## 5.25 Passo 6 — validar o domínio com cenários concretos

Um modelo de domínio não deve ser validado apenas lendo definições abstratas. É preciso executar mentalmente cenários reais. Pegue um caso comum, um caso limite e um caso excepcional e percorra entidades, estados e regras. Se o modelo não consegue representar o caso sem improvisação, provavelmente está incompleto.

No sistema de matrizes: estudante cursou disciplina com nome diferente, carga horária maior e ementa parcialmente equivalente; a matriz de origem foi encerrada; a ementa disponível pertence à versão correta? Quem decide? O score significa o quê? Esse cenário força o modelo a revelar temporalidade, proveniência e autoridade.

No CRUD: analista muda de unidade no meio do mês; permissões antigas devem cessar imediatamente? E registros que ele criou? Logs continuam visíveis para auditor? O cenário revela regras que uma lista estática de entidades não mostraria.

## 5.26 Passo 7 — transformar DOMAIN em DOMAIN-REQUIREMENTS

Depois de estabilizar conceitos e regras, inicia-se a derivação dos requisitos específicos do produto. No ASES-300, os requisitos gerais ocupam \`REQ-001\` a \`REQ-300\`; os requisitos de domínio começam em \`REQ-301\`. Essa numeração não significa que domínio seja menos importante. Ela apenas preserva um núcleo geral reutilizável e deixa espaço ilimitado para particularidades.

Cada DOMAIN REQ deve apontar para a origem conceitual. Se \`REQ-315 — versionar matrizes curriculares\` nasce da regra de temporalidade de \`MatrizCurricular\`, a rastreabilidade registra essa relação. Se \`REQ-341 — revisão humana obrigatória\` nasce da distinção entre sugestão de IA e decisão oficial, isso também deve estar explícito.

O resultado é \`ASES-300 + X\`: trezentos requisitos estruturais mais quantos requisitos forem necessários para representar o produto real.

## 5.27 Exemplo — domínio do CRUD hierárquico

No CRUD, os conceitos centrais podem incluir \`Organization\`, \`OrganizationalUnit\`, \`User\`, \`Role\`, \`Permission\`, \`Resource\`, \`Field\`, \`Record\`, \`SavedView\`, \`ImportJob\`, \`ExportJob\` e \`AuditEvent\`. Uma permissão não é apenas booleano; pode possuir ação, recurso, escopo organizacional e campo. Um usuário pode acumular papéis em contextos diferentes. Um registro pertence a uma estrutura e pode possuir metadados de criação, alteração e estado.

Uma regra importante pode dizer que autorização efetiva resulta da combinação de identidade, papéis, atributos, escopo e política do recurso. Outra regra pode estabelecer que exportação nunca amplia acesso: tudo que não pode ser lido na API também não pode aparecer no arquivo. Uma terceira determina que logs de auditoria são imutáveis para usuários comuns.

Essas regras geram dezenas de REQs específicos e gerais. O valor do DOMAIN está em mostrar que todos pertencem ao mesmo modelo, em vez de parecerem funcionalidades independentes.

## 5.28 Exemplo — domínio da revista jurídica

Em uma revista jurídica digital, conceitos podem incluir \`Article\`, \`News\`, \`Column\`, \`Author\`, \`Editor\`, \`Review\`, \`Publication\`, \`Topic\`, \`MediaAsset\` e \`Correction\`. Um texto pode estar em rascunho, revisão, aprovado, agendado, publicado ou arquivado. Uma correção pós-publicação pode precisar preservar histórico. Autores podem possuir vínculos e responsabilidades diferentes.

Se o domínio não diferencia edição editorial de alteração pós-publicação, o sistema pode sobrescrever conteúdo histórico sem registro. Se não diferencia autor de usuário, pode impedir que um artigo tenha autor externo sem conta. O domínio antecipa essas situações antes que o banco cristalize um modelo simplista.

Esse exemplo mostra que DOMAIN não é exclusivo de sistemas complexos de IA. Qualquer software que represente uma realidade com regras se beneficia de linguagem explícita.

## 5.29 Anti-padrão: transformar cada substantivo em tabela

Uma lista de substantivos é ponto de partida, não schema. Criar uma tabela para cada palavra gera modelos anêmicos ou artificiais. Alguns conceitos são valores, outros políticas, eventos ou propriedades derivadas. A modelagem precisa perguntar qual comportamento e identidade o conceito possui.

O anti-padrão oposto também existe: colocar tudo em uma tabela genérica com JSON porque é mais rápido. Flexibilidade técnica pode apagar invariantes e dificultar consultas, validação e autorização. O ASES-300 não proíbe modelos flexíveis; exige que a flexibilidade seja decisão consciente e que regras continuem verificáveis.

## 5.30 Anti-padrão: modelo anêmico sem regras

Um modelo anêmico contém entidades com dados, mas as regras ficam espalhadas em controllers, componentes e scripts. Isso dificulta descobrir onde a verdade do domínio está. Para agentes, o problema se agrava: ao editar um fluxo, podem não localizar todas as regras relacionadas.

Nem toda regra precisa estar dentro de uma classe de entidade. O importante é existir uma camada conceitual identificável: policies, services, validators ou módulos de domínio. DOMAIN deve apontar onde cada regra é implementada e testada quando a rastreabilidade for construída.

## 5.31 Anti-padrão: permitir que a IA defina o domínio sozinha

LLMs são úteis para explorar alternativas, mas não possuem autoridade epistemológica sobre regras internas de uma organização. Um modelo pode conhecer práticas comuns de universidades e ainda estar errado sobre a política específica de uma instituição. Pode sugerir que 75% de similaridade é suficiente para equivalência, embora não exista nenhuma regra institucional com esse limiar.

Ben Chaaben et al. (2024) mostram utilidade potencial de assistência por LLM em modelagem de domínio, mas assistência não equivale a delegação total. No ASES-300, o agente deve marcar inferências, solicitar validação quando a decisão altera significado e registrar a fonte de regras críticas.

A regra é simples: IA pode propor o mapa; especialistas validam o território.

## 5.32 Template comentado de DOMAIN.md

O template abaixo fornece uma estrutura reutilizável. Projetos pequenos podem utilizar uma versão reduzida; projetos complexos podem dividir o domínio em múltiplos arquivos ou contextos.

> \# DOMAIN.md  
>   
> \## 1. Visão geral do domínio  
> Qual universo de negócio está sendo representado?  
>   
> \## 2. Linguagem ubíqua  
> Termo \| Definição \| Sinônimos proibidos/aceitos \| Contexto  
>   
> \## 3. Contextos delimitados  
> Contexto \| Responsabilidade \| Conceitos principais \| Integrações  
>   
> \## 4. Entidades  
> Nome \| Identidade \| Estados \| Relações \| Invariantes  
>   
> \## 5. Objetos de valor  
> Nome \| Componentes \| Regras de validade  
>   
> \## 6. Serviços e políticas de domínio  
> Nome \| Responsabilidade \| Entradas \| Saídas \| Regras  
>   
> \## 7. Regras de negócio  
> BR-ID \| Regra \| Exceções \| Fonte \| REQs derivados  
>   
> \## 8. Máquinas de estado  
> Entidade \| Estado atual \| Evento \| Próximo estado \| Condição  
>   
> \## 9. Eventos de domínio  
> Evento \| Quando ocorre \| Dados mínimos \| Consequências  
>   
> \## 10. Temporalidade e versionamento  
> Quais conceitos precisam preservar histórico ou vigência?  
>   
> \## 11. Autoridade e decisão  
> Quem pode recomendar, aprovar, rejeitar ou substituir decisões?  
>   
> \## 12. IA no domínio  
> O que é inferência?  
> O que é regra determinística?  
> O que exige decisão humana?  
>   
> \## 13. Casos limite e exceções  
> Caso \| Comportamento esperado \| Regra relacionada  
>   
> \## 14. Riscos semânticos  
> Quais conceitos podem ser confundidos ou automatizados indevidamente?  
>   
> \## 15. Requisitos de domínio derivados  
> REQ-301+ \| Origem \| Prioridade \| Critério de aceite  
>   
> \## 16. Questões em aberto  
> Questão \| Impacto \| Responsável \| Estado

## 5.33 Exemplo de ficha de conceito

| Campo          | Exemplo — MatrizCurricular                                                 |
|----------------|----------------------------------------------------------------------------|
| Definição      | Estrutura curricular oficial associada a um curso e organizada em versões. |
| Tipo           | Entidade/agregado conceitual.                                              |
| Identidade     | Curso + identificador institucional + versão.                              |
| Estados        | Rascunho, aprovada, vigente, encerrada.                                    |
| Invariante     | Somente versão aprovada pode tornar-se vigente.                            |
| Temporalidade  | Vigência deve possuir início; encerramento preserva histórico.             |
| Evento         | MatrizAprovada; MatrizTornadaVigente; MatrizEncerrada.                     |
| Autoridade     | Aprovação depende do papel acadêmico definido pela instituição.            |
| IA             | Pode apoiar comparação; não altera vigência nem aprovação.                 |
| REQs derivados | Versionamento, histórico, transições, autorização e auditoria.             |

## 5.34 Checklist de qualidade do DOMAIN

1\. Os conceitos centrais possuem definição inequívoca?

2\. Sinônimos perigosos foram identificados?

3\. Entidades foram separadas de objetos de valor, políticas e eventos?

4\. As identidades de negócio estão claras?

5\. Invariantes foram registradas?

6\. Regras possuem condições, consequências e exceções?

7\. Estados e transições relevantes estão explícitos?

8\. Temporalidade e versionamento foram considerados?

9\. Autoridade para decisões está definida?

10\. Inferência de IA foi separada de decisão oficial?

11\. Contextos semanticamente diferentes foram separados?

12\. Casos limite foram percorridos?

13\. O modelo consegue representar cenários históricos?

14\. Cada regra importante pode originar REQ e teste?

15\. Existem conceitos criados apenas por conveniência técnica que deveriam ficar fora do DOMAIN?

## 5.35 Matriz DOMAIN → REQ → TEST

| Origem de domínio    | Regra                             | REQ derivado                        | Teste/Eval           | Evidência                                 |
|----------------------|-----------------------------------|-------------------------------------|----------------------|-------------------------------------------|
| MatrizCurricular     | Somente aprovada torna-se vigente | REQ-30X — validar transição         | Integration test     | Transição inválida rejeitada              |
| FieldPermission      | Exportação não amplia leitura     | REQ-30Y — filtrar campos exportados | Export test          | XLSX sem campo proibido                   |
| SimilaritySuggestion | Sugestão não é decisão            | REQ-30Z — revisão humana            | E2E + AI eval        | Fluxo exige aprovação                     |
| AuditEvent           | Evento crítico é preservado       | REQ-31A — auditoria imutável        | Security/integration | Alteração indevida rejeitada              |
| VersionedSyllabus    | Histórico preserva versão         | REQ-31B — versionar ementa          | Integration test     | Consulta histórica retorna versão correta |

## 5.36 Exercício orientado

Retorne ao PRODUCT elaborado no exercício do capítulo anterior. Sublinhe dez substantivos, dez verbos e todas as expressões condicionais. Classifique os conceitos encontrados como entidade, objeto de valor, política, serviço, evento ou elemento puramente técnico. Escolha três entidades e escreva identidade, estados e invariantes. Em seguida, selecione cinco regras de negócio e escreva pelo menos uma exceção ou caso limite para cada uma. Finalmente, derive cinco requisitos específicos iniciando em REQ-301. O objetivo não é produzir o domínio perfeito na primeira tentativa, mas experimentar a transformação da linguagem do problema em um modelo semântico verificável.

## 5.37 Conclusão

DOMAIN é a camada que impede que o software reduza uma realidade complexa a nomes de telas e tabelas. Ele formaliza a linguagem do negócio, distingue entidades, valores, políticas, serviços e eventos, registra invariantes, estados, temporalidade, autoridade, exceções e fronteiras conceituais. Essa representação fornece significado para os requisitos e reduz a quantidade de decisões que precisariam ser improvisadas durante a implementação.

A modelagem de domínio também ganha nova importância com agentes de IA. LLMs podem ajudar a extrair conceitos e explorar modelos, mas sua fluência não substitui conhecimento institucional. A literatura recente sobre assistência por LLMs à modelagem e sobre formalização de domínios indica oportunidades importantes, mas reforça a necessidade de estrutura e validação (SOAVI et al., 2022; BUCAIONI; CICCHETTI; CICCOZZI, 2022; BEN CHAABEN et al., 2024). No ASES-300, a inteligência artificial participa como instrumento de descoberta e análise; a verdade normativa do domínio permanece explicitamente governada.

Com PRODUCT e DOMAIN estabelecidos, o próximo passo é transformar conhecimento em obrigações verificáveis. O Capítulo 6 será dedicado a REQUIREMENTS: anatomia de um requisito ASES-300, linguagem normativa, classificação CORE/CONDITIONAL/DOMAIN, prioridades, dependências, critérios de aceite, estados PASS/FAIL/BLOCKED/N/A, evidências, rastreabilidade e a diferença fundamental entre escrever uma necessidade e escrever algo que um Harness consegue verificar.

## 5.38 Referências utilizadas neste capítulo — registro provisório

As referências serão consolidadas no Capítulo 25 — Referências. Nesta fase, permanecem junto ao capítulo para conferência e rastreabilidade acadêmica. Foram priorizadas publicações recentes e de acesso aberto.

BEN CHAABEN, Meriem; BURGUEÑO, Lola; DAVID, Istvan; SAHRAOUI, Houari. On the Utility of Domain Modeling Assistance with Large Language Models. arXiv, 2024. Disponível em: https://arxiv.org/abs/2410.12577. Acesso em: 20 set. 2026.

BUCAIONI, Alessio; CICCHETTI, Antonio; CICCOZZI, Federico. Modelling in low-code development: a multi-vocal systematic review. **Software and Systems Modeling**, v. 21, p. 1959-1981, 2022. Disponível em: https://doi.org/10.1007/s10270-021-00964-0. Acesso em: 20 set. 2026.

JAHIĆ, Benjamin; GUELFI, Nicolas; RIES, Benoît. SEMKIS-DSL: A Domain-Specific Language to Support Requirements Engineering of Datasets and Neural Network Recognition. **Information**, v. 14, n. 4, art. 213, 2023. Disponível em: https://doi.org/10.3390/info14040213. Acesso em: 20 set. 2026.

OLSSON, Thomas; SENTILLES, Séverine; PAPATHEOCHAROUS, Efi. A systematic literature review of empirical research on quality requirements. **Requirements Engineering**, v. 27, p. 249-271, 2022. Disponível em: https://doi.org/10.1007/s00766-022-00373-9. Acesso em: 20 set. 2026.

SOAVI, Michele; ZENI, Nicola; MYLOPOULOS, John; MICH, Luisa; DUCATO, Rossana. From Legal Contracts to Formal Specifications: A Systematic Literature Review. **SN Computer Science**, v. 3, art. 298, 2022. Disponível em: https://doi.org/10.1007/s42979-022-01228-4. Acesso em: 20 set. 2026.

# CAPÍTULO 6 — REQUIREMENTS: DA NECESSIDADE À OBRIGAÇÃO VERIFICÁVEL

## 6.1 O requisito como unidade verificável do Método 300

PRODUCT explica por que o produto deve existir e DOMAIN explica o universo conceitual que ele precisa respeitar. REQUIREMENTS transforma esse conhecimento em obrigações que podem ser implementadas, verificadas e rastreadas. Essa transformação é decisiva. Uma frase como “o sistema deve ser seguro” expressa uma intenção legítima, mas ainda é insuficiente para orientar implementação e prova. Quem precisa ser protegido? Contra qual comportamento? Em qual camada? Como saberemos que a propriedade foi satisfeita? Um requisito ASES-300 procura reduzir essa distância entre intenção e evidência.

No método, um requisito não é apenas uma frase numerada. Ele é uma unidade de contrato entre produto, domínio, implementação e verificação. Por isso possui identidade estável, classificação, prioridade, origem, dependências, declaração normativa, explicação didática, critério de aceite, mecanismo de verificação, evidência esperada e estado. Quanto mais crítico o requisito, menor deve ser a quantidade de informação deixada para interpretação do executor.

Essa preocupação é consistente com a literatura recente. Frattini et al. (2023) argumentam que qualidade de requisitos precisa ser tratada de maneira operacionalizável, e não apenas por listas abstratas de atributos. Estudos empíricos também mostram que especificações assumem formas variadas na prática industrial (FRANCH et al., 2023). O ASES-300 responde a esse problema propondo uma unidade documental que seja simultaneamente compreensível por pessoas e processável por Harnesses e agentes.

## 6.2 Uma necessidade não é automaticamente um requisito

Uma necessidade pode ser ampla: “gestores precisam acompanhar sua equipe”. Para transformá-la em requisitos, é preciso descobrir quais estados do sistema realizam essa necessidade. Talvez o gestor precise visualizar subordinados, filtrar atividades, consultar indicadores e não enxergar pessoas de outras unidades. Cada uma dessas propriedades pode exigir requisitos diferentes. O erro comum é colocar toda a necessidade em uma frase gigantesca e depois declarar que ela foi implementada porque uma parte apareceu na interface.

O ASES-300 recomenda decomposição até que cada requisito possua responsabilidade suficientemente coesa para ser verificada. Isso não significa atomizar artificialmente tudo. “O usuário deve informar e-mail e senha para autenticar” pode ser um requisito coeso. Mas “o sistema deve cadastrar usuários, definir permissões, enviar e-mail, registrar logs e exportar relatórios” reúne capacidades independentes e deve ser dividido.

Uma heurística prática é perguntar: este requisito pode receber PASS enquanto uma parte importante da frase continua falsa? Se sim, provavelmente contém mais de uma obrigação e precisa ser decomposto.

## 6.3 Identificador estável: por que REQ-111 não deve mudar de significado

Cada requisito recebe um identificador único e persistente, como REQ-111. O identificador permite relacionar documentação, código, testes, issues, commits e evidências sem depender do título. Se REQ-111 significa “permissão de leitura por coluna”, ele não deve passar a significar “autenticação multifator” numa revisão futura. Se o requisito for substituído, sua história deve ser preservada e um novo ID deve ser criado quando a mudança for semanticamente significativa.

Essa estabilidade é essencial para rastreabilidade. Um teste chamado \`req-111-field-read.spec.ts\` perde sentido se o número for reciclado. Da mesma forma, um relatório de release precisa conseguir comparar versões do projeto. IDs são endereços semânticos; títulos podem melhorar, mas a identidade histórica precisa ser governada.

## 6.4 A anatomia completa de um requisito ASES-300

Para os trezentos requisitos gerais desta obra, adotaremos uma ficha didática ampliada. Ela terá: ID e título; classificação; prioridade sugerida; área; declaração normativa; explicação; importância; aplicabilidade; opções de implementação; exemplo prático; anti-padrão; critério de aceite; verificação; dependências; estados permitidos; regra de N/A; evidência esperada; e relações com outros artefatos. Em projetos reais, uma representação YAML pode guardar os campos operacionais enquanto o Markdown preserva explicação extensa.

A declaração normativa responde “o que deve ser verdade”. A explicação responde “o que isso significa”. Critério de aceite responde “qual observação permite aceitar”. Verificação responde “como obter essa observação”. Evidência responde “o que será armazenado para provar que a verificação ocorreu”. Essas quatro camadas não devem ser confundidas.

## 6.5 Linguagem normativa: DEVE, NÃO DEVE, PODE e DEVERIA

O método utiliza linguagem normativa para distinguir obrigação de recomendação. \`DEVE\` indica comportamento obrigatório. \`NÃO DEVE\` expressa proibição. \`PODE\` representa possibilidade autorizada. \`DEVERIA\` deve ser usado com parcimônia para recomendações que admitem exceção justificada. Em requisitos críticos, expressões vagas como “preferencialmente”, “quando possível”, “adequadamente” e “de forma intuitiva” precisam ser acompanhadas de condição objetiva ou movidas para explicação.

Exemplo fraco: “O sistema deve exportar dados de forma segura”. Exemplo melhor: “O sistema DEVE aplicar à exportação as mesmas restrições de leitura por registro e campo utilizadas pela API; campos sem permissão de leitura NÃO DEVEM constar no arquivo exportado”. A segunda formulação permite construir testes positivos e negativos.

Formalidade não significa escrever linguagem matemática para tudo. O objetivo é reduzir interpretações relevantes. Uma interface pode ter requisitos em linguagem natural bem estruturada; uma invariante financeira crítica pode justificar expressão formal adicional.

## 6.6 Explicação didática: o requisito precisa ensinar antes de cobrar

Uma característica editorial do ASES-300 é que cada REQ possui uma explicação curta e didática. Isso é importante porque uma lista de trezentas obrigações sem contexto vira checklist burocrático. A explicação mostra por que o requisito existe, que problema evita e como deve ser interpretado.

Considere \`REQ-244 — Proibição de falso DONE\`. A declaração normativa pode dizer que nenhum requisito deve receber PASS sem evidência correspondente ao critério de aceite. A explicação acrescenta: “o objetivo é impedir que o agente confunda código produzido com funcionalidade comprovada; implementação é uma etapa, não o estado final”. Essa frase muda a forma como o executor compreende a regra.

## 6.7 CORE, CONDITIONAL e DOMAIN

Os requisitos gerais não possuem a mesma aplicabilidade. \`CORE\` representa requisitos estruturais esperados em praticamente todo projeto ASES-300, como rastreabilidade, tratamento de erros e proibição de falso DONE. \`CONDITIONAL\` torna-se obrigatório quando determinada capacidade existe: RAG, filas, importação ou IA, por exemplo. \`DOMAIN\` representa obrigações específicas do produto e começa, por convenção desta versão, em REQ-301.

Essa classificação evita dois problemas. Primeiro, impede que um projeto sem IA seja artificialmente obrigado a implementar embeddings apenas para completar checklist. Segundo, impede que requisitos importantes sejam ignorados sob argumento genérico de que “não se aplicam”. Um CONDITIONAL precisa de condição explícita; se a condição existe, o requisito deixa de ser opcional.

O núcleo de trezentos requisitos é, portanto, uma estrutura reutilizável, não uma lista cega de trezentas funcionalidades. O produto final é \`ASES-300 + X\`, onde X representa requisitos específicos do domínio.

## 6.8 Prioridade não é a mesma coisa que classificação

Classificação responde à natureza de aplicabilidade; prioridade responde à importância para aquele projeto ou release. Um requisito CONDITIONAL de segurança pode ser CRITICAL quando a capacidade existe. Um CORE documental pode ser HIGH. O ASES-300 recomenda CRITICAL, HIGH, MEDIUM e LOW, com critérios definidos no MASTER-SPEC.

CRITICAL significa que falha impede release por risco, integridade ou obrigação essencial. HIGH também precisa estar integralmente resolvido para o release padrão definido pelo método. MEDIUM e LOW podem ser tratados conforme política de versão, desde que isso esteja explícito. Prioridade não deve ser usada para esconder débito: se algo é necessário para segurança, rebaixá-lo para LOW não reduz o risco.

No Definition of Done proposto nesta obra, CRITICAL e HIGH devem atingir 100% para release. Essa política pode ser adaptada por uma organização, mas mudanças precisam ser conscientes e documentadas.

## 6.9 Dependências entre requisitos

Requisitos raramente são independentes. Exportação segura depende de autorização. Auditoria pode depender de identidade do usuário. Recuperação de senha depende de autenticação e comunicação. Registrar dependências permite ao Harness escolher uma ordem de execução sensata e evitar implementar comportamentos sobre fundações inexistentes.

Uma dependência deve significar necessidade real, não mera preferência de ordem. Se REQ-137 “exportação filtrada” precisa da listagem filtrável e da política de exportação, esses IDs podem aparecer em \`depends_on\`. O Harness pode então bloquear ou adiar o requisito enquanto as dependências não estiverem em PASS.

Dependências também ajudam na análise de impacto. Alterar REQ-111 pode afetar requisitos de API, exportação, logs e testes de segurança. A rastreabilidade transforma essa rede em informação operacional.

## 6.10 Critério de aceite: converter intenção em observação

Critério de aceite descreve condições observáveis que demonstram satisfação. Ele não deve repetir o requisito com outras palavras. Se o requisito diz “exportação deve respeitar permissões”, o critério precisa indicar o comportamento: dado usuário sem leitura de \`salario\`, quando exportar conjunto que contém esse campo, o arquivo não contém coluna nem valor correspondente.

Uma estrutura GIVEN/WHEN/THEN é útil para comportamentos. GIVEN define estado inicial; WHEN, ação; THEN, resultado. Para requisitos não comportamentais, outras formas podem ser melhores: limiar de performance, presença de artefato, resultado de scanner ou aprovação de auditoria.

Critérios de aceite são a fronteira entre especificação e verificação. Quanto mais vagos, mais fácil o falso PASS.

## 6.11 Verificação: teste, inspeção, análise, demonstração ou evidência operacional

Nem todo requisito é verificado da mesma forma. Comportamentos de API podem usar testes de integração; jornadas críticas, E2E; regras de tipos, compilador; segurança, testes e scanners; documentação, inspeção; backup, execução de restauração; UX, testes de acessibilidade e revisão. O campo \`verification\` deve indicar o mecanismo adequado.

O ASES-300 rejeita a ideia de que todo requisito precise de teste automatizado, mas exige que todo requisito relevante tenha método de verificação. “Existe documentação atualizada” pode ser verificado por inspeção e checks estruturais. “Restore funciona” exige demonstração real, não apenas existência de arquivo de backup.

Essa pluralidade aproxima o método da engenharia tradicional de verificação: propriedades diferentes exigem instrumentos diferentes.

## 6.12 Evidência: a diferença entre ter verificado e poder provar que verificou

Evidência é o artefato resultante da verificação. Pode ser resultado de teste, log de pipeline, relatório de scanner, screenshot, hash de artefato, arquivo exportado, relatório de restore ou aprovação registrada. O objetivo não é acumular burocracia, mas permitir auditoria e continuidade entre sessões.

Para um agente, evidência é especialmente importante porque impede autoatestação. O agente pode afirmar “todos os testes passaram”; o Harness deve registrar saída real do comando ou resultado estruturado. O agente pode dizer “a tela está responsiva”; um E2E em viewports definidos ou inspeção registrada fornece evidência melhor.

Evidência também permite retomar trabalho. Um novo agente não precisa confiar na memória do anterior; consulta o estado e as provas.

## 6.13 Os seis estados operacionais: PENDING, IN_PROGRESS, PASS, FAIL, BLOCKED e N/A

\`PENDING\` significa que o requisito ainda não foi concluído nem verificado. \`IN_PROGRESS\` indica trabalho ativo. \`PASS\` significa que o critério de aceite foi satisfeito e existe evidência suficiente. \`FAIL\` significa que a verificação foi executada e demonstrou não conformidade. \`BLOCKED\` significa que o requisito é aplicável, mas existe impedimento que impede avanço. \`N/A\` significa que o requisito foi conscientemente avaliado e não se aplica ao produto.

Esses estados evitam a ambiguidade de rótulos como “feito”, “quase pronto” ou “ok”. Um requisito implementado mas ainda não testado não é PASS. Pode estar IN_PROGRESS. Um requisito cujo teste falhou é FAIL, mesmo que “funcione na máquina do desenvolvedor”. Um requisito que depende de credencial externa indisponível pode ser BLOCKED.

O estado é informação operacional, não opinião.

## 6.14 N/A: não se aplica não significa não quero fazer

N/A é um dos estados mais importantes para tornar os trezentos requisitos reutilizáveis. Um sistema sem RAG não precisa implementar chunking, embeddings e reranking. Nesses casos, requisitos correspondentes podem ser N/A. Mas o estado exige justificativa. “Não precisamos” é fraco; “o produto não possui recuperação semântica de conhecimento não estruturado; todas as consultas utilizam dados estruturados e busca determinística” é verificável.

CORE normalmente não deve aceitar N/A, salvo exceção prevista pela governança. CONDITIONAL aceita N/A quando sua condição não existe. DOMAIN depende do próprio escopo. A matriz de requisitos deve registrar justificativa, responsável e data quando relevante.

Isso impede que N/A vire lixeira para requisitos difíceis. Se o produto exporta dados, REQ-114 sobre segurança de exportação não pode ser N/A apenas porque a implementação ainda não existe; ele é PENDING, FAIL ou BLOCKED.

## 6.15 FAIL não é PENDING e BLOCKED não é FAIL

Distinguir estados melhora gestão. PENDING significa ausência de conclusão; FAIL significa evidência negativa; BLOCKED significa impossibilidade atual de prosseguir apesar de aplicabilidade. Se um endpoint ainda não foi implementado, PENDING. Se foi implementado e o teste de autorização demonstra vazamento, FAIL. Se depende de API externa cuja credencial ainda não foi concedida, BLOCKED.

Essa precisão permite métricas honestas. Um dashboard que soma FAIL e PENDING como “não concluído” pode ser útil para progresso, mas precisa preservar diferença operacional: FAIL exige correção; PENDING exige execução; BLOCKED exige remover impedimento.

## 6.16 Do requisito textual à representação processável

Para que o Harness opere requisitos, parte das informações precisa existir em formato estruturado. Markdown é excelente para leitura humana; YAML ou JSON facilita seleção, dependências, estados e relatórios. O ASES-300 recomenda dupla representação coordenada: explicação rica em Markdown e metadados operacionais em arquivo estruturado.

Isso não significa duplicar manualmente tudo. Ferramentas podem gerar uma visão a partir da outra ou validar consistência. O importante é que o agente consiga perguntar “quais HIGH estão PENDING e possuem dependências em PASS?” sem interpretar centenas de páginas de prosa a cada execução.

## 6.17 Exemplo de requisito em Markdown

Um requisito completo pode ser apresentado ao leitor da seguinte maneira:

> \### REQ-111 — Permissão de leitura por coluna  
>   
> \*\*Classificação:\*\* CORE  
> \*\*Prioridade:\*\* CRITICAL  
> \*\*Área:\*\* Autorização  
>   
> \*\*Declaração normativa:\*\* O backend DEVE remover da resposta todos os campos para os quais o usuário não possua permissão de leitura.  
>   
> \*\*Explicação:\*\* esconder uma coluna apenas na interface não protege o dado. A mesma política precisa ser aplicada antes de a informação sair do servidor.  
>   
> \*\*Critério de aceite:\*\* DADO um ANALISTA sem READ para \`salario\`, QUANDO solicitar \`/records\`, ENTÃO \`salario\` não deve constar na resposta.  
>   
> \*\*Verificação:\*\* teste de integração de autorização por campo.  
> \*\*Evidência esperada:\*\* teste \`permissions-column.spec.ts\` aprovado.  
> \*\*N/A:\*\* não permitido em sistemas que exponham campos com níveis distintos de acesso.

## 6.18 O mesmo requisito em YAML

A representação operacional pode ser mais compacta. Ela não substitui a explicação, mas permite ao Harness processar o requisito.

> \- id: REQ-111  
> title: Permissão de leitura por coluna  
> class: CORE  
> priority: CRITICAL  
> area: authorization  
> depends_on: \[REQ-091, REQ-100\]  
> status: PENDING  
> implementation:  
> - src/auth/field-policy.ts  
> tests:  
> - tests/auth/permissions-column.spec.ts  
> acceptance:  
> - campo sem READ não aparece na API  
> - campo sem READ não aparece na exportação  
> evidence: \[\]

## 6.19 Rastreabilidade: requisito não deve viver isolado

Rastreabilidade é a capacidade de relacionar requisitos a suas origens e aos artefatos produzidos durante desenvolvimento. Mucha, Kaufmann e Riehle (2024) tratam a rastreabilidade pré-especificação como ligação entre requisitos e informações que os antecedem. Ahrens, Nagel e Schneider (2024) mostram, em estudo empírico, que práticas de traceability continuam relevantes e complexas no trabalho real. O ASES-300 amplia essa visão em uma cadeia operacional.

A cadeia recomendada é \`PRODUCT/DOMAIN → REQ → arquitetura/decisão → implementação → teste/eval → evidência → release\`. A rastreabilidade pode ser bidirecional: de um requisito descobrimos por que existe e como foi implementado; de um arquivo crítico descobrimos quais requisitos ele satisfaz.

Essa estrutura é valiosa para agentes porque reduz buscas abertas. Ao receber REQ-111, o Harness pode carregar automaticamente arquivos e testes relacionados.

## 6.20 Matriz de rastreabilidade

Uma matriz simples permite visualizar relações e lacunas. Um requisito sem teste quando deveria ter teste aparece imediatamente. Um arquivo de segurança sem requisito associado pode indicar implementação órfã ou rastreabilidade incompleta. Uma origem de PRODUCT sem requisitos derivados pode revelar escopo não coberto.

## 6.21 Requisitos funcionais e requisitos de qualidade

Requisitos funcionais descrevem capacidades e comportamentos; requisitos de qualidade descrevem propriedades como desempenho, segurança, acessibilidade, confiabilidade e manutenibilidade. Na prática, a fronteira pode ser menos rígida do que os livros sugerem: “bloquear após cinco tentativas” é comportamento que concretiza segurança. O ASES-300 prioriza verificabilidade sobre disputa terminológica.

Requisitos de qualidade precisam evitar adjetivos vazios. “O sistema deve ser rápido” não basta. Deve existir contexto, carga e limiar quando mensurável: “sob carga X, o percentil 95 da operação Y deve permanecer abaixo de Z”. Quando não há baseline suficiente, o requisito pode inicialmente exigir instrumentação e posterior calibração, em vez de inventar número.

Frattini et al. (2023) enfatizam a necessidade de tornar qualidade de requisitos operacionalizável. Essa preocupação vale também para a qualidade exigida do produto.

## 6.22 Requisitos negativos: especificar o que nunca deve acontecer

Requisitos negativos são particularmente importantes em segurança e integridade. “Usuário sem permissão NÃO DEVE receber o campo” é mais forte do que apenas dizer o que usuários autorizados podem fazer. “O agente NÃO DEVE remover teste para obter PASS” descreve comportamento proibido do processo.

Testes negativos frequentemente encontram falhas que caminhos felizes escondem. Para autorização, cada permissão importante deveria considerar pelo menos um caso permitido e um negado. Para estados, testar transições inválidas. Para importação, arquivos malformados. Para IA, respostas sem evidência suficiente.

O Harness deve procurar não apenas presença de capacidades, mas ausência de comportamentos proibidos.

## 6.23 Requisitos compostos e o teste do “e”

Uma heurística editorial é observar a palavra “e”. Nem todo “e” indica problema, mas frequentemente une obrigações independentes. “O sistema deve validar o arquivo e registrar erro e enviar notificação e permitir correção” provavelmente merece decomposição. Cada parte pode falhar separadamente.

A decomposição melhora diagnóstico. Em vez de REQ único em FAIL sem saber por quê, quatro requisitos mostram exatamente qual propriedade não foi satisfeita. Por outro lado, fragmentar “nome e sobrenome” em dois requisitos pode ser inútil. Coesão e verificabilidade devem guiar a decisão.

## 6.24 Ambiguidade, vagueza e palavras perigosas

Palavras como “rápido”, “fácil”, “adequado”, “seguro”, “moderno”, “robusto”, “inteligente”, “automaticamente” e “em tempo real” exigem cuidado. Elas podem expressar objetivos legítimos, mas precisam de definição contextual. “Tempo real” pode significar 100 ms em um sistema e 30 segundos em outro.

LLMs podem auxiliar a detectar esse vocabulário. Hemmat et al. (2025) identificam crescente uso de LLMs em elicitação, especificação e qualidade de requisitos. Contudo, a revisão também reforça a necessidade de avaliação das saídas. Um modelo pode reescrever um requisito com aparência mais formal sem resolver a ambiguidade factual subjacente.

O ASES-300 permite que agentes sinalizem ambiguidades e proponham reformulações, mas mudanças normativas precisam preservar intenção validada.

## 6.25 Contradições entre requisitos

Dois requisitos podem ser individualmente claros e coletivamente impossíveis. Um exige retenção indefinida; outro exige exclusão após prazo. Um exige acesso offline completo; outro proíbe persistência local. Detectar conflitos é atividade essencial de Engenharia de Requisitos.

O MASTER-SPEC deve definir precedência documental e o Harness pode executar checks de consistência, mas conflitos semânticos frequentemente exigem decisão humana. O agente deve registrar o conflito como bloqueio, apontar IDs envolvidos e explicar impacto, em vez de escolher silenciosamente um lado.

Métodos formais e LLMs podem se complementar nesse ponto. Trabalhos recentes discutem justamente uma via de mão dupla: LLMs podem auxiliar tarefas formais, enquanto formalização pode aumentar confiabilidade de artefatos gerados por LLMs (2025).

## 6.26 Mudança de requisito e versionamento

Requisitos mudam. O problema não é mudança; é mudança sem rastreabilidade. Uma alteração deve registrar motivo, autor ou decisão, impacto e versão. Se o critério de aceite muda, testes relacionados precisam ser revisados. Se a mudança contradiz ADR ou arquitetura, o impacto deve ser analisado.

Para alterações pequenas de redação sem mudança semântica, o mesmo ID permanece. Para substituição conceitual, pode ser preferível deprecar o requisito e criar outro. A política precisa estar no MASTER-SPEC para evitar decisões inconsistentes.

Agentes não devem editar requisitos para fazer o código passar. Esse é um dos princípios mais importantes do Harness: executor não redefine unilateralmente o contrato que está sendo avaliado.

## 6.27 Requisitos de IA: especificar incerteza e avaliação

Componentes de IA desafiam o padrão clássico de entrada determinística → saída exata. Habiba et al. (2024) mostram que sistemas baseados em IA introduzem desafios específicos para especificação e validação. Em vez de exigir uma frase idêntica, requisitos podem definir conjunto de comportamentos aceitáveis, métricas, datasets de avaliação, limites de erro, proveniência e revisão humana.

Exemplo: “o sistema deve sugerir correspondências entre ementas” é insuficiente. Precisamos dizer qual conjunto de avaliação será usado, que tipos de erro são críticos, como o score é interpretado, quando a sugestão deve ser recusada e se decisão humana é obrigatória. Evals tornam-se parte do critério de aceite.

Isso mostra que verificabilidade não significa determinismo absoluto. Significa possuir um protocolo objetivo de avaliação compatível com a natureza da propriedade.

## 6.28 Requisitos para o próprio Harness

O ASES-300 inclui requisitos que não descrevem diretamente features do usuário, mas a maneira como o desenvolvimento deve ocorrer. REQ-226 a REQ-245, por exemplo, governam leitura da SPEC, seleção de requisito, planejamento, typecheck, lint, testes, correção, evidência e continuidade. Esses requisitos transformam o método em sistema operacional de engenharia.

Essa escolha é intencional: se o agente é parte relevante da produção, o comportamento do processo precisa ser especificado. “O agente deve executar testes relacionados antes de PASS” é tão importante para confiabilidade quanto uma regra funcional. O produto e o processo permanecem distintos, mas ambos possuem propriedades verificáveis.

## 6.29 Como o Harness seleciona o próximo requisito

Com requisitos estruturados, a seleção deixa de ser aleatória. O Harness pode filtrar \`status=PENDING\`, priorizar CRITICAL/HIGH, verificar dependências, agrupar por módulo e respeitar bloqueios. Também pode impedir trabalho em requisito cuja decisão de produto esteja aberta.

Um algoritmo simples pode ordenar por prioridade e dependências; projetos maiores podem usar grafos. O ponto central é que a fila de trabalho deriva da SPEC e do estado real, não apenas da última mensagem enviada ao agente.

Isso melhora continuidade entre sessões e reduz “desenvolvimento por conversa”, no qual a direção do projeto depende do contexto momentâneo do chat.

## 6.30 Do PASS individual ao release

PASS de um requisito não significa que o produto está pronto. O release depende da composição dos estados e de gates globais. A Definition of Done verifica percentuais, testes de regressão, segurança, documentação, backup, ausência de mocks indevidos e outras propriedades sistêmicas.

Um requisito pode ter PASS e posteriormente voltar a FAIL se uma regressão for detectada. Estado não é medalha permanente; representa evidência válida no estado atual do projeto. O Harness deve ser capaz de invalidar ou reexecutar verificações quando mudanças relacionadas ocorrerem.

Essa característica transforma a matriz de requisitos em representação viva da conformidade do projeto.

## 6.31 Exemplo passo a passo: de frase vaga a requisito verificável

Frase inicial: “Analistas só podem mexer no que têm permissão”. Primeiro identificamos conceitos de DOMAIN: ANALISTA, recurso, registro, campo, ação e escopo. Depois separamos leitura de edição. Escolhemos uma obrigação: impedir alteração de campos sem UPDATE.

Formulação normativa: “O backend NÃO DEVE persistir alteração em campo para o qual o usuário autenticado não possua permissão UPDATE no escopo efetivo do registro”. Critério: dado ANALISTA com READ para \`salario\`, mas sem UPDATE, quando enviar PATCH alterando \`salario\`, então o valor persistido permanece inalterado e a resposta segue o contrato de autorização. Teste: integração com banco. Evidência: execução aprovada do teste.

Observe a transformação: a intenção humana continua reconhecível, mas agora existe uma propriedade que o Harness consegue provar ou reprovar.

## 6.32 Exemplo passo a passo: requisito de desempenho

Frase vaga: “a tabela precisa carregar rápido”. Antes de inventar 200 ms, investigamos contexto: volume típico, infraestrutura e percepção aceitável. Suponha que a decisão de produto defina até 10 mil registros por organização, paginação de 50 e meta de p95 inferior a 800 ms no endpoint de listagem sob carga de referência.

O requisito pode então especificar ambiente e carga. A verificação utiliza teste de performance reproduzível. Se ainda não existe baseline, podemos criar primeiro requisito de observabilidade: medir p50/p95/p99 em cenário definido. Depois o limiar é aprovado. ASES-300 prefere uma métrica posteriormente fundamentada a um número arbitrário imediatamente bonito.

## 6.33 Exemplo passo a passo: requisito de IA

Frase vaga: “a IA deve comparar ementas com precisão”. Primeiro separamos tarefa: gerar candidatos semanticamente semelhantes. Depois definimos dataset de avaliação revisado por especialistas, métrica adequada e erro crítico. A IA não decide equivalência. O requisito pode exigir que, em conjunto de referência versionado, o mecanismo alcance limiar acordado de recall para candidatos relevantes e sempre apresente evidências textuais recuperadas.

A verificação é um Eval, não um unit test tradicional. A evidência inclui versão do dataset, modelo/configuração, métricas e casos de falha. Se o modelo mudar, o Eval é reexecutado. Assim, um componente probabilístico entra no mesmo sistema de governança sem fingir determinismo.

## 6.34 Anti-padrão: requisito que descreve implementação sem necessidade

“O sistema deve usar Redis para cache” pode ser uma restrição arquitetural válida, mas não deveria ser requisito funcional se o verdadeiro objetivo é desempenho. Fixar tecnologia cedo demais reduz alternativas. Se Redis é decisão aprovada por arquitetura, registre-a em ARCHITECTURE/ADR e, se necessário, crie requisito de conformidade arquitetural.

O requisito deve expressar tecnologia quando a tecnologia é realmente parte da obrigação: compatibilidade contratual, infraestrutura institucional ou restrição explícita. Caso contrário, descreva a propriedade e deixe arquitetura decidir mecanismo.

## 6.35 Anti-padrão: critério de aceite “funcionar corretamente”

“Funcionar corretamente” não acrescenta informação. O mesmo vale para “sem erros”, “conforme esperado” e “de maneira adequada”. Critérios precisam dizer o que observar. Se não conseguimos escrever observação, talvez o requisito ainda não esteja suficientemente compreendido.

Um bom exercício é entregar o critério a alguém que não escreveu o requisito e perguntar se essa pessoa consegue decidir PASS ou FAIL sem consultar o autor. Se a resposta for não, há dependência de conhecimento tácito.

## 6.36 Anti-padrão: teste escrito para confirmar a implementação, não o requisito

Um agente pode implementar uma função e depois escrever teste que apenas reproduz o comportamento que criou. Isso gera cobertura sem validação. O teste precisa derivar do critério de aceite, preferencialmente definido antes ou independentemente da solução.

Em tarefas críticas, o Harness pode separar papéis: um agente implementa e outro gera ou revisa Evals a partir da SPEC. Mesmo com um único agente, a ordem “ler critério → escrever/identificar verificação → implementar” reduz viés de confirmação.

A regra fundamental é: código não define o que o teste deve aceitar; requisito define.

## 6.37 Anti-padrão: declarar PASS por inspeção superficial

Ver um botão na tela não prova que exportação funciona. Ver middleware não prova que todas as rotas o utilizam. Ver arquivo de backup não prova restore. O tipo de evidência precisa corresponder à propriedade. Inspeção superficial é aceitável apenas quando o requisito realmente é visual ou documental.

O Harness deve preferir evidência executável sempre que custo e natureza do requisito permitirem. Isso não elimina revisão humana; combina formas de verificação.

## 6.38 Template mestre de requisito ASES-300

O template a seguir será usado como referência para os trezentos requisitos explicados individualmente na parte correspondente desta obra.

> \### REQ-XXX — Nome do requisito  
>   
> \*\*Classificação:\*\* CORE \| CONDITIONAL \| DOMAIN  
> \*\*Prioridade sugerida:\*\* CRITICAL \| HIGH \| MEDIUM \| LOW  
> \*\*Área:\*\* ...  
>   
> \*\*Declaração normativa:\*\* O sistema DEVE...  
>   
> \*\*Explicação:\*\* ...  
>   
> \*\*Por que este requisito existe:\*\* ...  
>   
> \*\*Quando se aplica:\*\* ...  
>   
> \*\*Opções de implementação:\*\* ...  
>   
> \*\*Exemplo prático:\*\* ...  
>   
> \*\*Anti-padrão:\*\* ...  
>   
> \*\*Critério de aceite:\*\* ...  
>   
> \*\*Como verificar:\*\* ...  
>   
> \*\*Dependências:\*\* REQ-...  
>   
> \*\*Estados permitidos:\*\* PENDING \| IN_PROGRESS \| PASS \| FAIL \| BLOCKED \| N/A  
>   
> \*\*N/A permitido?\*\* Sim/Não. Justificativa exigida quando aplicável.  
>   
> \*\*Evidência esperada:\*\* ...  
>   
> \*\*Arquivos/testes relacionados:\*\* ...

## 6.39 Tabela oficial de estados do ASES-300

| Estado      | Significado                             | Quando usar                                  | Erro comum                         |
|-------------|-----------------------------------------|----------------------------------------------|------------------------------------|
| PENDING     | Ainda não concluído/verificado          | Trabalho não iniciado ou sem evidência final | Usar N/A para evitar trabalho      |
| IN_PROGRESS | Execução ativa                          | Implementação ou verificação em andamento    | Manter indefinidamente             |
| PASS        | Critério satisfeito com evidência       | Verificação aprovada                         | Marcar após apenas escrever código |
| FAIL        | Verificação demonstrou não conformidade | Teste/eval/inspeção falhou                   | Confundir com PENDING              |
| BLOCKED     | Aplicável, mas impedido                 | Dependência externa/decisão impede avanço    | Usar para esconder falha           |
| N/A         | Conscientemente não aplicável           | Condição do requisito não existe             | Usar como sinônimo de opcional     |

## 6.40 Exemplo de justificativa N/A

> REQ-190 — RAG  
> Status: N/A  
> Justificativa: o produto não possui funcionalidades que dependam de recuperação semântica de conhecimento não estruturado. As consultas são realizadas sobre dados estruturados e regras determinísticas.  
> Aprovado por: responsável técnico/produto  
> Data: 20/09/2026

## 6.41 Matriz de rastreabilidade exemplificada

| REQ     | Origem                     | Implementação            | Verificação                | Evidência         | Estado |
|---------|----------------------------|--------------------------|----------------------------|-------------------|--------|
| REQ-111 | DOMAIN: FieldPermission    | src/auth/field-policy.ts | permissions-column.spec.ts | CI run \#...      | PASS   |
| REQ-114 | Risco: exportação indevida | src/export/policy.ts     | export-security.spec.ts    | CI run \#...      | PASS   |
| REQ-190 | PRODUCT sem RAG            | —                        | Inspeção de arquitetura    | Justificativa N/A | N/A    |
| REQ-239 | HARNESS: correção          | scripts/verify.ts        | Harness eval               | log de retry      | PASS   |

## 6.42 Checklist de qualidade de um requisito

1\. Possui ID único e significado estável?

2\. A declaração normativa contém uma obrigação clara?

3\. Está classificado como CORE, CONDITIONAL ou DOMAIN?

4\. A prioridade é justificada pelo risco/valor?

5\. Possui origem identificável em PRODUCT, DOMAIN, segurança, arquitetura ou governança?

6\. Pode ser verificado sem consultar conhecimento tácito do autor?

7\. O critério de aceite descreve observação e não apenas repete o requisito?

8\. O método de verificação é adequado à propriedade?

9\. Existe evidência esperada?

10\. Dependências estão explícitas?

11\. Palavras vagas foram definidas?

12\. Há múltiplas obrigações que deveriam ser separadas?

13\. Casos negativos foram considerados?

14\. N/A está permitido apenas quando semanticamente legítimo?

15\. O agente conseguiria distinguir PASS de FAIL de forma objetiva?

## 6.43 Exercício orientado

Escolha cinco frases vagas do seu projeto, como “o sistema deve ser seguro”, “a tela deve ser rápida”, “o gestor pode ver sua equipe”, “a IA deve acertar equivalências” e “o usuário pode exportar dados”. Para cada frase, identifique conceitos de DOMAIN, decomponha obrigações, escreva uma declaração normativa, defina ao menos um caso positivo e um negativo, determine critério de aceite, método de verificação e evidência. Em seguida classifique cada requisito e diga se N/A seria permitido. O exercício deve terminar com cinco REQs que poderiam ser entregues a outro desenvolvedor sem explicação oral adicional.

## 6.44 Como os 300 requisitos serão apresentados na Parte III

A partir da taxonomia congelada do ASES-300, cada um dos trezentos requisitos gerais será explicado individualmente utilizando o template deste capítulo. Isso significa que REQ-001 não será apenas “Nome oficial do sistema”: haverá definição, importância, aplicabilidade, exemplos, opções, anti-padrões, aceite, verificação e regra de N/A. O objetivo é transformar a lista em material de ensino e referência operacional.

Os requisitos serão agrupados pelas dezessete áreas já estabelecidas: identidade e objetivos; princípios de desenvolvimento; arquitetura; dados; autenticação e autorização; CRUD; logs; UX/UI; segurança; IA/RAG; testes; observabilidade; Harness; rastreabilidade; memória/ADR; self-audit; e Definition of Done. O significado de cada ID permanecerá estável na versão 1.0.

## 6.45 Conclusão

REQUIREMENTS é o ponto em que intenção se transforma em obrigação verificável. O requisito ASES-300 não termina na frase “o sistema deve”. Ele carrega contexto suficiente para que pessoas e agentes compreendam significado, saibam quando a obrigação se aplica, reconheçam dependências, executem uma verificação e produzam evidência. Essa estrutura combate dois problemas centrais do desenvolvimento agêntico: ambiguidade de entrada e falso sentimento de conclusão.

A literatura recente reforça a importância da qualidade e rastreabilidade de requisitos e mostra crescimento acelerado do uso de LLMs nessa disciplina (FRATTINI et al., 2023; MUCHA; KAUFMANN; RIEHLE, 2024; HEMMAT et al., 2025). Ao mesmo tempo, trabalhos sobre Engenharia de Requisitos formal e IA destacam que a geração linguística precisa ser acompanhada de mecanismos de correção e confiança. No ASES-300, essa ideia torna-se operacional: texto normativo + critério + verificação + evidência + estado.

O próximo capítulo avançará para ARCHITECTURE. Depois de saber o que o sistema deve satisfazer, será necessário definir como suas partes serão organizadas sem transformar decisões arquiteturais em improvisações do agente. Veremos módulos, fronteiras, dependências, padrões, decisões, diagramas, atributos de qualidade e a relação entre ARCHITECTURE.md, ADRs e requisitos.

## 6.46 Referências utilizadas neste capítulo — registro provisório

As referências serão consolidadas no Capítulo 25 — Referências. Permanecem junto ao capítulo durante a elaboração para conferência e rastreabilidade acadêmica.

AHRENS, Maike; NAGEL, Lukas; SCHNEIDER, Kurt. What you see is what you trace: a two-stage interview study on traceability practices and eye tracking potential. **Requirements Engineering**, v. 29, p. 329-355, 2024. Disponível em: https://doi.org/10.1007/s00766-024-00419-0. Acesso em: 20 set. 2026.

FRANCH, Xavier; PALOMARES, Cristina; QUER, Carme; CHATZIPETROU, Panagiota et al. The state-of-practice in requirements specification: an extended interview study at 12 companies. **Requirements Engineering**, v. 28, p. 377-409, 2023. Disponível em: https://doi.org/10.1007/s00766-023-00399-7. Acesso em: 20 set. 2026.

FRATTINI, Julian; MONTGOMERY, Lloyd; FISCHBACH, Jannik; MENDEZ, Daniel; FUCCI, Davide et al. Requirements quality research: a harmonized theory, evaluation, and roadmap. **Requirements Engineering**, v. 28, p. 507-520, 2023. Disponível em: https://doi.org/10.1007/s00766-023-00405-y. Acesso em: 20 set. 2026.

HABIBA, Umm-e-; HAUG, Markus; BOGNER, Justus et al. How mature is requirements engineering for AI-based systems? A systematic mapping study on practices, challenges, and future research directions. **Requirements Engineering**, v. 29, p. 567-600, 2024. Disponível em: https://doi.org/10.1007/s00766-024-00432-3. Acesso em: 20 set. 2026.

HEMMAT, Arshia; SHARBAF, Mohammadreza; KOLAHDouz-RAHIMI, Shekoufeh; LANO, Kevin; TEHRANI, Sobhan Y. Research directions for using LLM in software requirement engineering: a systematic review. **Frontiers in Computer Science**, v. 7, art. 1519437, 2025. Disponível em: https://doi.org/10.3389/fcomp.2025.1519437. Acesso em: 20 set. 2026.

MUCHA, Julia; KAUFMANN, Andreas; RIEHLE, Dirk. A systematic literature review of pre-requirements specification traceability. **Requirements Engineering**, v. 29, p. 119-141, 2024. Disponível em: https://doi.org/10.1007/s00766-023-00412-z. Acesso em: 20 set. 2026.

CHENG, H.; HUSEN, J. H.; LU, Y. et al. Generative AI for Requirements Engineering: A Systematic Literature Review. **Software: Practice and Experience**, v. 56, n. 2, p. 141-170, 2026. Disponível em: https://doi.org/10.1002/spe.70029. Acesso em: 20 set. 2026.

# CAPÍTULO 7 — ARCHITECTURE: TRANSFORMANDO REQUISITOS EM ESTRUTURA TÉCNICA GOVERNÁVEL

## 7.1 Arquitetura não é escolher uma stack

Depois de PRODUCT, DOMAIN e REQUIREMENTS, o ASES-300 chega a uma pergunta diferente: como organizar o sistema para que aquilo que foi especificado possa existir, evoluir e ser verificado? Essa é a função de ARCHITECTURE. Arquitetura de software não se reduz à escolha de React, Node.js, PostgreSQL ou Cloudflare. Essas tecnologias podem fazer parte da solução, mas a arquitetura descreve principalmente responsabilidades, fronteiras, relações, dependências, mecanismos de comunicação, decisões estruturais e consequências sobre atributos de qualidade.

Uma stack informa com quais materiais construiremos. A arquitetura explica como esses materiais serão organizados e por quê. Duas aplicações podem utilizar exatamente as mesmas tecnologias e possuir arquiteturas radicalmente diferentes: uma pode concentrar regras em componentes de interface; outra pode possuir domínio independente; uma pode permitir dependências circulares; outra pode impor fronteiras; uma pode integrar IA diretamente em dezenas de telas; outra pode encapsular providers e políticas em módulos próprios.

Essa diferença torna-se ainda mais importante com agentes de desenvolvimento. Um agente consegue criar código rapidamente, mas, sem fronteiras explícitas, cada tarefa pode introduzir uma pequena decisão arquitetural. Depois de centenas de tarefas, o projeto pode continuar compilando enquanto sua estrutura se torna incoerente. ARCHITECTURE.md existe para impedir que a arquitetura seja uma soma acidental das preferências locais do executor.

## 7.2 Arquitetura como conjunto de decisões difíceis de desfazer

Uma forma prática de compreender arquitetura é observar o custo de mudança. Renomear um botão normalmente é uma decisão local. Alterar o modelo de autenticação, dividir um banco, substituir comunicação síncrona por eventos ou migrar de um monólito para serviços distribuídos possui impacto amplo. Decisões arquiteturais são aquelas que estruturam muitas outras decisões e cujo erro tende a se propagar.

Por isso, o ASES-300 não tenta documentar cada detalhe técnico como arquitetura. O documento deve concentrar aquilo que um novo desenvolvedor ou agente precisa conhecer para não violar a estrutura do sistema: módulos, camadas, responsabilidades, dependências permitidas, integrações, persistência, segurança, observabilidade, implantação e decisões significativas.

A literatura recente sobre formação de arquitetos continua associando arquitetura à organização de componentes, comunicação, responsabilidades e atributos de qualidade, destacando trade-offs entre segurança, desempenho, confiabilidade, interoperabilidade e manutenibilidade (PANTOJA YÉPEZ et al., 2024). Essa visão é particularmente útil para o ASES-300 porque mostra que arquitetura não é desenho decorativo: ela é um mecanismo para satisfazer qualidades concorrentes.

## 7.3 A cadeia PRODUCT → DOMAIN → REQ → ARCHITECTURE

Arquitetura não deveria nascer isoladamente. PRODUCT informa objetivos e restrições. DOMAIN revela conceitos e regras. REQUIREMENTS transforma essas necessidades em obrigações verificáveis. ARCHITECTURE organiza uma solução capaz de cumprir essas obrigações. A cadeia é iterativa, mas sua direção lógica importa.

Se PRODUCT estabelece que a plataforma deve operar com baixo custo e infraestrutura serverless, isso restringe alternativas. Se DOMAIN mostra que permissões dependem de papel, unidade, registro e campo, a arquitetura precisa possuir uma camada de autorização capaz de avaliar essas dimensões. Se um REQ determina que exportações respeitem exatamente as mesmas permissões da API, a arquitetura não deve criar um exportador que consulte o banco ignorando policies.

Uma boa decisão arquitetural possui origem rastreável. Quando alguém pergunta por que existe um módulo de autorização central, a resposta não deveria ser “porque o arquiteto preferiu”; deveria apontar para riscos, regras de domínio e requisitos.

## 7.4 Passo 1 — identificar drivers arquiteturais

Drivers arquiteturais são fatores que influenciam fortemente a estrutura do sistema. Incluem requisitos funcionais estruturalmente relevantes, atributos de qualidade, restrições, riscos e decisões de negócio. Nem todo REQ possui o mesmo peso arquitetural. Alterar texto de ajuda dificilmente muda a arquitetura; exigir operação offline, multi-tenancy ou isolamento de dados pode mudar profundamente.

Para o CRUD hierárquico, drivers incluem autorização granular, auditoria, exportação segura, configurabilidade e baixo custo operacional. Para o sistema de matrizes, incluem versionamento histórico, comparação semântica, explicabilidade, human-in-the-loop e processamento de documentos. Esses drivers devem aparecer no início de ARCHITECTURE.md.

Uma tabela \`Driver \| Origem \| Impacto \| Decisão relacionada\` torna essa relação explícita e reduz arquitetura por preferência.

## 7.5 Passo 2 — definir fronteiras antes de definir arquivos

Arquitetura começa melhor por responsabilidades do que por pastas. Pergunte quais capacidades precisam permanecer coesas e quais precisam ser isoladas. Em um CRUD: Identity, Authorization, Records, Schema Configuration, Import/Export e Audit podem formar módulos conceituais. Depois a estrutura física do repositório materializa essas fronteiras.

Uma fronteira é útil quando reduz propagação de mudança. Se alterar o provider de autenticação exige modificar vinte componentes de negócio, a fronteira está fraca. Se trocar o mecanismo de exportação exige reimplementar autorização, responsabilidades foram misturadas.

No ASES-300, cada módulo importante deve declarar responsabilidade, API interna, dependências permitidas, dependências proibidas, dados que controla e REQs relacionados.

## 7.6 Camadas: separar motivos de mudança

Camadas organizam código segundo responsabilidades diferentes. Uma decomposição comum distingue apresentação, aplicação, domínio e infraestrutura. O ASES-300 não exige essa nomenclatura, mas exige separação consciente. Interface muda por razões de experiência; domínio muda por regras de negócio; infraestrutura muda por tecnologia; aplicação coordena casos de uso.

O benefício aparece quando um agente trabalha localmente. Para implementar uma nova validação de domínio, ele sabe que não deve escondê-la em um componente React. Para trocar armazenamento, sabe que regras não deveriam depender diretamente do SDK do banco. Fronteiras reduzem o espaço de decisão.

Camadas não devem gerar burocracia artificial. Um sistema pequeno não precisa de quinze abstrações para salvar um registro. O princípio é proporcionalidade: separar aquilo que possui razões diferentes para mudar e riscos relevantes de acoplamento.

## 7.7 Dependências permitidas e proibidas

Uma arquitetura governável precisa dizer não apenas o que existe, mas quem pode depender de quem. Uma regra pode estabelecer que \`domain\` não importa \`infrastructure\`; \`ui\` não acessa banco diretamente; integrações externas passam por adapters; policies de autorização são chamadas por todos os casos de uso sensíveis.

Essas regras podem ser verificadas por lint, testes arquiteturais ou análise estática. Isso é superior a depender apenas de documentação. O Harness pode executar uma verificação de dependências e reprovar uma alteração mesmo que testes funcionais passem.

Essa transformação de intenção arquitetural em enforcement é central ao ASES-300: quanto mais importante a regra, menos ela deve depender exclusivamente de memória humana ou obediência do agente.

## 7.8 Monólito, monólito modular e microsserviços

Escolher entre monólito e microsserviços não é questão de modernidade. Um monólito pode ser simples de implantar, testar e observar. Um monólito modular preserva implantação unificada enquanto cria fronteiras internas. Microsserviços oferecem independência operacional e de evolução, mas introduzem rede, consistência distribuída, observabilidade, versionamento de contratos e custos operacionais.

Para muitos projetos iniciais do ASES-300, um monólito modular é uma boa hipótese quando não existem drivers claros para distribuição. Isso não é regra universal. Escala organizacional, isolamento, disponibilidade, tecnologias diferentes ou cadências independentes podem justificar serviços separados.

O agente nunca deve decompor o sistema em microsserviços apenas porque uma tarefa parece grande. Essa é decisão arquitetural e deve possuir ADR.

## 7.9 Serverless e edge architecture

Ambientes como Cloudflare Workers introduzem propriedades específicas: execução distribuída, limites de CPU e memória, bindings para armazenamento, latência próxima ao usuário e modelos próprios de consistência. Se a implantação é restrição de produto, a arquitetura deve incorporá-la conscientemente.

Serverless pode reduzir operação de servidores, mas não elimina arquitetura. É necessário definir responsabilidades entre frontend, Worker/API, D1, KV, R2, filas e serviços externos. Cada armazenamento possui características diferentes; utilizar KV como banco transacional apenas porque está disponível pode violar requisitos.

O ASES-300 recomenda documentar a razão de cada serviço e a propriedade que ele satisfaz, evitando arquitetura por catálogo de produtos.

## 7.10 Arquitetura orientada a atributos de qualidade

Arquitetura é um exercício de trade-offs. Segurança pode adicionar latência; cache melhora desempenho, mas cria invalidação; consistência forte pode reduzir disponibilidade; abstração melhora substituição, mas aumenta complexidade. Não existe arquitetura ótima sem contexto.

Por isso, atributos de qualidade devem ser formulados como cenários. Em vez de “o sistema deve ser escalável”, registre estímulo, ambiente e resposta esperada. Por exemplo: “com 10.000 registros filtráveis por organização, uma consulta paginada típica deve responder dentro do limite definido em REQ-X”. Isso permite relacionar arquitetura e teste.

A revisão de Pantoja Yépez et al. (2024) destaca a relevância de atributos de qualidade e seus trade-offs na formação e prática arquitetural. No ASES-300, essa relação é operacionalizada por REQs mensuráveis e Evals.

## 7.11 Segurança como propriedade arquitetural

Segurança não deve ser adicionada no fim. A arquitetura precisa decidir onde identidade é validada, onde autorização ocorre, como secrets são acessados, quais fronteiras são confiáveis, como uploads são isolados e como logs evitam dados sensíveis.

No CRUD, esconder uma coluna na UI não é arquitetura de segurança. O backend deve aplicar field-level authorization antes de serializar resposta e exportação deve reutilizar a mesma política. Essa decisão arquitetural reduz caminhos alternativos.

Threat modeling pode alimentar ARCHITECTURE e SECURITY. O objetivo não é colocar todo controle no diagrama, mas mostrar trust boundaries e pontos críticos.

## 7.12 Arquitetura de dados e ownership

Mesmo antes do capítulo DATABASE, arquitetura precisa definir quem é responsável por quais dados. Se múltiplos módulos escrevem diretamente nas mesmas tabelas sem contrato, fronteiras lógicas tornam-se frágeis. Ownership não significa necessariamente bancos separados; significa autoridade clara sobre invariantes e mutações.

Audit pode consumir eventos de outros módulos, mas não deveria alterar registros operacionais. Authorization pode consultar atributos organizacionais, mas talvez não deva controlar o cadastro de unidades. Essas decisões reduzem acoplamento.

Quando serviços são distribuídos, ownership torna-se ainda mais crítico, pois compartilhamento de banco pode neutralizar a independência pretendida.

## 7.13 Arquitetura de APIs e contratos

APIs são fronteiras executáveis. A arquitetura deve definir estilo predominante, versionamento, autenticação, tratamento de erros, idempotência e responsabilidade. Detalhes endpoint a endpoint ficam em API-INTEGRATIONS, mas princípios pertencem à arquitetura.

Um contrato estável permite que frontend, integrações e agentes trabalhem sem depender da implementação interna. Se cada endpoint retorna erros de forma diferente, o sistema transfere complexidade para consumidores.

No ASES-300, mudanças incompatíveis de contrato precisam ser tratadas como decisões rastreáveis, não como efeitos colaterais de refatoração.

## 7.14 Arquitetura orientada a eventos e filas

Eventos e filas são úteis quando tarefas podem ser assíncronas, demoradas ou desacopladas. Importar milhares de linhas, gerar relatório grande ou processar documentos pode ser melhor como job. Entretanto, introduzir filas onde uma chamada simples basta aumenta complexidade.

Uma decisão assíncrona precisa documentar entrega, retry, idempotência, dead-letter, ordenação e observabilidade. O agente não deve adicionar uma fila apenas para “melhorar escalabilidade” sem driver mensurável.

DOMAIN já identificou eventos conceituais; ARCHITECTURE decide quais precisam virar mecanismos técnicos de mensageria.

## 7.15 Arquitetura de sistemas com LLM

Sistemas integrados a LLMs possuem preocupações adicionais: providers, prompts, ferramentas, memória, recuperação, avaliação, custos, privacidade e fallback. Zhang et al. (2024) propõem uma arquitetura em camadas para organizar capacidades de sistemas baseados em LLMs e discutir trade-offs de implementação. Bucaioni et al. (2025) também propõem uma arquitetura funcional de referência para sistemas integrados a LLMs, destacando preocupações como modularidade, segurança, privacidade e interoperabilidade.

No ASES-300, o princípio fundamental é encapsular componentes probabilísticos. Uma camada de AI Orchestration pode selecionar provider, construir contexto, executar ferramentas e registrar telemetria. O domínio recebe resultados tipados, não texto arbitrário espalhado pela aplicação.

Isso permite trocar modelo, aplicar fallback e avaliar comportamento sem reescrever o produto inteiro.

## 7.16 Provider abstraction e anti-lock-in

Se o sistema depende diretamente de APIs específicas em dezenas de módulos, trocar modelo ou fornecedor torna-se caro. Uma abstração de provider pode expor capacidades necessárias — geração estruturada, embeddings, tool calling — sem esconder diferenças importantes.

Abstração excessiva também é problema. Providers possuem recursos e limites diferentes; fingir que todos são idênticos cria menor denominador comum. A arquitetura deve abstrair aquilo que é estável e permitir configuração explícita daquilo que varia.

O objetivo é portabilidade pragmática, não independência absoluta.

## 7.17 RAG como subsistema arquitetural, não como caixa mágica

Quando RAG é aplicável, a arquitetura deve separar ingestão, chunking, indexação, retrieval, reranking, montagem de contexto e geração. Cada etapa possui dados, métricas e falhas próprias. Tratar tudo como \`askAI()\` impede diagnóstico.

Proveniência precisa atravessar o pipeline. Se uma resposta cita um documento, o sistema deve saber qual versão e trecho foram recuperados. Atualização de corpus precisa invalidar ou reindexar dados conforme política.

REQ-190 é CONDITIONAL: se o produto não precisa de recuperação de conhecimento não estruturado, RAG pode ser N/A. A arquitetura não deve introduzi-lo por moda.

## 7.18 C4: arquitetura como mapas em níveis de zoom

O modelo C4 é útil ao ASES-300 porque organiza visualização em níveis consistentes. O site oficial define quatro abstrações centrais: software system, container, component e code; pessoas interagem com os sistemas. Os diagramas principais acompanham esses níveis, permitindo começar pelo contexto e aproximar-se progressivamente da implementação. citeturn0search0turn0search9

O System Context mostra usuários e sistemas externos. O Container mostra aplicações e data stores executáveis. O Component detalha partes internas relevantes. O nível Code é opcional e deve ser usado onde realmente acrescenta valor. O ganho não está nas caixas, mas em evitar misturar níveis de abstração em um único desenho. citeturn0search6

No ASES-300, diagramas C4 podem ser mantidos como código e versionados junto ao projeto. O site oficial também discute tooling e a distinção entre diagramar e modelar, destacando vantagens de modelos estruturados que podem ser consultados e transformados. citeturn0search5

## 7.19 System Context: desenhar a fronteira do produto

O primeiro diagrama deve responder: qual sistema estamos construindo, quem o utiliza e com quais sistemas externos ele se relaciona? Ele não mostra React components nem tabelas. Essa visão ajuda a impedir que dependências externas permaneçam invisíveis.

No sistema de matrizes, atores podem incluir estudante, atendente e coordenação; sistemas externos podem incluir autenticação institucional e repositório documental. No CRUD, pode existir IdP, serviço de e-mail e armazenamento externo.

Cada relação deve possuir verbo: “autentica via”, “consulta”, “envia”, “armazena”. Linhas sem significado são pouco úteis.

## 7.20 Container Diagram: unidades executáveis e armazenamentos

No vocabulário C4, container não significa especificamente Docker; representa aplicação ou data store executável/deployável. Uma SPA, API, worker, banco e object storage podem aparecer nesse nível. Essa distinção evita confusão frequente. citeturn0search0

Para uma arquitetura Cloudflare, um Container Diagram pode mostrar Web App, API Worker, D1, R2, KV e Queue, com responsabilidades e tecnologias. O objetivo é permitir que alguém compreenda onde o comportamento ocorre.

Se o diagrama possui cinquenta caixas, provavelmente está misturando níveis.

## 7.21 Component Diagram: responsabilidades internas relevantes

O Component Diagram aproxima-se de um container específico. Na API, pode mostrar módulos de Identity, Authorization, Records, Export e Audit. Não é necessário diagramar cada classe.

Para agentes, essa visão é valiosa porque associa arquivos a responsabilidades. Uma tarefa de exportação deve tocar Export e Authorization; se começa a modificar Identity sem motivo, isso pode sinalizar desvio.

Componentes importantes podem apontar para diretórios e REQs, transformando o diagrama em mapa operacional.

## 7.22 Diagramas dinâmicos e de implantação

Estrutura estática não explica tudo. Um fluxo de login, importação ou decisão de IA pode ser representado por diagrama dinâmico. Implantação mostra onde containers executam e como ambientes diferem.

O ASES-300 recomenda diagramas adicionais apenas quando respondem perguntas relevantes. Documentação arquitetural deve reduzir incerteza, não maximizar quantidade de desenhos.

Diagramas como código facilitam revisão, diff e atualização pelo Harness.

## 7.23 Architecture Decision Records — ADR

ARCHITECTURE descreve o estado arquitetural; ADR registra decisões significativas e sua razão. Um ADR típico contém contexto, alternativas, decisão, consequências e status. Isso preserva o “por quê” que o código sozinho raramente revela.

Exemplo: \`ADR-004 — adotar monólito modular\`. Contexto: equipe pequena, domínio ainda evoluindo, necessidade de deploy simples. Alternativas: microsserviços e monólito sem módulos. Decisão: monólito modular. Consequências: fronteiras internas obrigatórias, deploy único e possibilidade de extração futura.

Quando um agente encontra ADR ativo, não deve contradizê-lo silenciosamente. Se a decisão tornou-se inadequada, deve propor novo ADR que substitua o anterior.

## 7.24 Arquitetura não é imutável

Governança não significa congelamento. Requisitos mudam, volume cresce, tecnologia evolui e premissas se revelam falsas. Arquitetura precisa evoluir de forma consciente.

O ASES-300 diferencia mudança local de mudança arquitetural. Refatorar função interna pode ocorrer dentro de autonomia normal. Alterar banco principal, mecanismo de autorização ou fronteira de módulo exige análise e ADR.

Essa regra permite evolução sem transformar cada tarefa em reunião arquitetural.

## 7.25 Architecture fitness functions

Uma ideia poderosa é transformar propriedades arquiteturais em verificações automatizadas. Uma fitness function pode impedir dependência proibida, exigir cobertura de contratos, verificar tamanho de bundle, detectar endpoint sem policy ou testar latência.

No ASES-300, fitness functions entram no Harness. Se a arquitetura diz que UI não acessa infraestrutura diretamente, uma regra de lint pode provar isso. Se módulos não podem formar ciclos, análise de dependências pode bloquear build.

Assim, arquitetura deixa de ser apenas documentação e passa a participar da Definition of Done.

## 7.26 Como impedir que o agente redesenhe a arquitetura por conveniência

Agentes frequentemente escolhem o caminho de menor resistência local. Se uma função privada impede acesso, podem torná-la pública; se um teste arquitetural falha, podem mover código; se uma dependência não existe, podem instalar outra. Essas decisões podem resolver a tarefa e degradar o sistema.

O Harness deve impor regras: ler ARCHITECTURE antes de tarefas estruturais; não adicionar dependência sem justificativa; não criar nova camada ou serviço sem driver; não mover ownership de dados sem ADR; não contornar policy; não alterar contratos públicos silenciosamente; executar fitness functions.

Quando a solução correta exige mudança arquitetural, o agente registra proposta e bloqueio para decisão humana, em vez de adaptar a arquitetura secretamente ao código.

## 7.27 Arquitetura e seleção de dependências

Bibliotecas também são decisões. Bjarnason, Åberg e bin Ali (2023) observam que seleção de software em grande escala pode ser ad hoc e propõem critérios sistemáticos de avaliação. Para o ASES-300, uma dependência deve ser escolhida por capacidade, manutenção, segurança, compatibilidade, licença, tamanho, comunidade e custo de substituição, conforme relevância.

Instalar pacote para uma função de dez linhas pode ser desnecessário; reimplementar criptografia é imprudente. A arquitetura deve estabelecer critérios e o agente deve justificá-los.

Dependências críticas podem receber ADR próprio.

## 7.28 Arquitetura e observabilidade

Observabilidade precisa ser arquitetada. Request IDs, logs estruturados, métricas e tracing exigem propagação entre camadas. Em IA, é útil correlacionar requisição, retrieval, provider, ferramentas, custo e resultado.

Se observabilidade for adicionada depois, caminhos importantes podem não possuir contexto suficiente. ARCHITECTURE define padrões; OBSERVABILITY detalha implementação.

Para o Harness, observabilidade também produz evidência sobre comportamento real.

## 7.29 Arquitetura e testabilidade

Arquitetura difícil de testar é difícil de verificar. Dependências globais, estado oculto e acoplamento direto a serviços externos tornam testes lentos e frágeis. Fronteiras claras permitem substituir adapters e testar regras isoladamente.

Isso não significa criar mocks indiscriminadamente. Contratos e testes de integração continuam necessários. A arquitetura deve permitir uma pirâmide ou estratégia de testes adequada ao risco.

Testabilidade é atributo de qualidade e também requisito para desenvolvimento agêntico confiável, porque o agente depende de feedback rápido.

## 7.30 Arquitetura e deployabilidade

Um sistema precisa ser implantável de forma previsível. Arquitetura deve considerar configuração por ambiente, migrations, compatibilidade entre versões, rollback e feature flags quando necessárias.

Uma alteração que exige deploy simultâneo de cinco serviços aumenta risco. Contratos compatíveis e migrações expand/contract podem reduzir acoplamento operacional.

DEPLOYMENT detalhará pipeline, mas ARCHITECTURE deve reconhecer essas restrições.

## 7.31 LLMs como assistentes de arquitetura: potencial e limite

Schmid et al. (2025), em revisão sistemática sobre LLMs e arquitetura de software, identificam aplicações em classificação de decisões, detecção de padrões e geração de design arquitetural, mas também lacunas em avaliação e conformidade. Isso sugere que LLMs podem auxiliar arquitetos, mas não eliminam a necessidade de validação estrutural.

Um agente pode gerar três alternativas e analisar trade-offs; pode detectar possível dependência circular; pode atualizar diagramas. Entretanto, a decisão arquitetural deve ser fundamentada em drivers e evidências.

No ASES-300, LLM é participante do processo arquitetural, não autoridade final sobre a arquitetura.

## 7.32 Anti-padrão: arquitetura astronauta

Arquitetura astronauta ocorre quando a solução é desenhada para uma escala ou complexidade imaginária. Event bus, service mesh, dezenas de microsserviços e abstrações genéricas podem parecer sofisticados, mas aumentam superfície de falha.

O antídoto é driver explícito. Cada complexidade estrutural deve responder a um requisito, risco ou necessidade demonstrável.

ASES-300 prefere a arquitetura mais simples que satisfaça os requisitos conhecidos e preserve evolução razoável.

## 7.33 Anti-padrão: arquitetura emergente sem governança

O extremo oposto é não decidir nada: cada feature escolhe seu padrão, cada agente cria pasta diferente e cada endpoint trata erros de modo próprio. A arquitetura “emerge”, mas sem coerência.

Emergência saudável existe dentro de limites. O documento define princípios e fronteiras; detalhes locais podem evoluir.

Governança arquitetural não é prescrever cada linha, mas limitar entropia.

## 7.34 Anti-padrão: diagrama que não corresponde ao código

Documentação desatualizada é pior do que ausência quando induz decisões erradas. Diagramas precisam ter dono, revisão e, quando possível, geração ou validação automatizada.

Documentation as Code permite manter modelos no repositório e revisar mudanças junto ao código. O ecossistema C4 possui ferramentas voltadas a esse estilo. citeturn0search5turn0search7

No ASES-300, alteração estrutural relevante deve incluir atualização arquitetural como parte do DONE.

## 7.35 Template comentado de ARCHITECTURE.md

O template abaixo procura equilibrar profundidade e operacionalidade. Ele deve ser adaptado ao tamanho do sistema, mas os itens essenciais — drivers, fronteiras, dependências, decisões e verificações — não devem desaparecer.

> \# ARCHITECTURE.md  
>   
> \## 1. Visão arquitetural  
> Resumo da solução e dos princípios estruturais.  
>   
> \## 2. Drivers arquiteturais  
> Driver \| Origem (PRODUCT/REQ/Risco) \| Impacto  
>   
> \## 3. Restrições  
> Tecnologia, custo, plataforma, compliance e legado.  
>   
> \## 4. Princípios  
> Ex.: backend authoritative; deny-by-default; modularidade.  
>   
> \## 5. System Context  
> Atores, sistema e dependências externas.  
>   
> \## 6. Containers  
> Aplicações, APIs, workers, bancos, stores e filas.  
>   
> \## 7. Componentes principais  
> Componente \| Responsabilidade \| Ownership \| REQs  
>   
> \## 8. Camadas e dependências  
> Permitidas:  
> Proibidas:  
>   
> \## 9. Dados e ownership  
> Módulo \| Dados controlados \| Forma de acesso  
>   
> \## 10. APIs e integração  
> Padrões, contratos, versionamento, idempotência.  
>   
> \## 11. Segurança arquitetural  
> Trust boundaries, identidade, autorização, secrets.  
>   
> \## 12. IA  
> Providers, orchestration, RAG, tools, fallback, Evals.  
>   
> \## 13. Observabilidade  
> Logs, métricas, tracing, correlação.  
>   
> \## 14. Atributos de qualidade  
> Cenário \| Métrica \| REQ relacionado  
>   
> \## 15. Deployment  
> Ambientes, unidades de deploy e dependências.  
>   
> \## 16. Fitness functions  
> Regra arquitetural \| Verificação automatizada  
>   
> \## 17. ADRs relacionados  
> ADR \| Decisão \| Status  
>   
> \## 18. Riscos e dívida arquitetural  
> Item \| Impacto \| Mitigação \| Prazo  
>   
> \## 19. Regras para agentes  
> O que um agente pode e não pode alterar autonomamente.  
>   
> \## 20. Diagramas  
> C4 Context, Container, Component e vistas adicionais.

## 7.36 Exemplo de C4 simplificado do CRUD hierárquico

> flowchart LR  
> User\[Usuário\] --\> Web\[Web Application\]  
> Admin\[Administrador\] --\> Web  
> Web --\> API\[API / Worker\]  
> API --\> Auth\[Identity Provider\]  
> API --\> DB\[(D1 / SQL Database)\]  
> API --\> Obj\[(Object Storage)\]  
> API --\> Queue\[Queue\]  
> API --\> AI\[AI Provider - opcional\]  
>   
> subgraph API Components  
> Identity\[Identity\]  
> Authorization\[Authorization\]  
> Records\[Records\]  
> Export\[Import / Export\]  
> Audit\[Audit\]  
> end

O diagrama é deliberadamente simplificado. Em um documento real, System Context e Container deveriam ser separados em vistas próprias. O exemplo serve para demonstrar como uma visão textual versionável pode acompanhar a documentação. O ponto mais importante é que cada elemento possua responsabilidade e que relações sejam explicadas.

## 7.37 Matriz de dependências permitidas

| Origem         | Pode depender de              | Não deve depender de  | Motivo                                     | Enforcement        |
|----------------|-------------------------------|-----------------------|--------------------------------------------|--------------------|
| UI             | Application, shared contracts | Database SDK          | Evitar acesso direto a persistência        | Lint/import rules  |
| Application    | Domain, ports                 | UI                    | Casos de uso independentes da apresentação | Architecture test  |
| Domain         | Domain types                  | Framework/DB/provider | Preservar regras do negócio                | Dependency check   |
| Infrastructure | Domain ports, SDKs            | UI components         | Implementar adapters                       | Code review + lint |
| Export         | Authorization, Records        | DB bypassando policy  | Exportação não amplia acesso               | Integration test   |

## 7.38 Exemplo de ADR

> \# ADR-004 — Adotar monólito modular  
>   
> Status: ACEITO  
>   
> \## Contexto  
> A equipe é pequena, o domínio ainda evolui e não existem requisitos  
> que exijam deploy independente por capacidade.  
>   
> \## Alternativas  
> 1. Monólito sem fronteiras explícitas.  
> 2. Monólito modular.  
> 3. Microsserviços.  
>   
> \## Decisão  
> Adotar monólito modular com módulos de Identity, Authorization,  
> Records, ImportExport e Audit.  
>   
> \## Consequências  
> + Deploy e desenvolvimento simplificados.  
> + Fronteiras internas verificáveis.  
> - Escala independente exige extração futura.  
> - Disciplina de dependências torna-se obrigatória.  
>   
> \## Requisitos relacionados  
> REQ-056, REQ-052, REQ-244 e DOMAIN-REQs correspondentes.

## 7.39 Checklist de revisão arquitetural

1\. Os drivers arquiteturais apontam para PRODUCT, REQs, riscos ou restrições?

2\. As fronteiras de módulos estão claras?

3\. Cada módulo possui responsabilidade e ownership?

4\. Dependências permitidas e proibidas estão documentadas?

5\. Há acoplamento desnecessário a framework, banco ou provider?

6\. A autorização é aplicada em fronteira confiável?

7\. Exportação, importação e jobs reutilizam políticas corretas?

8\. Dados possuem ownership identificável?

9\. Atributos de qualidade possuem cenários mensuráveis?

10\. Componentes de IA estão encapsulados e observáveis?

11\. Existe fallback quando uma integração crítica falha?

12\. Diagramas representam o estado atual?

13\. Decisões significativas possuem ADR?

14\. Regras arquiteturais críticas podem ser automatizadas?

15\. O agente sabe quais mudanças exigem aprovação humana?

16\. A arquitetura é mais complexa do que os drivers justificam?

17\. Há dívida arquitetural conhecida sem registro?

18\. Testabilidade e deployabilidade foram consideradas?

19\. Há caminhos que contornam domínio ou autorização?

20\. O release gate verifica conformidade arquitetural?

## 7.40 Exercício orientado

Retorne ao produto utilizado nos exercícios anteriores. Liste cinco drivers arquiteturais e identifique a origem de cada um. Em seguida, desenhe um System Context e um Container Diagram, ainda que em Mermaid. Defina de quatro a oito módulos e escreva uma frase de responsabilidade para cada um. Crie uma matriz de dependências permitidas e proibidas. Escolha uma decisão significativa — banco, modelo de deploy, autorização ou integração de IA — e escreva um ADR com pelo menos três alternativas. Finalmente, proponha duas fitness functions capazes de transformar regras arquiteturais em verificações automáticas. O exercício termina quando outra pessoa consegue explicar a estrutura do sistema sem abrir o código.

## 7.41 Conclusão

ARCHITECTURE é o ponto no qual requisitos deixam de ser apenas obrigações e passam a influenciar uma estrutura técnica. Seu objetivo não é prever cada classe, mas estabelecer mapas, fronteiras, responsabilidades, dependências, decisões e propriedades que permitam evolução coerente. Uma arquitetura bem documentada reduz o número de escolhas que cada implementação precisa refazer.

Para desenvolvimento orientado a agentes, a arquitetura possui função adicional: limitar autonomia local para preservar coerência global. Um agente pode escolher como implementar uma função dentro de uma fronteira; não deve redefinir a fronteira silenciosamente. ADRs, regras de dependência, diagrams-as-code e fitness functions transformam arquitetura de documentação passiva em parte do Harness.

O Capítulo 8 será dedicado a DATABASE. Partiremos do domínio e da arquitetura para modelar persistência: entidades físicas, chaves, relacionamentos, constraints, índices, temporalidade, versionamento, soft delete, auditoria, concorrência, migrations, transações, backup, restore, seed, importação, retenção e, sobretudo, como impedir que agentes alterem schemas de maneira destrutiva ou incompatível.

## 7.42 Referências utilizadas neste capítulo — registro provisório

As referências serão consolidadas no Capítulo 25 — Referências. Mantêm-se aqui provisoriamente para rastreabilidade acadêmica. Foram priorizados trabalhos recentes e materiais técnicos primários ou de acesso aberto.

BJARNASON, Elizabeth; ÅBERG, Patrik; BIN ALI, Nauman. Software selection in large-scale software engineering: A model and criteria based on interactive rapid reviews. **Empirical Software Engineering**, v. 28, art. 51, 2023. Disponível em: https://doi.org/10.1007/s10664-023-10288-w. Acesso em: 20 set. 2026.

BUCAIONI, Alessio; WEYSSOW, Martin; HE, Junda; LYU, Yunbo; LO, David. A Functional Software Reference Architecture for LLM-Integrated Systems. arXiv, 2025. Disponível em: https://arxiv.org/abs/2501.12904. Acesso em: 20 set. 2026.

PANTOJA YÉPEZ, Wilson Libardo; HURTADO ALEGRÍA, Julio Ariel; BANDI, Ajay; KIWELEKAR, Arvind W. et al. Training software architects suiting software industry needs: A literature review. **Education and Information Technologies**, v. 29, p. 10931-10994, 2024. Disponível em: https://doi.org/10.1007/s10639-023-12149-x. Acesso em: 20 set. 2026.

SCHMID, Larissa; HEY, Tobias; ARMBRUSTER, Martin; CORALLO, Sophie; FUCHß, Dominik; KEIM, Jan; LIU, Haoyu; KOZIOLEK, Anne. Software Architecture Meets LLMs: A Systematic Literature Review. arXiv, 2025. Disponível em: https://arxiv.org/abs/2505.16697. Acesso em: 20 set. 2026.

ZHANG, Dawen; XU, Xiwei; WANG, Chen; XING, Zhenchang; MAO, Robert. A Layered Architecture for Developing and Enhancing Capabilities in Large Language Model-based Software Systems. arXiv, 2024. Disponível em: https://arxiv.org/abs/2411.12357. Acesso em: 20 set. 2026.

BROWN, Simon. **The C4 model for visualising software architecture**. Disponível em: https://c4model.com/. Acesso em: 20 set. 2026.

# CAPÍTULO 8 — DATABASE: DA VERDADE DO DOMÍNIO À PERSISTÊNCIA SEGURA, EVOLUTIVA E VERIFICÁVEL

## 8.1 O banco de dados não é um depósito de objetos

No ASES-300, DATABASE começa depois de PRODUCT, DOMAIN, REQUIREMENTS e ARCHITECTURE por uma razão: persistência deve representar decisões já compreendidas, e não definir silenciosamente o negócio. O banco é uma das materializações da verdade operacional do sistema. Quando sua estrutura contradiz invariantes do domínio, o software passa a depender de convenções frágeis na aplicação.

Esse ponto ganha importância em desenvolvimento orientado a agentes. Um agente pode criar uma coluna, remover uma constraint ou alterar uma migration em segundos. A velocidade técnica, entretanto, não reduz o custo de uma alteração destrutiva em produção. DATABASE.md precisa funcionar simultaneamente como especificação de persistência, mapa de riscos e limite de autonomia.

## 8.2 DOMAIN não é DATABASE

DOMAIN descreve conceitos, identidades, estados, invariantes e relações. DATABASE decide como esses conceitos serão persistidos: tabelas, documentos, chaves, índices, constraints e estratégias de versionamento. Uma entidade de domínio pode ocupar várias tabelas; uma tabela pode armazenar estruturas técnicas que não pertencem ao domínio.

A separação evita o erro de projetar a realidade segundo a conveniência do ORM. Se uma matriz curricular possui versões historicamente relevantes, a persistência deve preservar essa temporalidade. Substituir sempre a mesma linha porque o ORM torna update simples seria uma decisão técnica destruindo significado de domínio.

## 8.3 Do modelo conceitual ao lógico e ao físico

O caminho recomendado possui três níveis. O modelo conceitual pergunta quais conceitos e relações existem. O modelo lógico organiza entidades, atributos, cardinalidades e regras sem depender excessivamente de um SGBD. O modelo físico decide tipos concretos, índices, particionamento, constraints e características específicas da tecnologia.

Essa progressão é particularmente útil para agentes porque impede saltos. Antes de gerar SQL, o agente deve saber qual regra está representando. Antes de criar índice, deve saber qual workload ou requisito o justifica. Antes de desnormalizar, deve registrar qual problema mensurável pretende resolver.

## 8.4 Passo 1 — identificar entidades persistentes e dados derivados

Nem tudo precisa ser armazenado. Alguns valores são fonte de verdade; outros podem ser calculados. Persistir dados derivados sem estratégia de invalidação cria divergência. Um percentual de aderência curricular, por exemplo, pode depender de algoritmo, versão do modelo e dados de entrada. Se for persistido, sua proveniência precisa acompanhar o valor.

Para cada campo relevante, DATABASE deve responder: é fonte de verdade, cache, snapshot, dado derivado ou evidência histórica? Essa classificação orienta atualização, retenção e auditoria.

## 8.5 Chaves primárias e identidade

Chave primária identifica uma representação persistida; identidade de domínio explica o que torna um objeto o mesmo. UUID, ULID e inteiros são opções técnicas. Matrícula acadêmica, código institucional ou combinação de atributos podem ser identificadores de negócio.

O ASES-300 recomenda não depender cegamente de identificadores naturais mutáveis. Quando existe identificador técnico, constraints de unicidade ainda devem proteger identificadores de negócio que precisam ser únicos.

## 8.6 Foreign keys e integridade referencial

Relacionamentos importantes não deveriam existir apenas na expectativa de que a aplicação se comporte corretamente. Quando o banco suporta integridade referencial e o domínio exige a relação, foreign keys oferecem uma segunda linha de defesa.

A ausência deliberada de FK pode ser válida em arquiteturas distribuídas ou certos workloads, mas precisa ser decisão. O agente não deve remover constraint apenas para fazer uma migration passar; deve investigar o dado inválido e a regra que a constraint representa.

## 8.7 Constraints: transformar invariantes em proteção executável

Constraints são uma forma poderosa de aproximar DOMAIN e DATABASE. NOT NULL, UNIQUE, CHECK e FOREIGN KEY conseguem impedir estados inválidos mesmo quando um caminho de código falha. Nem toda invariante cabe no banco, mas aquelas que cabem merecem consideração.

Uma porcentagem restrita a 0–100 pode receber CHECK. Um e-mail único por tenant pode receber índice único composto. Uma versão publicada pode exigir validação de aplicação mais rica. A decisão deve equilibrar expressividade, portabilidade e segurança.

## 8.8 NULL não significa tudo ao mesmo tempo

NULL pode significar desconhecido, ainda não informado, não aplicável ou removido, mas misturar esses significados prejudica consultas e regras. DOMAIN deve ajudar a distinguir ausência semântica de ausência técnica.

Quando estados diferentes importam, um campo de status ou estrutura explícita pode ser superior a sobrecarregar NULL. O agente deve evitar tornar coluna opcional apenas para contornar erro de criação.

## 8.9 Normalização e redundância consciente

Normalização reduz redundância e anomalias, mas não é dogma. Desnormalização pode ser adequada para leitura intensiva, snapshots ou analytics. A regra do ASES-300 é que redundância seja intencional e possua mecanismo de consistência.

Uma coluna duplicada para acelerar consulta deve registrar fonte, atualização e comportamento em caso de divergência. Sem isso, otimização local cria dívida de dados.

## 8.10 Índices: acelerar consultas sem indexar por superstição

Índices melhoram determinados padrões de leitura, mas consomem armazenamento e tornam escritas mais caras. A escolha deve partir de consultas reais, cardinalidade, filtros, joins e ordenações. Estudos recentes sobre tarefas SQL mostram que mudanças relacionadas a SQL tendem a envolver maior esforço e alterações mais espalhadas, reforçando a necessidade de tratar persistência como engenharia e não detalhe secundário.

O Harness pode verificar planos de consulta para caminhos críticos e impedir regressões de performance quando existirem critérios mensuráveis.

## 8.11 Paginação e consultas limitadas

Listagens sem limite são uma falha de arquitetura de dados esperando crescimento. DATABASE deve definir estratégias de paginação adequadas ao produto. OFFSET é simples, mas pode degradar em grandes conjuntos e sofrer inconsistências sob mutação; cursor/keyset pode ser preferível em feeds ou grandes volumes.

A estratégia deve ser coerente com ordenação estável e autorização. Paginar antes de aplicar escopo pode produzir páginas vazias ou vazamento por contagem.

## 8.12 Temporalidade: saber como os dados eram

Muitos produtos precisam responder não apenas “qual é o valor?”, mas “qual era o valor quando a decisão ocorreu?”. Matrizes, permissões, preços, ementas e vínculos podem exigir vigência. Isso muda profundamente o schema.

Campos valid_from/valid_to, tabelas de versão ou event history são alternativas. O importante é que a necessidade histórica seja definida antes de updates destrutivos.

## 8.13 Versionamento de registros

Versionar não significa apenas possuir updated_at. Versionamento preserva estados anteriores ou uma sequência de revisões. Pode ser necessário para auditoria, comparação, restauração ou validade histórica.

No sistema de matrizes, editar a ementa antiga em lugar de criar nova versão pode alterar retroativamente análises anteriores. DATABASE deve explicitar quais entidades são versionadas e o que cria uma nova versão.

## 8.14 Soft delete e o mito de que deleted_at resolve tudo

Soft delete preserva linha, mas cria novas responsabilidades: todas as consultas devem considerar estado, índices precisam refletir uso, unicidade pode precisar ser parcial e relações precisam definir comportamento. Ele não substitui política de retenção.

Para dados que legalmente precisam ser eliminados, soft delete permanente pode ser inadequado. Para registros auditáveis, exclusão física imediata pode ser inadequada. A decisão depende do domínio e da privacidade.

## 8.15 Auditoria: histórico de negócio não é log de debug

Auditoria precisa registrar eventos relevantes com ator, tempo, objeto, operação e, quando necessário, estado anterior e posterior. Logs de aplicação podem ser rotacionados e conter detalhes técnicos; trilha de auditoria possui finalidade de negócio e segurança.

O CRUD hierárquico exige atenção especial: alteração de permissão, exportação e exclusão devem produzir evidência. O usuário comum não deve conseguir reescrever sua própria trilha.

## 8.16 Concorrência e lost update

Dois usuários podem editar o mesmo registro. Sem política, o último save sobrescreve silenciosamente o primeiro. Optimistic locking com version/etag é uma estratégia comum; locks pessimistas podem ser necessários em cenários específicos.

O domínio decide se conflitos podem ser mesclados, rejeitados ou serializados. DATABASE fornece mecanismos. O Harness deve testar concorrência quando o risco é relevante.

## 8.17 Transações: definir a unidade que não pode ficar pela metade

Transação protege conjuntos de alterações que precisam ser atômicos. Criar registro e auditoria, publicar matriz e atualizar vigência ou atribuir papel e permissões podem exigir atomicidade.

Uma transação longa também possui custos. Em sistemas distribuídos, uma única transação pode não existir; compensações, outbox e idempotência tornam-se opções. A arquitetura deve escolher conscientemente.

## 8.18 Idempotência

Operações repetidas por retry não devem necessariamente duplicar efeitos. Importações, pagamentos, webhooks e jobs são exemplos clássicos. Chaves idempotentes, constraints únicas e estados de processamento podem proteger o sistema.

Para agentes, idempotência também importa em scripts de manutenção: uma migration ou seed deve ter comportamento previsível quando executado no ambiente correto.

## 8.19 Migrations são código de produção

Uma migration altera a estrutura que sustenta todos os dados. Deve ser versionada, revisada, testada e aplicada em ordem. Alterar uma migration já executada é perigoso porque ambientes deixam de compartilhar a mesma história.

A literatura sobre evolução de schema mostra que mudanças de modelo geram coexistência de versões e trade-offs entre custo de migração e latência. Hillenbrand et al. estudam estratégias adaptativas nesse contexto em bancos NoSQL, reforçando que evolução de dados é um problema próprio, não simples efeito de alterar classes.

## 8.20 Expand and contract para mudanças compatíveis

Mudanças sem downtime podem exigir fases. Primeiro adiciona-se estrutura nova compatível; depois aplicação passa a escrever/ler ambos quando necessário; dados são migrados; consumidores são atualizados; somente então a estrutura antiga é removida.

Essa técnica evita que deploy de código e schema precisem ocorrer em um instante perfeito. No ASES-300, remoções destrutivas devem exigir evidência de que nenhum consumidor depende da estrutura antiga.

## 8.21 Backfill e migração de dados

Adicionar coluna é diferente de preencher milhões de registros. Backfills podem bloquear banco, consumir CPU ou criar inconsistência. Devem ser planejados com batches, checkpoint, observabilidade e possibilidade de retomada.

O agente não deve executar UPDATE massivo em produção como parte automática de uma tarefa sem limites e aprovação.

## 8.22 Rollback de migration não é máquina do tempo

Nem toda migration é reversível. Remover coluna destrói informação; transformar valores pode perder precisão. Um comando down pode recriar a coluna, mas não recuperar os dados originais.

Por isso, rollback precisa distinguir reversão estrutural de recuperação de dados. Backup e restore são mecanismos diferentes. Antes de mudança destrutiva, o Harness deve exigir estratégia explícita.

## 8.23 Backup: existência não é evidência de recuperabilidade

Ter arquivos de backup não prova que o sistema pode ser restaurado. Backups precisam de periodicidade, retenção, proteção, criptografia e monitoramento. Mais importante: restore deve ser testado.

REQ-083 e REQ-084 existem separadamente porque backup e restauração são capacidades distintas. Definition of Done de infraestrutura crítica pode exigir evidência de restore em ambiente controlado.

## 8.24 RPO e RTO

Recovery Point Objective expressa quanto dado a organização aceita perder temporalmente; Recovery Time Objective expressa quanto tempo a recuperação pode levar. Esses objetivos devem nascer de necessidade de negócio, não de números arbitrários.

Um sistema acadêmico pode tolerar minutos ou horas dependendo do processo; outro produto pode exigir limites muito menores. DATABASE e DEPLOYMENT materializam os mecanismos necessários.

## 8.25 Seed e dados de demonstração

Seed deve criar o mínimo necessário para inicialização ou testes previsíveis. Dados de demonstração devem ser claramente separados de produção e nunca conter secrets reais.

Seeds idempotentes e versionados ajudam agentes a reproduzir ambiente. Porém, o Harness deve impedir que uma massa de teste sobrescreva dados reais.

## 8.26 Importação como fronteira hostil

Arquivos CSV/XLSX trazem dados externos, formatos inesperados e potencial volume. Importação precisa de validação, preview, limites, tratamento de erros, autorização e atomicidade ou estratégia parcial definida.

O banco não deve receber diretamente tudo que veio do arquivo. O pipeline transforma entrada não confiável em comandos validados.

## 8.27 Exportação e o princípio de não ampliar acesso

Exportação é uma consulta com consequência adicional: cria uma cópia portátil dos dados. Por isso, deve respeitar filtros, escopo, field permissions e auditoria. Consultar banco diretamente para “ganhar performance” pode contornar segurança.

No ASES-300, REQ-114 é arquiteturalmente ligado ao banco: qualquer caminho de exportação precisa aplicar a mesma semântica de autorização antes de materializar linhas e colunas.

## 8.28 Multi-tenancy e isolamento

Quando múltiplas organizações compartilham infraestrutura, o schema precisa incorporar isolamento. Estratégias incluem banco por tenant, schema por tenant ou linhas com tenant_id. Cada opção possui trade-offs de custo, operação e segurança.

Em row-level multi-tenancy, esquecer um filtro pode causar vazamento grave. Policies no banco, constraints e testes negativos podem formar defesa em profundidade.

## 8.29 Segurança de banco

Credenciais de aplicação devem seguir menor privilégio; conexões precisam ser protegidas; dados sensíveis podem exigir criptografia, mascaramento ou tokenização; acesso administrativo deve ser separado. Uma revisão sistemática recente sobre segurança de bancos destaca a diversidade de ameaças e desafios, reforçando que segurança precisa ser tratada em múltiplas camadas.

O agente de aplicação normalmente não precisa de permissão para DROP em produção. A capacidade de executar migrations pode ser separada da identidade usada em runtime.

## 8.30 Retenção, minimização e eliminação

Guardar tudo para sempre não é estratégia neutra. PRODUCT e SECURITY definem finalidade e obrigações; DATABASE implementa retenção. Dados operacionais, auditoria, arquivos e backups podem possuir prazos diferentes.

Eliminar dados também exige pensar em réplicas, índices, caches e backups. O sistema deve documentar o que “excluir” significa em cada categoria.

## 8.31 SQL ou NoSQL: escolha pelo modelo e workload

Não existe vencedor universal entre SQL e NoSQL. A escolha depende de consistência, relacionamentos, padrões de acesso, escala, flexibilidade de schema e operação. Revisões comparativas recentes reforçam que desempenho varia conforme arquitetura e cenário, e não deve ser generalizado fora do workload avaliado.

O ASES-300 exige justificativa arquitetural. “NoSQL escala” ou “SQL é mais seguro” são slogans insuficientes.

## 8.32 ORM: ferramenta de produtividade, não substituto do banco

ORM reduz boilerplate e oferece migrations e tipos, mas não elimina SQL, índices, constraints ou planos de execução. Estudos empíricos sobre tarefas SQL mostram que trabalho envolvendo SQL possui características próprias e frequentemente exige alterações distribuídas e revisão cuidadosa.

O agente deve conhecer a abstração do ORM e também o efeito físico gerado. Uma query elegante no código pode produzir N+1 ou full scan.

## 8.33 Observabilidade do banco

Métricas de latência, locks, conexões, tamanho, queries lentas e falhas de migration ajudam a detectar degradação. O banco deve participar da correlação de request IDs quando possível sem expor dados sensíveis.

Performance evolui com o sistema; estudos empíricos mostram que regressões podem afetar subconjuntos específicos de configurações, reforçando a utilidade de medir continuamente em vez de confiar em uma avaliação única.

## 8.34 Como um agente deve propor mudança de schema

O fluxo recomendado é: identificar REQ e regra de domínio; inspecionar schema atual; verificar volume e dependências; propor migration; classificar risco; definir compatibilidade; testar em banco descartável; executar testes; registrar evidência; somente então permitir promoção.

Mudanças destrutivas, backfills grandes, alterações de chave e mudanças de ownership devem acionar gate humano. O agente pode preparar tudo, mas não deve possuir autoridade irrestrita para destruir dados.

## 8.35 Regras de proteção para agentes

O Harness deve proibir DROP/TRUNCATE em produção sem aprovação explícita; proibir alteração de migration já aplicada; proibir remoção de coluna sem busca de consumidores; exigir backup/restore quando risco justificar; exigir migration test; impedir secrets em seed; exigir transação quando a invariante demanda atomicidade.

Essas regras transformam “tenha cuidado com o banco” em controles operacionais.

## 8.36 Testes de banco

Testes unitários não são suficientes para persistência. Constraints, migrations, queries, transações e concorrência precisam de integração com um banco real ou compatível. Uma migration deve ser testada partindo do schema anterior, não apenas em banco vazio.

O Harness pode criar banco temporário, aplicar todas as migrations, carregar fixtures, executar testes, verificar schema esperado e destruir o ambiente.

## 8.37 Anti-padrão: corrigir dados manualmente sem trilha

Alterações manuais emergenciais podem ser necessárias, mas devem possuir script, revisão, backup e registro. Um UPDATE executado diretamente e esquecido cria estado que não pode ser reproduzido.

Se a correção representa regra permanente, deve virar código ou migration. Se é reparo pontual, deve gerar evidência operacional.

## 8.38 Anti-padrão: remover constraint porque o teste falhou

Quando constraint rejeita dado, existem duas hipóteses: a constraint está errada ou o dado está inválido. Removê-la automaticamente apenas faz o erro desaparecer. O agente precisa voltar ao DOMAIN e ao REQ.

Esse princípio resume a governança do banco: a implementação deve se adaptar à verdade aprovada, e não enfraquecer a verdade para facilitar implementação.

## 8.39 Anti-padrão: schema genérico demais

Tabelas universais do tipo entity(id,type,json) podem acelerar protótipos, mas sacrificam constraints, consultas e clareza quando utilizadas indiscriminadamente. Flexibilidade é requisito possível; ausência de modelo não é flexibilidade.

Estruturas JSON são úteis quando parte do domínio é realmente dinâmica, como campos configuráveis, mas precisam de limites, validação, indexação e estratégia de evolução.

## 8.40 Anti-padrão: índice para cada coluna

Índices indiscriminados aumentam custo de escrita e manutenção. O índice deve responder a padrão de consulta. Índices compostos também dependem da ordem das colunas e seletividade.

O processo correto é medir query, examinar plano, formular hipótese, criar índice, medir novamente e manter evidência quando o caminho é crítico.

## 8.41 Template comentado de DATABASE.md

O template a seguir transforma DATABASE em artefato operacional do Harness. Projetos simples podem condensá-lo; sistemas críticos podem dividi-lo por contexto ou datastore.

> \# DATABASE.md  
>   
> \## 1. Visão geral  
> Datastores utilizados e responsabilidade de cada um.  
>   
> \## 2. Origem conceitual  
> DOMAIN entities \| REQs \| tabelas/coleções relacionadas  
>   
> \## 3. Modelo lógico  
> Entidade \| identidade \| atributos \| relações \| invariantes  
>   
> \## 4. Modelo físico  
> Tabela \| coluna \| tipo \| null \| default \| constraint  
>   
> \## 5. Chaves e relacionamentos  
> PKs, FKs, unique keys e cardinalidades.  
>   
> \## 6. Índices  
> Índice \| query/workload \| justificativa \| evidência  
>   
> \## 7. Temporalidade e versionamento  
> Entidades versionadas, vigência e histórico.  
>   
> \## 8. Exclusão e retenção  
> Soft delete, hard delete, retenção e purga.  
>   
> \## 9. Auditoria  
> Eventos, before/after, ator e proteção.  
>   
> \## 10. Concorrência  
> Optimistic/pessimistic locking e resolução de conflitos.  
>   
> \## 11. Transações  
> Unidades atômicas e invariantes protegidas.  
>   
> \## 12. Migrations  
> Convenções, compatibilidade, expand/contract e rollback.  
>   
> \## 13. Backfills  
> Batch, checkpoint, observabilidade e limites.  
>   
> \## 14. Backup e restore  
> Periodicidade, retenção, RPO, RTO e teste de restauração.  
>   
> \## 15. Seed e fixtures  
> Dados mínimos, demo e separação de produção.  
>   
> \## 16. Importação e exportação  
> Validação, autorização, volume e auditoria.  
>   
> \## 17. Segurança  
> Credenciais, privilégios, criptografia e isolamento.  
>   
> \## 18. Observabilidade  
> Métricas, slow queries, locks, storage e alertas.  
>   
> \## 19. Regras para agentes  
> Mudanças permitidas, gates humanos e operações proibidas.  
>   
> \## 20. Verificação  
> Migration tests, schema tests, performance tests e restore drills.

## 8.42 Exemplo de rastreabilidade DOMAIN → DATABASE

| Regra de domínio          | Estrutura física | Proteção                   | Teste                 | Evidência              |
|---------------------------|------------------|----------------------------|-----------------------|------------------------|
| Matriz possui versões     | matrix_versions  | UNIQUE(matrix_id, version) | migration/integration | versões preservadas    |
| Usuário pertence a tenant | tenant_id        | FK + policy                | security integration  | tenant B não lê A      |
| Percentual 0–100          | score            | CHECK                      | constraint test       | 101 rejeitado          |
| Auditoria preservada      | audit_events     | append-only policy         | security test         | update rejeitado       |
| Concorrência detectável   | version          | optimistic lock            | concurrency test      | stale update rejeitado |

## 8.43 Exemplo de migration segura em fases

> FASE A — EXPAND  
> 1. Adicionar coluna nova como nullable.  
> 2. Implantar código compatível com coluna antiga e nova.  
> 3. Ativar escrita no novo formato.  
>   
> FASE B — MIGRATE  
> 4. Executar backfill em batches.  
> 5. Medir erros, locks e progresso.  
> 6. Verificar 100% dos registros elegíveis.  
>   
> FASE C — CONTRACT  
> 7. Alterar leitura para novo formato.  
> 8. Confirmar ausência de consumidores antigos.  
> 9. Aplicar constraint final.  
> 10. Remover estrutura antiga somente após gate e evidência.

## 8.44 Checklist de DATABASE

1\. Cada tabela importante possui origem em DOMAIN ou necessidade técnica documentada?

2\. PKs e identificadores de negócio estão diferenciados?

3\. FKs e constraints protegem invariantes possíveis?

4\. NULL possui semântica clara?

5\. Índices possuem workload justificando sua existência?

6\. Consultas de listagem possuem limites e paginação?

7\. Temporalidade e histórico foram considerados?

8\. Soft delete possui política consistente?

9\. Auditoria está separada de logs técnicos?

10\. Concorrência possui comportamento definido?

11\. Operações atômicas usam transação adequada?

12\. Migrations são imutáveis depois de aplicadas?

13\. Mudanças incompatíveis usam estratégia de transição?

14\. Backfills grandes possuem batches e checkpoints?

15\. Backup existe e restore foi testado?

16\. RPO e RTO são conhecidos quando relevantes?

17\. Seed é seguro e idempotente?

18\. Importação valida entrada hostil?

19\. Exportação respeita autorização por linha e campo?

20\. Multi-tenancy possui isolamento verificável?

21\. Runtime utiliza menor privilégio?

22\. Retenção e eliminação estão documentadas?

23\. ORM não esconde queries críticas sem medição?

24\. Mudanças destrutivas exigem gate humano?

25\. O Harness consegue criar banco limpo, migrar e testar automaticamente?

## 8.45 Exercício orientado

Escolha três entidades do DOMAIN construído no capítulo anterior. Para cada uma, desenhe o modelo lógico, defina PK, identificadores de negócio, FKs, constraints e índices. Escolha uma entidade temporal e modele duas versões. Depois simule uma mudança incompatível de schema e escreva um plano expand–migrate–contract. Por fim, escreva dois testes de migration, um teste de concorrência e um procedimento de restore. O exercício somente termina quando você consegue explicar não apenas como os dados são gravados, mas como serão preservados durante a próxima mudança.

## 8.46 Conclusão

DATABASE transforma significado em persistência. Sua responsabilidade não é simplesmente guardar dados, mas preservar identidade, integridade, temporalidade, autorização, auditabilidade e capacidade de evolução. Chaves, constraints, índices, transações, migrations e backups são mecanismos diferentes para proteger propriedades diferentes do sistema.

Em projetos orientados a agentes, banco de dados exige um dos limites de autonomia mais claros. Um agente pode elaborar migration, executar em ambiente descartável, medir, testar e produzir evidência; alterações destrutivas em dados reais precisam de gates proporcionais ao risco. Essa combinação preserva velocidade sem converter automação em autoridade irrestrita.

O Capítulo 9 será dedicado a API & INTEGRATIONS: contratos, recursos, métodos, schemas, validação, erros, autenticação, autorização, idempotência, paginação, versionamento, rate limiting, webhooks, integrações externas, resiliência e como transformar APIs em fronteiras verificáveis pelo Harness.

## 8.47 Referências utilizadas neste capítulo — registro provisório

As referências serão consolidadas no Capítulo 25 — Referências. Nesta fase permanecem junto ao capítulo para rastreabilidade acadêmica.

HILLENBRAND, Andrea; STÖRL, Uta; NABIYEV, Shamil; KLETTKE, Meike. Self-adapting data migration in the context of schema evolution in NoSQL databases. **Distributed and Parallel Databases**, v. 40, p. 5–25, 2022. Disponível em: https://doi.org/10.1007/s10619-021-07334-1. Acesso em: 20 set. 2026.

IQBAL, Asif; KHAN, Siffat Ullah; NIAZI, Mahmood; HUMAYUN, Mamoona; SAMA, Najm Us; KHAN, Arif Ali et al. Advancing database security: a comprehensive systematic mapping study of potential challenges. **Wireless Networks**, v. 30, p. 6399–6426, 2024. Disponível em: https://doi.org/10.1007/s11276-023-03436-z. Acesso em: 20 set. 2026.

KHAN, Wisal; KUMAR, Teerath; ZHANG, Cheng; RAJ, Kislay; ROY, Arunabha M. et al. SQL and NoSQL Database Software Architecture Performance Analysis and Assessments—A Systematic Literature Review. **Big Data and Cognitive Computing**, v. 7, n. 2, art. 97, 2023. Disponível em: https://doi.org/10.3390/bdcc7020097. Acesso em: 20 set. 2026.

KALTENECKER, Christian; MÜHLBAUER, Stefan; GREBHAHN, Alexander; SIEGMUND, Norbert et al. Performance evolution of configurable software systems: an empirical study. **Empirical Software Engineering**, v. 28, art. 152, 2023. Disponível em: https://doi.org/10.1007/s10664-023-10338-3. Acesso em: 20 set. 2026.

Studying the characteristics of SQL-related development tasks: An empirical study. **Empirical Software Engineering**, v. 28, art. 69, 2023. Disponível em: https://doi.org/10.1007/s10664-023-10295-x. Acesso em: 20 set. 2026.

# CAPÍTULO 9 — API & INTEGRATIONS: CONTRATOS, FRONTEIRAS E COMUNICAÇÃO VERIFICÁVEL ENTRE SISTEMAS

## 9.1 A API é uma promessa executável

Uma API não deve ser compreendida apenas como um conjunto de URLs que recebe JSON. Ela é uma fronteira contratual pela qual uma parte do sistema promete determinado comportamento a outra. Essa promessa envolve operações disponíveis, formato das entradas, estrutura das respostas, códigos de erro, regras de autenticação, autorização, paginação, limites, compatibilidade e expectativas temporais. Quando uma API muda, o impacto pode atingir aplicações, integrações e organizações que não participam diretamente da implementação.

No ASES-300, API-INTEGRATIONS transforma relações arquiteturais em contratos verificáveis. DOMAIN diz o significado de uma operação; REQUIREMENTS estabelece obrigações; ARCHITECTURE define fronteiras; DATABASE preserva estado; API especifica como capacidades atravessam essas fronteiras. A API não deve reinventar regras de negócio nem contornar autorização: ela expõe casos de uso de maneira controlada.

Essa visão é consistente com a literatura recente. Gomez e Vesey (2024), do Software Engineering Institute, tratam APIs como abstrações fundamentais cuja qualidade envolve design, desenvolvimento, segurança, testes e suporte operacional. Estudos empíricos também mostram que regras de design influenciam a compreensibilidade das Web APIs (BOGNER; KOTSTEIN; PFAFF, 2023).

## 9.2 Contrato antes de implementação

Quando consumidores e provedores evoluem independentemente, o contrato torna-se uma peça central. Uma especificação OpenAPI pode descrever operações HTTP, schemas, parâmetros, respostas e autenticação. AsyncAPI cumpre papel semelhante em comunicação orientada a eventos. O contrato pode alimentar documentação, geração de clientes, validação e testes.

Contract-first não significa que toda API precise ser desenhada meses antes do código. Significa que alterações públicas são tratadas conscientemente como alterações de contrato. Em ciclos iterativos, contrato e implementação evoluem juntos, mas o pipeline verifica se continuam coerentes.

Para agentes, essa prática é especialmente importante. Sem contrato explícito, um agente pode renomear um campo para “melhorar consistência” e quebrar consumidores. Com schema versionado e testes, a mesma mudança produz feedback objetivo.

## 9.3 Da operação de domínio ao endpoint

Endpoints não deveriam nascer de telas. A pergunta inicial é qual capacidade de domínio ou caso de uso precisa ser exposto. \`ApproveEquivalence\` pode resultar em \`POST /equivalence-decisions/{id}/approve\`; listar matrizes pode resultar em \`GET /curriculum-matrices\`. A forma exata depende do estilo adotado, mas o significado deve vir do domínio.

Um anti-padrão comum é construir endpoints CRUD genéricos para tudo e transferir regras para o cliente. Se publicar uma matriz exige validações e autoridade, \`PATCH status=published\` pode esconder uma operação importante. Uma ação explícita pode tornar intenção, autorização, auditoria e teste mais claros.

O ASES-300 não transforma REST em dogma. O critério é que a interface represente capacidades de maneira compreensível, estável e verificável.

## 9.4 Recursos, operações e semântica HTTP

Em APIs HTTP, métodos possuem semântica que ajuda consumidores a prever comportamento. GET recupera representação e deve ser seguro; POST frequentemente cria ou dispara processamento; PUT tende a representar substituição idempotente; PATCH alteração parcial; DELETE remoção lógica ou física conforme contrato. Usar semântica consistente reduz surpresa.

Idempotência merece destaque. Uma operação idempotente pode ser repetida sem produzir efeitos adicionais além do primeiro resultado lógico. Isso é crítico em redes, porque clientes podem repetir chamadas após timeout sem saber se o servidor processou a primeira.

Para operações não naturalmente idempotentes, idempotency keys podem impedir duplicidade. Pagamentos são exemplo clássico, mas importações, geração de jobs e comandos administrativos também podem se beneficiar.

## 9.5 Schemas são parte do contrato

Um campo não é apenas nome e tipo. Seu contrato pode incluir obrigatoriedade, nulabilidade, formato, limites, enumerações, significado e condições. \`status: string\` é fraco; \`status\` restrito a valores documentados é melhor. Um percentual precisa declarar escala. Uma data precisa declarar timezone e formato.

No ASES-300, schemas devem ser compartilhados quando possível entre validação, documentação e tipos, evitando três definições divergentes. Isso não significa acoplar todas as camadas à mesma biblioteca, mas possuir fonte de verdade clara.

Entradas devem ser validadas na fronteira. Dados externos são não confiáveis até serem verificados.

## 9.6 Respostas: estabilidade, consistência e informação suficiente

Respostas devem ser consistentes entre operações. Convenções para identificadores, datas, paginação e erros reduzem custo cognitivo. Ao mesmo tempo, uma API não deve retornar dados apenas porque estão disponíveis no banco. O contrato expõe aquilo que o consumidor está autorizado e precisa conhecer.

Field-level authorization precisa ocorrer antes da serialização. Se \`salary\` é proibido, removê-lo apenas na interface é insuficiente. A API deve construir representação autorizada. O mesmo vale para relações e metadados.

Essa decisão conecta API ao modelo de segurança apresentado nos capítulos anteriores: representação pública não é espelho automático da tabela.

## 9.7 Erros também são contratos

Uma API profissional especifica falhas. Consumidores precisam distinguir autenticação ausente, autorização negada, recurso inexistente, conflito, validação e falha interna. Retornar \`500\` para tudo destrói informação; retornar detalhes internos demais pode vazar dados.

Um envelope de erro pode incluir código estável, mensagem humana, detalhes de validação e request ID. O código de máquina permite comportamento determinístico; a mensagem pode ser localizada; o request ID conecta consumidor à observabilidade.

Erros esperados de negócio não devem ser tratados como exceções imprevisíveis. \`MATRIX_NOT_APPROVED\` pode ser uma condição conhecida e testável.

## 9.8 Autenticação e autorização não são a mesma coisa

Autenticação responde quem está chamando. Autorização responde se essa identidade pode executar a ação naquele recurso, escopo e contexto. Uma API pode autenticar perfeitamente e ainda possuir falhas graves se qualquer usuário autenticado acessar recursos de outros.

AUTH-AUTHORIZATION detalhará mecanismos, mas API-INTEGRATIONS deve declarar para cada operação se autenticação é obrigatória e qual capability/policy é exigida. Essa informação deve aparecer no contrato e nos testes.

O Harness deve procurar endpoints sem proteção explícita e exigir justificativa para endpoints públicos.

## 9.9 Paginação é um contrato de escala

Listagens ilimitadas funcionam em demonstrações e falham em produção. Paginação limita custo e torna comportamento previsível. Offset/limit é simples, mas pode apresentar inconsistências e custo em grandes conjuntos; cursor/keyset pode ser mais adequado para feeds ou volumes elevados.

O contrato precisa definir tamanho padrão, máximo, ordenação estável e metadados retornados. Se filtros alteram ordenação, isso deve ser previsível.

REQ-068 e REQ-124 ganham forma concreta na API por meio dessa decisão.

## 9.10 Filtros, busca e ordenação

Filtros não devem ser concatenados diretamente em SQL. A API precisa declarar campos filtráveis, operadores aceitos, limites e comportamento para valores inválidos. Ordenação também deve usar allowlist.

Busca textual pode variar de \`contains\` simples a full-text search. O contrato deve evitar prometer semântica que a implementação não garante. Se acentos, stemming ou ranking importam, isso precisa ser definido.

Em APIs com autorização por escopo, filtros são aplicados dentro do conjunto autorizado; nunca devem ampliar visibilidade.

## 9.11 Versionamento: compatibilidade antes de números

Versionar API não é apenas colocar \`/v1\`. O problema real é compatibilidade. Adicionar campo opcional pode ser compatível; remover campo, mudar tipo ou alterar significado tende a ser breaking change. Estratégias podem usar versão na URL, header ou evolução compatível sem versão explícita.

Lamothe, Guéhéneuc e Shang (2021) mostram, em revisão sistemática, que evolução de APIs permanece uma área com desafios relevantes. Estudo de evolução de APIs de microsserviços em prática também destaca backward compatibility, análise de impacto e comunicação como preocupações centrais.

No ASES-300, breaking changes exigem identificação de consumidores, plano de migração, período de compatibilidade quando aplicável, testes e evidência.

## 9.12 Depreciação é processo, não comentário

Quando uma operação precisa desaparecer, consumidores precisam de tempo e alternativa. Depreciação deve registrar data, substituto, consumidores afetados e critério de remoção. Telemetria pode indicar se endpoint antigo continua sendo usado.

Um agente não deve remover endpoint “não utilizado no frontend” porque integrações externas podem consumi-lo. Uso interno do repositório não prova ausência de consumidores.

Remoção pública deve passar por gate de compatibilidade.

## 9.13 Integrações externas: o sistema não controla o outro lado

Uma integração externa adiciona incerteza. O serviço pode ficar indisponível, responder lentamente, mudar comportamento, limitar requisições ou devolver dados inesperados. A arquitetura deve assumir falha.

Adapters isolam detalhes externos. O domínio recebe modelos próprios; o adapter traduz formato do fornecedor. Isso evita que tipos externos contaminem todo o código.

Cada integração deve documentar proprietário, autenticação, limites, timeout, retry, fallback, dados enviados, dados recebidos e política de observabilidade.

## 9.14 Timeouts: esperar para sempre não é resiliência

Toda chamada remota deve possuir limite temporal coerente com o caso de uso. Timeout excessivo degrada experiência e consome recursos; timeout curto demais aumenta falsos fracassos. O valor precisa ser escolhido a partir de SLOs e comportamento conhecido.

Timeout não significa necessariamente que a operação remota não ocorreu. Esse detalhe é crucial para comandos. Após timeout, repetir cegamente pode duplicar efeito; daí a importância de idempotência e reconciliação.

Logs devem distinguir timeout de rejeição funcional.

## 9.15 Retry com critério

Retry é apropriado para falhas transitórias, não para qualquer erro. Repetir \`400 Bad Request\` três vezes apenas aumenta carga. Repetir uma operação não idempotente pode duplicar efeito.

Backoff exponencial e jitter ajudam a evitar tempestades de repetição. Número máximo de tentativas precisa ser limitado. Depois disso, o sistema pode falhar de forma controlada, enfileirar para processamento posterior ou exigir intervenção.

O Harness deve testar retry sem depender de esperar minutos; clocks e adapters testáveis facilitam simulação.

## 9.16 Circuit breaker e isolamento de falhas

Quando um serviço externo está falhando persistentemente, continuar enviando chamadas pode agravar o problema. Circuit breaker interrompe temporariamente tentativas e permite recuperação controlada. Bulkheads podem limitar propagação de saturação entre capacidades.

Esses padrões não devem ser aplicados mecanicamente. Cada mecanismo aumenta estado e observabilidade necessários. Use quando drivers de disponibilidade justificarem.

ARCHITECTURE registra a decisão; API-INTEGRATIONS descreve comportamento por integração.

## 9.17 Rate limiting e quotas

Rate limiting protege capacidade, custo e segurança. Limites podem ser por identidade, organização, token, IP ou operação. APIs de IA podem precisar de limites baseados em custo além de requisições.

Uma resposta de limite deve ser previsível e, quando aplicável, informar quando tentar novamente. O limite não deve ser a única defesa contra abuso.

REQ-177 torna-se verificável quando política, chave de limitação, janela e resposta estão especificadas.

## 9.18 Webhooks: quando o outro sistema precisa ser avisado

Webhooks invertem o fluxo: em vez de consumidor consultar repetidamente, provedor envia evento para URL registrada. Isso reduz polling, mas cria desafios de autenticação, entrega e duplicidade.

Payload deve possuir event ID, tipo, versão e timestamp. Assinaturas permitem verificar origem. Entrega deve assumir que o consumidor pode falhar. Retries e política de expiração precisam ser documentados.

Consumidores devem tratar eventos como potencialmente duplicados; idempotência volta a ser essencial.

## 9.19 APIs orientadas a eventos e AsyncAPI

Nem toda integração é request-response. Filas, streams e brokers carregam eventos e comandos assíncronos. Nesse caso, contrato inclui canal, tipo de mensagem, schema, semântica, ordenação e garantias de entrega.

AsyncAPI pode funcionar como documentação estruturada desses contratos. O princípio do ASES-300 permanece o mesmo: contrato versionado, implementação verificável e compatibilidade controlada.

Uma alteração em evento pode ser tão destrutiva quanto breaking change HTTP.

## 9.20 Contract testing: verificar a fronteira sem depender de E2E gigante

Testes de contrato verificam se consumidor e provedor concordam sobre interface. Consumer-driven contract testing permite que expectativas reais do consumidor sejam verificadas no provedor. Schwarz (2025), em revisão sistemática, trata CDCT como técnica para garantir interoperabilidade sintática entre serviços com testes isolados.

Isso complementa, não elimina, testes de integração e E2E. Contract tests detectam incompatibilidades de schema e interação com feedback rápido; E2E continua útil para jornadas críticas.

No Harness, mudança de contrato deve executar contract tests antes de release.

## 9.21 Testes de API: muito além do caminho feliz

Ehsan et al. (2022), em revisão sobre testes RESTful, discutem desafios de metodologias e geração automática de testes. Uma estratégia robusta inclui testes funcionais, validação, autenticação, autorização, limites, erros, propriedades e segurança.

Para \`GET /records/{id}\`, não basta testar 200. Devem existir casos para inexistente, escopo proibido, token inválido, campo sensível, ID malformado e comportamento após exclusão. Para importação, testar duplicidade, arquivo inválido e retry.

Cada REQ crítico de API precisa apontar para verificação adequada.

## 9.22 OpenAPI como artefato executável

OpenAPI pode ser mais que documentação. Pode validar requests/responses, gerar SDKs, alimentar mocks, produzir testes e detectar drift entre contrato e implementação. Quanto mais o Harness consegue automatizar, menor a dependência de disciplina manual.

Entretanto, schema correto não prova regra de negócio. Uma resposta pode obedecer JSON Schema e ainda expor registro de outra organização. Contrato estrutural e teste de autorização são camadas diferentes.

O ASES-300 combina ambos.

## 9.23 API security: o objeto é tão importante quanto o endpoint

Falhas de autorização frequentemente ocorrem quando endpoint exige login, mas não verifica acesso ao objeto específico. \`GET /users/123\` pode estar protegido e ainda permitir enumeração de usuários. O mesmo vale para campos e funções administrativas.

Policies devem receber contexto suficiente: sujeito, ação, recurso, organização, atributos e, quando necessário, estado. Segurança não pode depender de o frontend esconder IDs.

Security tests devem tentar atravessar fronteiras deliberadamente.

## 9.24 Mass assignment e campos controlados pelo servidor

Quando um payload é convertido automaticamente em entidade, o cliente pode tentar alterar campos que não deveria controlar, como \`role\`, \`ownerId\`, \`approvedAt\` ou \`createdBy\`. Allowlist explícita de campos graváveis reduz esse risco.

DTOs de entrada não devem ser espelho completo da entidade persistida. Create, Update e Response podem ter schemas diferentes.

Essa separação melhora segurança e documentação.

## 9.25 Uploads e downloads como integrações sensíveis

Upload precisa validar tamanho, tipo, extensão, conteúdo e autorização. Nome fornecido pelo usuário não deve controlar caminho de armazenamento. Arquivos podem exigir antivírus ou processamento isolado conforme risco.

Download também exige autorização no momento da solicitação. Uma URL permanente e pública pode contornar políticas. Signed URLs com expiração podem ser adequadas quando suportadas.

Metadados do arquivo precisam de ownership e auditoria.

## 9.26 Importação como pipeline, não como endpoint mágico

Importações grandes normalmente envolvem upload, parsing, validação, preview, confirmação e processamento. Tentar fazer tudo em uma requisição síncrona pode causar timeout e experiência ruim.

Um \`ImportJob\` com estados \`UPLOADED\`, \`VALIDATING\`, \`READY\`, \`PROCESSING\`, \`COMPLETED\` e \`FAILED\` torna o fluxo observável. Erros podem ser associados a linhas e campos.

API expõe estado; fila processa trabalho; auditoria registra ações.

## 9.27 Exportação: uma API paralela de dados

Exportar XLSX ou CSV é uma forma de leitura e deve obedecer às mesmas regras. Um exportador que consulta banco diretamente pode vazar campos que a API comum remove.

Uma arquitetura segura reutiliza query autorizada ou policy central. Filtros e ordenação solicitados precisam ser registrados. Grandes exports podem virar jobs assíncronos.

REQ-105, REQ-114, REQ-135, REQ-136 e REQ-137 convergem nessa fronteira.

## 9.28 Integrações com LLMs e APIs de IA

Providers de IA são integrações externas com propriedades especiais: custo variável, limites, latência, modelos versionados, conteúdo sensível e respostas probabilísticas. A API interna não deve espalhar detalhes do provider pelo produto.

Um adapter pode receber tarefa tipada e retornar resultado estruturado com metadados: provider, model, prompt version, latency, token usage e provenance. Falhas devem ser classificadas entre rate limit, timeout, conteúdo recusado, schema inválido e erro interno.

Fallback entre modelos precisa respeitar requisitos de privacidade e capacidade; não se deve enviar dados para provider alternativo sem autorização arquitetural.

## 9.29 MCP e APIs: semelhantes na ideia de contrato, diferentes na finalidade

Uma API tradicional expõe capacidades a aplicações. MCP padroniza a forma pela qual aplicações e agentes de IA descobrem e utilizam ferramentas e contexto. Ambos dependem de contratos claros, schemas e autorização, mas possuem ciclos de interação diferentes.

No ASES-300, uma capacidade existente pode ser exposta por REST para aplicações e por ferramenta MCP para agentes, desde que ambos atravessem a mesma camada de domínio e autorização. Não se deve duplicar regra de negócio dentro do servidor MCP.

Essa convergência preserva uma única verdade comportamental.

## 9.30 Observabilidade de APIs

Cada request relevante deve ser correlacionável. Request ID, usuário ou service principal, operação, status, duração e erro ajudam diagnóstico. Dados sensíveis não devem ser registrados indiscriminadamente.

Métricas incluem throughput, latência, error rate, saturation e, para integrações, dependência externa. Percentis são mais informativos do que apenas média.

Tracing distribuído torna-se importante quando uma requisição atravessa múltiplos serviços ou ferramentas.

## 9.31 SLOs e APIs

Um requisito de disponibilidade ou latência precisa de janela e população. “API rápida” não é verificável. Um SLO pode dizer que 95% das consultas típicas respondem em até determinado limite em condições especificadas.

SLO não deve ser inventado apenas para preencher documento. Deve refletir necessidade do produto e capacidade. ARCHITECTURE e OBSERVABILITY ajudam a medir.

Quando dependência externa domina latência, o SLO precisa considerar fallback ou budget.

## 9.32 Evolução de APIs de microsserviços

Estudos recentes sobre evolução de APIs em microsserviços mostram que backward compatibility, análise de mudanças e comunicação com consumidores são preocupações práticas recorrentes. Isso reforça que evolução não é apenas versionar endpoint; envolve coordenação sociotécnica.

No ASES-300, a matriz de consumidores deve registrar quem depende de um contrato. O Harness pode detectar mudanças de schema e executar testes, mas decisões de remoção podem exigir comunicação humana.

Quanto mais independente o deploy, mais importante a compatibilidade.

## 9.33 Anti-padrão: API que espelha o banco

Expor tabelas diretamente transforma decisões internas em contrato público. Renomear coluna vira breaking change; relações técnicas vazam; campos sensíveis aparecem por acidente.

A API deve representar recursos e casos de uso do domínio. Persistência é detalhe interno.

Essa separação permite evoluir banco sem necessariamente quebrar consumidores.

## 9.34 Anti-padrão: endpoint universal

Endpoints como \`/execute\` ou \`/generic-crud\` podem parecer flexíveis, mas escondem semântica, autorização e documentação. Toda operação passa a depender de payload genérico e condicionais.

Flexibilidade pode ser necessária em plataformas configuráveis, mas deve existir um modelo explícito de capacidades e policies. Genérico não significa sem contrato.

O Harness precisa conseguir determinar o que cada operação pode fazer.

## 9.35 Anti-padrão: retry infinito

Retry infinito transforma falha externa em consumo interno contínuo. Pode gerar fila crescente, custo e duplicidade. Toda política precisa de limite e destino final.

Depois de tentativas esgotadas, um job pode ir para estado FAILED ou dead-letter. A recuperação precisa ser observável.

Falha persistente é informação operacional, não algo a esconder.

## 9.36 Anti-padrão: breaking change silenciosa

Alterar enum, remover campo ou mudar significado sem versão e sem teste é uma das formas mais perigosas de evolução. Consumidores podem compilar e falhar apenas em runtime.

Schema diff, contract testing e changelog reduzem esse risco. Mudanças incompatíveis precisam de gate.

Agentes não devem interpretar ausência de testes como permissão para quebrar contrato.

## 9.37 API-INTEGRATIONS como documento de governança

O arquivo não deve duplicar uma especificação OpenAPI inteira. Ele explica decisões e políticas transversais: convenções, versionamento, erros, segurança, integração, resiliência e ownership. OpenAPI/AsyncAPI ficam como contratos executáveis associados.

Essa divisão evita documentação redundante. O texto explica por quê; a especificação define exatamente o quê; testes demonstram que implementação cumpre.

Traceability conecta todos esses artefatos.

## 9.38 Template comentado de API-INTEGRATIONS.md

> \# API-INTEGRATIONS.md  
>   
> \## 1. Princípios gerais  
> Estilo, convenções e objetivos das APIs.  
>   
> \## 2. Base paths e versionamento  
> Versão atual, política de breaking changes e depreciação.  
>   
> \## 3. Autenticação  
> Mecanismos aceitos e identidade resultante.  
>   
> \## 4. Autorização  
> Policy/capability por operação e regras de escopo.  
>   
> \## 5. Schemas  
> Fonte de verdade, validação, nulabilidade, datas e enums.  
>   
> \## 6. Padrão de respostas  
> Envelope, recursos, metadados e campos sensíveis.  
>   
> \## 7. Padrão de erros  
> HTTP status \| code \| significado \| retryable?  
>   
> \## 8. Paginação, filtros e ordenação  
> Limites, cursores, campos permitidos.  
>   
> \## 9. Idempotência  
> Operações idempotentes e uso de idempotency keys.  
>   
> \## 10. Rate limiting  
> Chave, janela, limites e resposta.  
>   
> \## 11. Endpoints  
> Method \| Path \| Purpose \| Auth \| Policy \| REQs \| Contract Tests  
>   
> \## 12. Integrações externas  
> Sistema \| Adapter \| Auth \| Timeout \| Retry \| Fallback \| Dados  
>   
> \## 13. Webhooks  
> Eventos, assinatura, retry e idempotência.  
>   
> \## 14. Eventos assíncronos  
> Canal \| Mensagem \| Schema \| Compatibilidade \| DLQ  
>   
> \## 15. Upload/download  
> Limites, validação, storage e autorização.  
>   
> \## 16. OpenAPI / AsyncAPI  
> Localização, geração, validação e drift checks.  
>   
> \## 17. Contract testing  
> Consumidores, provedores e pipeline.  
>   
> \## 18. Observabilidade  
> Request ID, métricas, tracing e redaction.  
>   
> \## 19. Segurança  
> Threats, validation, BOLA/BFLA, mass assignment.  
>   
> \## 20. Regras para agentes  
> Mudanças permitidas, breaking changes e gates humanos.

## 9.39 Exemplo de contrato de endpoint

> operation: GET /v1/records/{recordId}  
> purpose: Recuperar um registro autorizado.  
> authentication: REQUIRED  
> authorization:  
> action: READ  
> resource: RECORD  
> scope: organization + row policy + field policy  
> path:  
> recordId: UUID  
> responses:  
> 200: AuthorizedRecordResponse  
> 400: INVALID_ID  
> 401: UNAUTHENTICATED  
> 403: FORBIDDEN  
> 404: RECORD_NOT_FOUND  
> 429: RATE_LIMITED  
> requirements:  
> - REQ-100  
> - REQ-110  
> - REQ-111  
> tests:  
> - records-read-authorized.spec.ts  
> - records-row-denied.spec.ts  
> - records-field-redaction.spec.ts  
> evidence:  
> - contract-test  
> - authorization-test

## 9.40 Exemplo de envelope de erro

> {  
> "error": {  
> "code": "MATRIX_NOT_APPROVED",  
> "message": "A matriz ainda não pode ser publicada.",  
> "details": \[  
> {"field": "status", "reason": "requires APPROVED"}  
> \],  
> "requestId": "req_01J..."  
> }  
> }

## 9.41 Matriz de integração externa

| Integração                | Autenticação          | Timeout             | Retry                      | Fallback                            | Observabilidade               |
|---------------------------|-----------------------|---------------------|----------------------------|-------------------------------------|-------------------------------|
| Identity Provider         | OIDC/OAuth2           | Curto               | Limitado                   | Sessão existente conforme política  | latência, falhas, request ID  |
| E-mail                    | API key/OAuth         | Moderado            | Sim, assíncrono            | Fila/dead-letter                    | delivery status               |
| LLM Provider              | Secret + policy       | Definido por tarefa | Somente erros transitórios | Modelo/provider aprovado            | tokens, custo, latência, erro |
| Object Storage            | Binding/credentials   | Curto               | Idempotente                | Erro controlado                     | upload/download metrics       |
| Sistema acadêmico externo | Credencial de serviço | Moderado            | Conforme operação          | Cache/dados anteriores se permitido | health + freshness            |

## 9.42 Matriz de compatibilidade de mudanças

| Mudança                                | Tende a ser compatível? | Ação ASES-300                  |
|----------------------------------------|-------------------------|--------------------------------|
| Adicionar campo opcional               | Sim                     | Contract tests + documentação  |
| Adicionar valor a enum fechado         | Depende do consumidor   | Análise de impacto obrigatória |
| Remover campo                          | Não                     | Nova versão/depreciação        |
| Mudar string para number               | Não                     | Breaking change                |
| Tornar campo opcional obrigatório      | Não                     | Breaking change                |
| Adicionar endpoint                     | Sim                     | Testes + documentação          |
| Alterar significado sem alterar schema | Perigoso                | ADR/REQ + migração comunicada  |
| Renomear evento                        | Não                     | Versionar contrato assíncrono  |

## 9.43 Fluxo de uma chamada protegida

> CLIENT  
> ↓  
> EDGE / ROUTER  
> ↓ validate transport + rate limit  
> AUTHENTICATION  
> ↓ subject  
> INPUT SCHEMA VALIDATION  
> ↓ typed request  
> AUTHORIZATION POLICY  
> ↓ subject + action + resource + scope  
> APPLICATION USE CASE  
> ↓  
> DOMAIN  
> ↓  
> REPOSITORY / EXTERNAL ADAPTER  
> ↓  
> AUTHORIZED RESPONSE MAPPING  
> ↓  
> CONTRACT VALIDATION  
> ↓  
> OBSERVABILITY + AUDIT  
> ↓  
> CLIENT

## 9.44 Fluxo de integração resiliente

> USE CASE  
> ↓  
> INTEGRATION PORT  
> ↓  
> ADAPTER  
> ├─ timeout  
> ├─ authentication  
> ├─ schema validation  
> ├─ retry policy  
> └─ circuit policy  
> ↓  
> EXTERNAL SYSTEM  
> ↓  
> NORMALIZE RESPONSE  
> ├─ success → domain result  
> ├─ transient failure → controlled retry  
> ├─ permanent failure → typed error  
> └─ unavailable → fallback / FAILED state  
> ↓  
> LOG + METRIC + TRACE

## 9.45 Como o Harness governa mudanças de API

No ASES-300, uma alteração de API deve ser tratada como alteração potencialmente pública. Antes de modificar contrato, o agente carrega API-INTEGRATIONS, OpenAPI/AsyncAPI, consumidores conhecidos, REQs e ADRs. Depois classifica a mudança como compatível ou potencialmente incompatível. Mudanças compatíveis seguem o ciclo normal; mudanças incompatíveis exigem estratégia explícita.

O Harness pode executar schema diff, typecheck de clientes gerados, contract tests, integração, segurança e regressão. Se um campo removido ainda aparece em contrato de consumidor, o requisito não pode receber PASS. Se a mudança exige nova versão, a documentação e o período de depreciação tornam-se parte da implementação.

Uma regra importante é que o agente não deve “corrigir” contract tests alterando a expectativa do consumidor sem compreender a razão. Teste de contrato representa uma dependência; modificá-lo apenas para obter verde seria uma forma de falso DONE.

## 9.46 Exemplo completo — exportação segura no CRUD hierárquico

Considere \`POST /v1/exports\`. O usuário envia filtros, colunas desejadas e formato. A API autentica, valida schema, verifica capability EXPORT e calcula quais colunas são simultaneamente solicitadas e autorizadas. Em vez de gerar arquivo diretamente na requisição, cria \`ExportJob\` com snapshot dos parâmetros autorizados. Um worker executa a consulta dentro do mesmo escopo e produz o arquivo. O download posterior exige nova autorização.

Se o usuário solicitar \`salary\` sem READ nesse campo, há duas políticas possíveis: rejeitar toda exportação ou remover a coluna. DOMAIN e REQ devem escolher uma. O agente não decide isso sozinho. O teste precisa provar que o arquivo nunca contém o dado proibido.

> REQ-34X — Exportação respeita field-level authorization  
>   
> GIVEN usuário com EXPORT em RECORD  
> AND READ em name, course, status  
> AND sem READ em salary  
> WHEN solicita XLSX com name, status, salary  
> THEN a política definida pelo domínio é aplicada  
> AND salary jamais aparece no arquivo  
> AND o evento de exportação é auditado  
>   
> Verification:  
> - API integration test  
> - XLSX content assertion  
> - authorization test  
> - audit assertion

## 9.47 Exemplo completo — integração de IA no sistema de matrizes

Considere \`POST /v1/equivalence-analyses\`. O endpoint não deve retornar uma “equivalência aprovada”. Ele cria uma análise. O serviço recupera disciplinas e versões corretas, prepara evidências, chama o provider de IA por adapter e valida a resposta estruturada. O resultado é \`SimilaritySuggestion\`, com score, evidências, provider, modelo e versão do prompt. Uma operação separada, protegida por autoridade acadêmica, registra \`EquivalenceDecision\`.

Se o provider falhar, a API pode manter análise em FAILED_RETRYABLE ou permitir reprocessamento. Se a resposta não cumprir schema, ela não deve ser persistida como decisão. Se houver fallback, apenas providers previamente aprovados podem receber os dados.

Essa arquitetura preserva a distinção DOMAIN já estabelecida: inferência não é autoridade. API torna essa distinção visível aos consumidores.

## 9.48 Checklist de qualidade de API & Integrations

1\. Cada endpoint representa uma capacidade compreensível do domínio?

2\. O contrato possui fonte de verdade versionada?

3\. Entradas são validadas antes de chegar ao domínio?

4\. Autenticação e autorização estão documentadas separadamente?

5\. Existe autorização por objeto, escopo e campo quando necessária?

6\. Respostas evitam expor campos internos ou sensíveis?

7\. Erros possuem códigos estáveis e request ID?

8\. Listagens possuem paginação e limites?

9\. Filtros e ordenação usam allowlists?

10\. Operações repetíveis possuem estratégia de idempotência?

11\. Breaking changes são detectadas?

12\. Existe política de depreciação?

13\. Consumidores conhecidos estão registrados?

14\. Integrações externas possuem timeout?

15\. Retry ocorre apenas quando seguro?

16\. Existe limite de tentativas?

17\. Circuit breaker/fallback é usado apenas quando justificado?

18\. Rate limiting protege operações relevantes?

19\. Webhooks possuem assinatura e event ID?

20\. Eventos assíncronos possuem schema e política de compatibilidade?

21\. Uploads são validados e isolados?

22\. Downloads revalidam autorização?

23\. Exportações reutilizam políticas de leitura?

24\. OpenAPI/AsyncAPI participa do pipeline?

25\. Contract tests cobrem fronteiras críticas?

26\. Testes cobrem falhas, não apenas 2xx?

27\. APIs de IA registram provider/model/prompt version quando aplicável?

28\. Dados sensíveis não são enviados a integrações não aprovadas?

29\. Métricas e tracing permitem localizar falhas?

30\. O Harness impede alteração silenciosa de contrato?

## 9.49 Exercício orientado

Escolha três casos de uso do seu produto e transforme-os em contratos de API. Para cada operação, defina método, path, propósito, schema de entrada, autenticação, autorização, respostas e erros. Em seguida, classifique quais operações precisam ser idempotentes. Escolha uma integração externa e documente timeout, retry, fallback, autenticação e dados transmitidos. Proponha pelo menos um contract test e um teste de autorização por objeto. Por fim, faça uma alteração hipotética no schema e classifique se é compatível, breaking ou semanticamente perigosa. O exercício está completo quando outra equipe consegue implementar um consumidor sem precisar ler o código do provedor.

## 9.50 Conclusão

API & INTEGRATIONS é a camada na qual fronteiras arquiteturais tornam-se promessas executáveis. Uma API de qualidade não é apenas funcional: ela possui semântica consistente, schemas claros, erros previsíveis, segurança, limites, compatibilidade e mecanismos de evolução. Integrações externas adicionam incerteza e precisam ser tratadas com timeout, idempotência, retry criterioso, observabilidade e isolamento.

Para o ASES-300, contratos possuem valor especial porque podem ser verificados. OpenAPI, AsyncAPI, contract tests, schema validation e testes de autorização transformam grande parte da comunicação entre sistemas em evidência automatizada. O Harness pode detectar quando implementação diverge do contrato e impedir release.

O próximo capítulo será dedicado a AUTH & AUTHORIZATION. Nele aprofundaremos identidade, sessões, autenticação, RBAC, ABAC, scopes, hierarquias, permissões por recurso, registro e coluna, deny-by-default, delegação, impersonation, service accounts, segurança de exportação e, principalmente, como transformar autorização em uma policy verificável e central, em vez de espalhá-la por componentes e endpoints.

## 9.51 Referências utilizadas neste capítulo — registro provisório

As referências serão consolidadas no Capítulo 25 — Referências. Mantêm-se aqui provisoriamente para conferência e rastreabilidade. Foram priorizados trabalhos recentes, acesso aberto e fontes técnicas primárias ou institucionais.

BOGNER, Justus; KOTSTEIN, Sebastian; PFAFF, Timo. Do RESTful API design rules have an impact on the understandability of Web APIs? **Empirical Software Engineering**, v. 28, art. 132, 2023. Disponível em: https://doi.org/10.1007/s10664-023-10367-y. Acesso em: 20 set. 2026.

EHSAN, Adeel; ABUHALIQA, Mohammed Ahmad M. E.; CATAL, Cagatay; MISHRA, Deepti. RESTful API Testing Methodologies: Rationale, Challenges, and Solution Directions. **Applied Sciences**, v. 12, n. 9, art. 4369, 2022. Disponível em: https://doi.org/10.3390/app12094369. Acesso em: 20 set. 2026.

GOMEZ, Alejandro; VESEY, Alex. On the Design, Development, and Testing of Modern APIs. Pittsburgh: Software Engineering Institute, Carnegie Mellon University, 2024. Disponível em: https://insights.sei.cmu.edu/library/on-the-design-development-and-testing-of-modern-apis/. Acesso em: 20 set. 2026.

LAMOTHE, Maxime; GUÉHÉNEUC, Yann-Gaël; SHANG, Weiyi. A Systematic Review of API Evolution Literature. **ACM Computing Surveys**, v. 54, n. 8, art. 171, p. 1-36, 2021. Disponível em: https://doi.org/10.1145/3470133. Acesso em: 20 set. 2026.

SCHWARZ, Georg-Daniel. Ensuring Syntactic Interoperability Using Consumer-Driven Contract Testing. **Software Testing, Verification and Reliability**, v. 35, n. 5, e70006, 2025. Disponível em: https://doi.org/10.1002/stvr.70006. Acesso em: 20 set. 2026.

ZIMMERMANN, Olaf; STOCKER, Mirko; LÜBBKE, Daniel; PLOCHER, Christian; UZDILLI, Kadir. Conformance assessment of Architectural Design Decisions on API endpoint designs derived from domain models. **Journal of Systems and Software**, v. 193, art. 111433, 2022. Disponível em: https://doi.org/10.1016/j.jss.2022.111433. Acesso em: 20 set. 2026.

# CAPÍTULO 10 — AUTH & AUTHORIZATION: IDENTIDADE, PAPÉIS, ATRIBUTOS E POLÍTICAS VERIFICÁVEIS

Autenticação e autorização determinam quem pode entrar no sistema e, principalmente, o que cada identidade pode fazer depois de entrar. No ASES-300, essa camada é tratada como parte simultaneamente funcional, arquitetural e de segurança: permissões precisam representar o domínio, ser aplicadas no backend e produzir evidências verificáveis.

## 10.1 Autenticação não é autorização

Autenticação estabelece identidade; autorização decide ações permitidas. Confundir as duas produz o erro clássico de proteger uma rota com login e presumir que qualquer usuário autenticado pode acessar qualquer objeto. O ASES-300 exige que a decisão considere sujeito, ação, recurso e contexto.

Identidade pode vir de credenciais locais, OIDC, OAuth, SSO ou outro provedor. A aplicação deve reduzir a identidade externa a um principal interno estável e evitar espalhar detalhes do fornecedor por todo o domínio.

## 10.2 Sessões, tokens e ciclo de vida

Sessões precisam possuir criação, expiração, revogação e proteção contra roubo. Tokens de acesso devem ter escopo e duração compatíveis com risco; refresh tokens exigem proteção adicional. Logout efetivo precisa invalidar ou tornar inútil a credencial conforme a arquitetura adotada.

O Harness deve testar expiração, revogação e tentativa de reutilização quando esses comportamentos forem críticos.

## 10.3 RBAC: autorização baseada em papéis

RBAC associa permissões a papéis e papéis a usuários. É adequado quando responsabilidades organizacionais são relativamente estáveis. \`ADMIN\`, \`GESTOR\` e \`ANALISTA\` podem ser papéis, mas o nome do papel não deve substituir a definição das capacidades.

Papéis gigantes e universais criam privilégio excessivo. O ASES-300 prefere capacidades explícitas, como \`RECORD:READ\`, \`RECORD:UPDATE\` e \`EXPORT:CREATE\`, agrupadas por papéis.

## 10.4 ABAC: atributos e contexto

ABAC decide acesso a partir de atributos do sujeito, recurso, ação e ambiente. É útil quando a regra depende de unidade, propriedade, estado, horário ou classificação. O CRUD hierárquico é exemplo típico: um gestor pode ler registros da própria unidade, mas não de outra.

RBAC e ABAC podem coexistir. Papel concede capacidade geral; atributos restringem o escopo concreto.

## 10.5 Escopo organizacional

Organizações, unidades, equipes e relações de subordinação precisam ser conceitos explícitos. Uma policy não deve reconstruir hierarquia por convenções de string. Mudanças de unidade precisam produzir efeito previsível sobre acesso.

Escopo também se aplica a exportações, relatórios, buscas e contagens. Um dashboard que conta registros fora do escopo ainda vaza informação.

## 10.6 Permissão por recurso, registro e coluna

O ASES-300 distingue autorização por recurso, por registro e por campo. Um usuário pode ler \`Record\`, somente registros da unidade A e, dentro deles, apenas \`name\`, \`course\` e \`status\`. Essas três dimensões devem ser aplicadas antes da resposta sair do backend.

Field-level authorization é especialmente importante em APIs e exportações. O frontend nunca é a fronteira de segurança.

## 10.7 Deny-by-default

Quando não existe regra explícita permitindo uma ação, a decisão segura é negar. Esse princípio reduz o risco de novos endpoints ou recursos nascerem públicos por omissão.

Policies devem retornar decisões tipadas e, quando apropriado, motivo auditável sem revelar informação sensível ao usuário final.

## 10.8 Delegação, impersonation e contas de serviço

Delegação temporária precisa registrar concedente, recebedor, escopo e validade. Impersonation administrativa é capacidade de alto risco e deve ser claramente sinalizada, auditada e limitada. Service accounts não são usuários humanos: precisam de credenciais, scopes e rotação próprios.

Agentes de IA que executam ferramentas também devem possuir identidade e privilégios mínimos, evitando usar credenciais administrativas genéricas.

## 10.9 Matriz de autorização

Uma matriz \`Papel × Recurso × Ação × Escopo\` é útil para revisão humana, mas não substitui policies executáveis. A documentação explica; o código decide; os testes provam.

Casos negativos são essenciais: testar apenas que o administrador consegue editar não prova que o analista é impedido.

## 10.10 Testes de autorização

REQ-204 exige testes específicos. Devem existir cenários de acesso permitido, negado, mudança de escopo, objeto inexistente, campo proibido e tentativa de acesso por ID direto.

Uma suíte de autorização pode ser gerada a partir da matriz de policies e executada pelo Harness em cada mudança relevante.

## 10.11 Template de AUTH-AUTHORIZATION.md

O documento deve registrar provedores de identidade, ciclo de sessão, papéis, capabilities, atributos, hierarquias, policies, exceções, service accounts, delegação, auditoria e testes. Cada policy crítica deve apontar para REQs e arquivos de teste.

## 10.12 Conclusão

Autorização confiável é uma propriedade transversal. O sistema não deve possuir uma policy na tela, outra na API e uma terceira no exportador. O ASES-300 procura uma fonte central de decisão, reutilizada por todas as interfaces e continuamente testada.

O capítulo seguinte trata de UX/UI: como transformar capacidades e restrições do produto em interação compreensível, acessível e coerente.

# CAPÍTULO 11 — UX/UI: INTERAÇÃO, ACESSIBILIDADE E FLUXOS QUE REPRESENTAM O DOMÍNIO

UX/UI no ASES-300 não é uma camada decorativa adicionada ao final. A interface é onde regras, estados e capacidades tornam-se compreensíveis para pessoas. Uma boa experiência reduz ambiguidade, previne erros e torna visíveis as consequências das ações.

## 11.1 UX começa na jornada, não no componente

Antes de escolher cards, tabelas ou modais, descreva o objetivo do usuário e a sequência necessária para alcançá-lo. Uma jornada de importação, por exemplo, inclui selecionar arquivo, validar, revisar erros, confirmar e acompanhar processamento.

Componentes são consequência do fluxo. Começar por um dashboard genérico frequentemente produz interface visualmente correta, mas pouco relacionada ao trabalho real.

## 11.2 Hierarquia visual e ações

Ações primárias precisam ser evidentes; ações destrutivas devem ser diferenciadas e confirmadas. Informações mais importantes recebem prioridade visual. Densidade deve refletir o domínio: um sistema administrativo pode precisar de tabelas densas sem sacrificar legibilidade.

Consistência reduz aprendizagem: botões equivalentes, mensagens equivalentes e padrões de navegação equivalentes devem se comportar da mesma maneira.

## 11.3 Estados completos

Toda tela relevante precisa considerar loading, skeleton quando adequado, vazio, erro, sucesso, sem permissão e dados parciais. O caminho feliz é apenas um dos estados.

Empty state deve explicar por que não há conteúdo e qual ação faz sentido. Error state deve orientar recuperação sem expor detalhes internos.

## 11.4 Formulários

Labels explícitos, validação próxima ao campo, mensagens compreensíveis e preservação de dados após erro são princípios básicos. Campos condicionais precisam aparecer quando a regra exigir, sem criar surpresas.

Validação no frontend melhora experiência; validação no backend preserva integridade. Uma não substitui a outra.

## 11.5 Tabelas e CRUDs densos

Tabelas podem suportar redimensionamento, reordenação, ocultação, fixação, filtros e views salvas quando essas capacidades ajudam tarefas reais. Cada recurso adicional deve justificar complexidade.

Permissões precisam refletir-se na interface, mas ocultar botão não é segurança. A UI comunica capacidade; o backend aplica a policy.

## 11.6 Acessibilidade

Acessibilidade inclui teclado, foco, contraste, labels, semântica, leitores de tela e mensagens de erro. WCAG deve orientar requisitos verificáveis, não apenas declaração de intenção.

Automação detecta parte dos problemas; revisão manual continua necessária para fluxo de teclado, compreensão e uso real.

## 11.7 Responsividade

Responsividade não significa comprimir desktop no celular. Fluxos densos podem precisar de adaptação, drawers, cards ou prioridade de colunas. Breakpoints devem ser testados com conteúdo real.

Se o produto é explicitamente desktop-only por restrição de negócio, isso deve ser documentado em vez de fingir suporte.

## 11.8 Design system

Tokens de tipografia, espaçamento, radius, estados e componentes reduzem divergência. Um design system pequeno e coerente é preferível a dezenas de componentes quase iguais.

Agentes devem reutilizar componentes existentes antes de criar novos. O Harness pode procurar duplicações e violações de tokens.

## 11.9 Evitar a interface genérica de IA

Aplicações geradas por LLM tendem a repetir dashboards com cards, gradientes e gráficos decorativos. REQ-170 existe para combater esse padrão. O layout deve emergir das tarefas do domínio.

Um observatório pode precisar de visualizações; um CRUD operacional pode precisar principalmente de tabela, filtros e edição rápida. A estética deve servir ao trabalho.

## 11.10 UX verificável

Critérios de aceite podem descrever fluxo, acessibilidade, estados e tempo para feedback. Evals visuais podem complementar testes funcionais, mas não devem substituir revisão humana quando julgamento é necessário.

Screenshot regression é útil para mudanças inesperadas, desde que não se transforme em aprovação automática de qualquer diferença.

## 11.11 Conclusão

UX/UI converte domínio em interação. No ASES-300, interface deve ser funcional, acessível, consistente e verificável, sem esconder regras críticas em convenções visuais.

O próximo capítulo aprofunda SECURITY & PRIVACY, consolidando defesa em profundidade, LGPD, threat modeling e controles verificáveis.

# CAPÍTULO 12 — SECURITY & PRIVACY: DEFESA EM PROFUNDIDADE, LGPD E CONTROLES VERIFICÁVEIS

Segurança no ASES-300 é uma propriedade do sistema inteiro. Não existe um único mecanismo capaz de proteger aplicação, dados, usuários e integrações. A estratégia combina prevenção, detecção, limitação de impacto e recuperação.

## 12.1 Threat modeling

Threat modeling identifica ativos, fronteiras de confiança, agentes de ameaça, caminhos de ataque e controles. O objetivo é priorizar riscos reais antes de escolher mecanismos.

Diagramas arquiteturais ajudam a localizar entradas, integrações e dados sensíveis. Mudanças estruturais relevantes devem provocar revisão de ameaças.

## 12.2 Validação de entrada

Toda entrada externa é não confiável: HTTP, arquivo, webhook, mensagem, resultado de ferramenta e resposta de LLM. Validação estrutural e semântica deve ocorrer na fronteira.

Validação reduz SQL injection, XSS, path traversal, mass assignment e corrupção de dados, mas cada ameaça exige controles específicos.

## 12.3 OWASP e classes de vulnerabilidade

SQL Injection é mitigada por queries parametrizadas e ORM corretamente usado; XSS por escaping contextual e políticas adequadas; CSRF por mecanismos compatíveis com o modelo de sessão; SSRF exige controle de destinos e rede.

O ASES-300 usa checklists de segurança como referência, mas converte riscos relevantes em REQs e testes do produto.

## 12.4 Secrets

Secrets não pertencem ao repositório, logs ou frontend. Devem usar secret stores/bindings, rotação e escopo mínimo. Ambientes diferentes usam credenciais diferentes.

Scanner de secrets deve integrar o Harness. Um vazamento encontrado precisa ser tratado como comprometimento potencial, não apenas removido do commit atual.

## 12.5 Criptografia

HTTPS protege transporte. Dados em repouso podem exigir criptografia adicional conforme sensibilidade e plataforma. Senhas devem usar funções de hashing apropriadas, nunca criptografia reversível.

Chaves possuem ciclo de vida próprio: geração, armazenamento, rotação e revogação.

## 12.6 LGPD e minimização

A LGPD exige finalidade, adequação, necessidade e outros princípios. O ASES-300 traduz isso em inventário de dados, finalidade, base aplicável, retenção, acesso e descarte. Coletar menos reduz risco.

Logs e ambientes de teste também entram no problema. Copiar dados pessoais de produção para desenvolvimento sem controles pode criar nova exposição.

## 12.7 Retenção e exclusão

Retenção deve possuir regra por categoria. Soft delete não equivale a eliminação legal. Quando a finalidade termina, pode ser necessário anonimizar ou excluir conforme obrigação e política.

Backups complicam exclusão; a estratégia precisa documentar como dados removidos deixam de reaparecer após restore.

## 12.8 Segurança de dependências

Dependências introduzem código e cadeia de suprimentos. Inventário, lockfiles, atualização e análise de vulnerabilidades são necessários. Dependência crítica abandonada deve gerar risco registrado.

Agentes não devem adicionar bibliotecas sem necessidade e avaliação mínima.

## 12.9 Headers, CORS e CSP

Headers de segurança reduzem classes de ataque no navegador. CORS deve permitir origens necessárias, não usar wildcard por conveniência quando credenciais estão envolvidas. CSP pode limitar execução e carregamento de conteúdo.

Esses controles devem ser testados no ambiente implantado.

## 12.10 Logs seguros

Logs precisam apoiar investigação sem registrar senha, token, secret ou conteúdo pessoal desnecessário. Redaction deve ser central.

Auditoria registra ações relevantes; observabilidade registra comportamento técnico. Ambas precisam de política de acesso.

## 12.11 Incident readiness

Segurança inclui capacidade de responder. Contatos, classificação, contenção, rotação, evidências e comunicação precisam de procedimento proporcional ao produto.

Backups, restore e logs são parte da recuperação, não apenas operações.

## 12.12 Security gates

Release deve falhar diante de vulnerabilidades críticas conhecidas, secrets, endpoints sem autorização ou testes críticos quebrados. Exceções precisam de aceite de risco explícito.

Agentes não podem enfraquecer controles ou desativar scanners para obter build verde.

## 12.13 Conclusão

Segurança madura é governança contínua. O Harness transforma parte dessa governança em verificações automáticas e reserva decisões de risco para humanos autorizados.

O próximo capítulo trata de AI: onde modelos probabilísticos entram, como limitar sua autoridade e como avaliá-los.

# CAPÍTULO 13 — AI: MODELOS, RAG, TOOLS, GUARDRAILS E FRONTEIRAS ENTRE INFERÊNCIA E REGRA

O ASES-300 considera IA uma capacidade condicional. Um produto não deve receber LLM, embeddings ou agentes apenas por modernidade. Quando a IA resolve uma necessidade real, ela precisa ser encapsulada, avaliada, observável e subordinada às regras determinísticas do domínio.

## 13.1 Quando usar e quando não usar

LLMs são úteis em linguagem, classificação ambígua, extração, sumarização, geração e raciocínio aproximado. Não são a melhor escolha para somas, autorização, regras legais determinísticas ou consultas que o banco resolve diretamente.

REQ-186 e REQ-187 exigem justificativa e separação entre inferência e regra.

## 13.2 Provider abstraction

Uma camada de provider reduz lock-in e centraliza autenticação, timeout, custo e telemetria. A abstração deve preservar capacidades importantes em vez de fingir que todos os modelos são idênticos.

Modelo e versão devem ser configuráveis e registráveis quando afetam resultados.

## 13.3 Prompt versioning

Prompts são parte da implementação. Alterá-los pode mudar comportamento tanto quanto código. Versão, propósito, variáveis e Evals relacionados devem ser rastreados.

Prompts críticos não devem ficar espalhados em strings anônimas.

## 13.4 Saída estruturada

Quando resultado alimenta software, schemas reduzem ambiguidade. A resposta deve ser validada antes de persistência ou ação. Falha de schema é falha controlada, não convite para parsing improvisado.

Mesmo JSON válido pode conter decisão incorreta; validação estrutural não substitui Eval.

## 13.5 RAG

RAG separa conhecimento recuperado da geração. Pipeline inclui ingestão, chunking, embeddings, retrieval, reranking, montagem de contexto e resposta. Cada etapa deve possuir métricas e proveniência.

RAG é CONDITIONAL. Se a informação já está estruturada no banco, consulta determinística pode ser melhor.

## 13.6 Proveniência

Respostas baseadas em documentos precisam apontar para fonte, versão e trecho quando o caso exige auditabilidade. Isso é especialmente importante em educação, jurídico e regulatório.

Proveniência permite investigar erro e reprocessar após atualização do corpus.

## 13.7 Tool use

Ferramentas ampliam o agente do texto para ação. Cada tool deve possuir schema, autorização, escopo e efeitos conhecidos. Ferramentas destrutivas exigem gates.

Tool output também é entrada não confiável e precisa de validação.

## 13.8 Human-in-the-loop

Human-in-the-loop não é sinônimo de colocar um botão de aprovar em tudo. O gate deve existir onde erro possui impacto, ambiguidade ou autoridade humana necessária.

No sistema de matrizes, IA sugere similaridade; autoridade acadêmica decide equivalência.

## 13.9 Guardrails

Guardrails combinam restrições de entrada, saída, tools, policies, sandbox e Evals. Nenhum guardrail isolado garante segurança.

O Harness deve impedir que o agente desative guardrails para concluir tarefa.

## 13.10 Custos e latência

Tokens, chamadas, embeddings e retrieval possuem custo. Cache, modelos menores e roteamento podem reduzir gasto, mas precisam preservar qualidade requerida.

Métricas de custo devem ser associadas a funcionalidades, não apenas ao total mensal.

## 13.11 Fallback

Fallback pode trocar modelo, usar regra determinística ou solicitar revisão humana. Precisa ser explicitamente permitido. Enviar dados para provider alternativo sem avaliação de privacidade é proibido.

Falha de IA deve degradar de maneira conhecida quando possível.

## 13.12 AI Evals

Evals precisam de dataset, rubrica, métricas, baseline e critérios de aprovação. Casos difíceis e regressões conhecidas devem permanecer no conjunto.

Uma única demonstração convincente não prova qualidade. Evals repetíveis transformam comportamento probabilístico em decisão de engenharia.

## 13.13 Conclusão

IA entra no ASES-300 como subsistema governado, não como núcleo mágico. Sua utilidade cresce quando o domínio separa claramente sugestão, evidência, regra e autoridade.

O Capítulo 14 detalha TESTING & EVALS e transforma requisitos em mecanismos de prova.

# CAPÍTULO 14 — TESTING & EVALS: COMO PROVAR QUE O SISTEMA SATISFAZ A ESPECIFICAÇÃO

Testar não significa apenas executar uma suíte. O objetivo é produzir evidência suficiente de que requisitos e propriedades críticas permanecem verdadeiros. O ASES-300 combina testes determinísticos, Evals e verificações humanas conforme a natureza da obrigação.

## 14.1 Teste como evidência

Cada teste deve responder a uma hipótese. Um teste verde sem relação com requisito pode ser útil, mas não prova cobertura da SPEC. Rastreabilidade liga REQ, teste e evidência.

Testes frágeis que verificam detalhes internos demais podem impedir refatoração sem aumentar confiança.

## 14.2 Unitários

Testes unitários dão feedback rápido sobre regras isoladas. São ideais para invariantes, parsers, policies e funções determinísticas.

Mocks devem representar fronteiras, não esconder comportamento que deveria ser integrado.

## 14.3 Integração

Testes de integração verificam colaboração entre módulos, banco, adapters ou contratos. Migrations, repositories e autorização frequentemente precisam desse nível.

Ambientes descartáveis reduzem interferência entre execuções.

## 14.4 E2E

E2E prova jornadas críticas através da aplicação. É mais caro e lento; por isso deve focar caminhos de alto valor e risco.

Não é necessário transformar cada regra em E2E se níveis inferiores já a provam melhor.

## 14.5 Segurança e autorização

Testes negativos são obrigatórios para boundaries. Tentar acesso proibido, manipular IDs, campos e payloads demonstra que controles realmente funcionam.

Security scanning complementa testes específicos.

## 14.6 Performance

Performance tests precisam de cenário, carga, dados e métrica. Médias escondem caudas; percentis e throughput são úteis.

Benchmark sem ambiente descrito não é evidência reproduzível.

## 14.7 Acessibilidade

Automação pode detectar semântica, contraste e atributos; revisão manual cobre navegação e compreensão. Critérios WCAG relevantes devem estar associados a REQs.

Evidência pode incluir relatório automatizado e checklist humano.

## 14.8 Evals de IA

Evals medem propriedades como factualidade, aderência, recuperação, classificação e segurança. Rubricas podem exigir julgamento humano ou LLM-as-judge calibrado.

LLM-as-judge não deve ser tratado como verdade absoluta; amostras humanas ajudam a validar a métrica.

## 14.9 Regressão

Todo bug relevante corrigido deve considerar teste de regressão. O objetivo é transformar conhecimento de falha em proteção futura.

Regressão também se aplica a prompts e modelos.

## 14.10 Smoke tests

Smoke tests verificam rapidamente se deploy iniciou, endpoints básicos respondem e dependências essenciais estão disponíveis.

Eles não substituem suíte completa, mas reduzem tempo para detectar falha grosseira.

## 14.11 Ordem de feedback

O Harness executa verificações baratas primeiro: typecheck, lint e testes relacionados; depois integração, E2E e suites amplas conforme risco. Essa ordem reduz custo de loops.

Release gate executa o conjunto necessário para decisão final.

## 14.12 Flaky tests

Teste intermitente corrói confiança. Quarentena temporária pode existir, mas precisa de prazo e owner. Ignorar flakiness indefinidamente transforma vermelho em ruído.

O agente não pode simplesmente rerodar até ficar verde sem registrar instabilidade.

## 14.13 Conclusão

Testing & Evals são o mecanismo que converte SPEC em evidência. O próximo capítulo trata de OBSERVABILITY, permitindo verificar o sistema durante execução real.

# CAPÍTULO 15 — OBSERVABILITY: LOGS, MÉTRICAS, TRACES E EVIDÊNCIA OPERACIONAL

Observabilidade permite inferir o estado interno do sistema a partir de sinais externos. No ASES-300, ela serve tanto à operação quanto à verificação: falhas precisam ser localizáveis, integrações mensuráveis e decisões críticas auditáveis.

## 15.1 Logs estruturados

Logs estruturados usam campos previsíveis em vez de texto livre. Timestamp, level, service, requestId, operation e errorCode facilitam busca e correlação.

Dados sensíveis devem ser redigidos antes do sink.

## 15.2 Níveis de log

DEBUG, INFO, WARN e ERROR precisam de convenção. Se tudo é ERROR, alertas perdem valor; se falhas desaparecem em DEBUG, investigação falha.

Ambientes podem variar verbosidade sem mudar semântica.

## 15.3 Request ID e correlação

Um identificador propagado entre frontend, API, worker e integração permite reconstruir jornada. Em sistemas distribuídos, trace IDs cumprem papel semelhante.

Auditoria pode referenciar request ID sem misturar os dois tipos de registro.

## 15.4 Métricas

Throughput, latência, erros e saturação formam base operacional. Métricas de negócio e IA complementam quando necessárias.

Cardinalidade precisa ser controlada; usar userId como label pode explodir custo.

## 15.5 Tracing

Tracing mostra spans de uma operação através de componentes. É útil em integrações, filas e IA. OpenTelemetry fornece modelo aberto para instrumentação.

Nem todo sistema precisa de tracing distribuído completo; a decisão depende da arquitetura.

## 15.6 Health checks

Liveness indica processo vivo; readiness indica capacidade de servir. Verificar apenas que a porta abriu pode ser insuficiente.

Health checks não devem executar operações caras ou vazar detalhes.

## 15.7 Alertas

Alertas devem corresponder a condição acionável. Alertar cada erro individual gera fadiga. SLOs e tendências ajudam a definir gatilhos.

Cada alerta crítico precisa de owner e procedimento.

## 15.8 Observabilidade de IA

Registrar provider, modelo, prompt version, latência, tokens, retrieval e resultado de Eval ajuda diagnóstico. Conteúdo sensível deve seguir política.

Uma cadeia user→request→retrieval→model→tool→result pode ser correlacionada sem registrar dados desnecessários.

## 15.9 Auditoria versus observabilidade

Observabilidade explica comportamento técnico; auditoria prova ações relevantes. Um log de aplicação pode expirar em dias; um evento de auditoria pode exigir retenção maior.

Separar finalidades melhora segurança e governança.

## 15.10 Evidência operacional

Alguns REQs só podem ser confirmados em ambiente real, como disponibilidade. Dashboards e relatórios podem servir como evidência quando métrica e janela são definidas.

O Harness pode coletar resultados de smoke e health checks após deploy.

## 15.11 Conclusão

Observabilidade fecha parte do ciclo de feedback entre implementação e operação. O próximo capítulo trata de DEPLOYMENT e da passagem segura entre ambientes.

# CAPÍTULO 16 — DEPLOYMENT: AMBIENTES, CI/CD, MIGRATIONS, ROLLBACK E RELEASE CONTROLADO

Deploy é a transformação de um estado verificado do repositório em software executando em um ambiente. O ASES-300 trata essa transformação como processo reproduzível, auditável e reversível quando possível.

## 16.1 Ambientes

Development, test/staging e production devem possuir configurações e dados apropriados. Segredos e recursos não devem ser compartilhados sem necessidade.

Paridade razoável reduz surpresas, mas custo e risco podem justificar diferenças documentadas.

## 16.2 CI

Continuous Integration executa typecheck, lint, testes, scans e build a cada mudança relevante. O objetivo é detectar incompatibilidades cedo.

Pipeline é parte do Harness e deve ser versionado.

## 16.3 CD

Continuous Delivery mantém artefato pronto; Continuous Deployment pode publicar automaticamente quando gates passam. O nível de automação depende do risco.

Produção crítica pode exigir aprovação humana mesmo com pipeline verde.

## 16.4 Artefatos imutáveis

O mesmo artefato verificado deve avançar entre ambientes quando possível. Rebuild diferente em produção reduz rastreabilidade.

Versão deve apontar para commit e requisitos verificados.

## 16.5 Migrations

Migrations precisam ser aplicadas em ordem, com compatibilidade entre versão antiga e nova quando deploy não é atômico. Expand-and-contract reduz risco.

Migration destrutiva exige backup, plano e gate.

## 16.6 Feature flags

Flags separam deploy de release. São úteis para rollout e rollback lógico, mas criam estados adicionais. Flags antigas devem ser removidas.

Permissões não devem depender de flag insegura.

## 16.7 Rollback

Rollback de código pode ser simples; rollback de dados pode não ser. Estratégia precisa considerar migrations e eventos produzidos.

Quando reversão é impossível, roll-forward controlado pode ser preferível.

## 16.8 Canary e gradual rollout

Rollout gradual reduz blast radius. Métricas determinam continuidade. Nem todo projeto precisa dessa complexidade.

Critérios de abortar precisam ser definidos antes.

## 16.9 Cloudflare e serverless

Em projetos Cloudflare, Pages/Workers, D1, KV, R2 e Queues possuem ciclos e limites próprios. Bindings e secrets devem ser definidos por ambiente.

Deploy scripts devem verificar migrations, bindings e smoke tests.

## 16.10 Pós-deploy

Após produção, smoke tests, health, métricas e erros confirmam estado. Release só é encerrado quando verificação pós-deploy passa.

Falha pós-deploy deve acionar rollback ou procedimento definido.

## 16.11 Conclusão

Deployment conecta evidência prévia à realidade operacional. O Capítulo 17 define RULES: leis operacionais que agentes não podem negociar.

# CAPÍTULO 17 — RULES: AS LEIS OPERACIONAIS DO DESENVOLVIMENTO ORIENTADO A AGENTES

RULES.md contém restrições estáveis que protegem o projeto contra atalhos locais. Enquanto REQUIREMENTS dizem o que o produto deve satisfazer, RULES dizem como o agente não pode corromper o processo para chegar ao resultado.

## 17.1 Regra não é requisito de produto

\`Não remover testes para fazê-los passar\` é regra de trabalho, não funcionalidade entregue ao usuário. Essa distinção evita poluir o catálogo de requisitos com governança operacional.

Regras devem ser poucas, claras e de alta autoridade.

## 17.2 Não adaptar a SPEC ao código

Quando implementação diverge do requisito, o agente não pode editar o requisito apenas para declarar sucesso. Mudança de SPEC exige processo de decisão.

Essa regra combate falso DONE.

## 17.3 Não remover teste para obter verde

Teste falhando é informação. Pode estar incorreto, mas a correção exige demonstrar por quê. Apagar ou enfraquecer asserção sem análise é proibido.

O Harness pode detectar redução suspeita de cobertura.

## 17.4 Não introduzir mock em produção

Mocks pertencem a testes ou demonstrações explicitamente marcadas. Uma funcionalidade visível não pode responder com dados fictícios como se estivesse concluída.

REQ-017 e RULES reforçam a mesma proteção em níveis diferentes.

## 17.5 Não enfraquecer segurança

Agente não pode tornar endpoint público, ampliar CORS, remover validação ou conceder admin para resolver erro.

Quando o requisito entra em conflito com controle de segurança, deve parar e escalar.

## 17.6 Não alterar arquitetura silenciosamente

Novos serviços, bancos, frameworks ou fronteiras exigem justificativa e, quando significativo, ADR.

Refatorações locais permanecem permitidas dentro das fronteiras.

## 17.7 Não esconder erro

\`catch {}\` vazio, retorno genérico ou desativação de warning não resolve causa. Erros precisam ser tratados, propagados ou registrados adequadamente.

Self-audit procura padrões de erro ignorado.

## 17.8 Não adicionar dependência sem necessidade

Dependências possuem custo de segurança e manutenção. Antes de instalar, verificar se capacidade já existe ou é trivial de implementar com segurança.

Bibliotecas críticas exigem avaliação maior.

## 17.9 Não declarar DONE sem evidência

DONE exige implementação, teste, verificação do aceite e registro de evidência. Linguagem otimista do agente não altera estado.

Essa é uma das regras constitutivas do ASES-300.

## 17.10 Precedência

Conflitos devem obedecer hierarquia definida no MASTER-SPEC: segurança e decisões humanas autorizadas prevalecem; SPEC e ADRs possuem autoridade definida; Skills não podem contradizer Rules.

Quando conflito permanece ambíguo, o estado correto é BLOCKED.

## 17.11 Conclusão

RULES protegem integridade do processo. O capítulo seguinte mostra SKILLS: procedimentos reutilizáveis que ensinam ao agente como executar categorias de trabalho.

# CAPÍTULO 18 — SKILLS: CONHECIMENTO PROCEDIMENTAL REUTILIZÁVEL PARA AGENTES

Skills representam o 'como fazemos aqui'. Elas reduzem improvisação e tornam procedimentos repetíveis entre agentes, sessões e projetos. Uma Skill não substitui SPEC: ela descreve um método de execução.

## 18.1 Skill versus prompt

Prompt pode instruir uma tarefa pontual. Skill é procedimento reutilizável, versionado e contextualizado. \`crie endpoint\` é pedido; \`create-api-endpoint.md\` descreve passos, padrões e verificações.

Skills reduzem necessidade de repetir instruções longas.

## 18.2 Anatomia de uma Skill

Uma Skill deve conter propósito, pré-condições, entradas, passos, arquivos esperados, verificações, erros comuns e condição de saída.

Ela pode apontar para scripts e templates.

## 18.3 Skills de implementação

Exemplos incluem criar entidade, migration, endpoint, página React, policy, importação e job. Cada uma referencia arquitetura e regras.

Skill não pode assumir detalhes de domínio que variam por produto.

## 18.4 Skills de revisão

Security review, accessibility review, architecture review e test review podem ser Skills. Elas transformam conhecimento especializado em checklist operacional.

Resultados devem produzir achados e evidências.

## 18.5 Skills de deploy

Uma Skill de deploy define build, migrations, secrets, smoke e rollback. Isso reduz comandos improvisados.

Ambiente e permissões continuam governados por Rules.

## 18.6 Versionamento

Skills evoluem. Mudanças importantes precisam de versão ou histórico para explicar por que execuções antigas diferem.

Uma Skill quebrada pode afetar muitos requisitos, portanto merece testes quando automatizável.

## 18.7 Skill e autonomia

Quanto mais bem definida a Skill, maior a autonomia segura do agente em tarefas repetitivas. Tarefas inéditas ou de alto risco podem exigir plano humano.

Autonomia é consequência de contexto e verificabilidade, não de confiança abstrata.

## 18.8 Biblioteca de Skills ASES-300

Uma biblioteca inicial pode conter \`create-api-endpoint\`, \`create-database-entity\`, \`create-migration\`, \`create-permission\`, \`write-tests\`, \`security-review\`, \`accessibility-review\` e \`deploy-cloudflare\`.

Projetos adicionam Skills específicas quando procedimentos se repetem.

## 18.9 Conclusão

Skills capturam procedimento; Rules capturam limites; SPEC captura obrigação. O Capítulo 19 integra tudo isso no HARNESS.

# CAPÍTULO 19 — HARNESS: O LOOP OPERACIONAL QUE TRANSFORMA AGENTES EM PROCESSO DE ENGENHARIA

O Harness é o coração operacional do ASES-300. Ele carrega contexto, seleciona trabalho, aplica regras, executa verificações, registra evidência e impede que a narrativa do agente substitua o estado real do projeto.

## 19.1 O loop

O ciclo básico é START → LOAD STATUS → READ SPEC/RULES/ADRs → SELECT ELIGIBLE REQ → PLAN → IMPLEMENT → TYPECHECK → LINT → TEST → EVAL → ACCEPTANCE → RECORD EVIDENCE → UPDATE STATUS.

Falha retorna ao ciclo com correção ou replanejamento. Bloqueio interrompe autonomia e registra causa.

## 19.2 Seleção do próximo requisito

Requisito elegível está PENDING, possui dependências satisfeitas e prioridade compatível. O Harness não deve começar item bloqueado por fundação ausente.

Seleção pode considerar risco e agrupamento técnico, mas não ignorar prioridades críticas.

## 19.3 Carregamento de contexto

Carregar tudo sempre desperdiça janela e aumenta ruído. O Harness recupera PRODUCT/DOMAIN, REQ, arquitetura, ADRs, Skills e arquivos relacionados.

Context engineering torna contexto um recurso planejado.

## 19.4 Plano

Antes de mudanças não triviais, o agente descreve arquivos, passos, testes e riscos. O plano não precisa ser burocrático para alteração simples.

Se o plano exige decisão arquitetural não autorizada, a tarefa bloqueia.

## 19.5 Implementação incremental

Pequenos incrementos reduzem superfície de erro e facilitam feedback. Depois de cada bloco coerente, verificações baratas podem rodar.

Grandes reescritas sem checkpoints são desencorajadas.

## 19.6 Feedback em camadas

Typecheck e lint primeiro; testes direcionados depois; regressão ampla e E2E quando necessário. Segurança e Evals entram conforme REQ.

Essa ordem otimiza custo sem reduzir gate final.

## 19.7 Retry e limite

Correção automática pode repetir algumas vezes. Falhas idênticas recorrentes indicam necessidade de replanejar ou pedir ajuda.

Loops infinitos desperdiçam recursos e escondem bloqueio.

## 19.8 Evidência

Evidência pode ser resultado de teste, relatório, screenshot, migration aplicada, schema diff ou aprovação humana. Precisa ser vinculada ao requisito.

Mensagem 'funciona' não é evidência.

## 19.9 Multiagentes

Múltiplos agentes podem especializar implementação, revisão e teste, mas precisam de estado compartilhado e ownership. Paralelismo sem coordenação cria conflitos.

Um agente revisor deve trabalhar contra critérios, não apenas opinião.

## 19.10 Sandbox

Execução experimental deve ocorrer em ambiente onde erro não destrua produção. Banco descartável, branch e credenciais limitadas aumentam autonomia segura.

Ferramentas destrutivas exigem autorização explícita.

## 19.11 Gates humanos

Arquitetura significativa, migration destrutiva, mudança de segurança, decisão de domínio e release crítico podem exigir aprovação. O Harness precisa saber exatamente onde parar.

Human-in-the-loop deve ser evento definido, não interrupção aleatória.

## 19.12 Comando único

Um objetivo operacional é \`npm run verify\` ou equivalente, encadeando verificações principais. O comando reduz discrepância entre agente local e CI.

Release-check pode agregar traceability e DoD.

## 19.13 Conclusão

O Harness transforma uma coleção de documentos em sistema operacional de engenharia. Os capítulos seguintes tratam da memória e da prova que sustentam esse loop: TRACEABILITY, STATUS e ADR.

# CAPÍTULO 20 — TRACEABILITY: DO REQUISITO À IMPLEMENTAÇÃO, TESTE, EVIDÊNCIA E RELEASE

Rastreabilidade responde de onde veio uma obrigação, onde foi implementada, como foi verificada e qual evidência sustenta seu estado. Sem isso, porcentagens de conclusão são narrativas; com isso, tornam-se auditáveis.

## 20.1 IDs estáveis

Cada requisito possui ID único. O título pode melhorar; o significado não deve mudar silenciosamente. IDs permitem referências entre documentos, código e testes.

Requisitos removidos devem manter histórico em vez de renumerar catálogo inteiro.

## 20.2 Matriz de rastreabilidade

Uma matriz mínima contém REQ, origem, prioridade, dependências, implementação, testes, status e evidência. Pode ser YAML processável em vez de planilha manual.

Ferramentas podem detectar REQ sem teste ou teste sem requisito.

## 20.3 Rastreabilidade vertical

PRODUCT → DOMAIN → REQ → ARCHITECTURE → CODE → TEST → EVIDENCE cria cadeia vertical. Nem todo item precisa apontar para todos os níveis, mas decisões críticas devem ser explicáveis.

Isso ajuda análise de impacto.

## 20.4 Rastreabilidade horizontal

Requisitos dependem de outros requisitos. Uma exportação segura depende de autorização e filtros. Dependências formam grafo.

Status PASS não deve ser permitido se dependência crítica está FAIL.

## 20.5 Evidência versionada

Evidência precisa estar associada à versão do código. Um teste verde de commit antigo não prova commit atual.

CI pode registrar commit SHA e artefatos.

## 20.6 Percentual verificável

Percentual de conclusão deve contar estados conforme regra explícita. N/A justificado pode sair do denominador ou ser tratado conforme governança definida.

CRITICAL e HIGH devem ser apresentados separadamente para evitar que muitos itens LOW escondam risco.

## 20.7 Impact analysis

Quando REQ muda, rastreabilidade identifica módulos e testes afetados. Quando módulo muda, identifica obrigações que precisam ser revalidadas.

Essa bidirecionalidade é uma das maiores vantagens do modelo.

## 20.8 Automação

\`traceability.yaml\` pode ser validado por script. Arquivos inexistentes, testes ausentes e IDs duplicados fazem verificação falhar.

Rastreabilidade deixa de ser documento decorativo.

## 20.9 Conclusão

Traceability torna o projeto auditável. STATUS, no próximo capítulo, transforma esse grafo em memória operacional do momento atual.

# CAPÍTULO 21 — STATUS: MEMÓRIA OPERACIONAL ENTRE SESSÕES, AGENTES E EQUIPES

STATUS.md é a memória curta do projeto. Ele responde onde estamos agora, o que acabou de ser comprovado, o que está em andamento, o que vem depois e quais bloqueios impedem avanço.

## 21.1 Por que STATUS existe

Agentes possuem contexto limitado e sessões terminam. Confiar em memória conversacional cria perda de continuidade. STATUS externaliza o estado essencial.

Ele não substitui histórico do Git nem traceability; resume o presente.

## 21.2 Conteúdo mínimo

Versão, último REQ verificado, REQ atual, próximos, bloqueios, falhas críticas, totais por status, commit verificado e ADRs relevantes formam núcleo.

Informação precisa ser atualizada pelo Harness após transições.

## 21.3 Estado oficial

PENDING, IN_PROGRESS, PASS, FAIL, BLOCKED e N/A são estados controlados. Comentários livres podem explicar, mas não substituir estado.

Somente evidência permite PASS.

## 21.4 Handoff

Uma nova sessão começa lendo STATUS e os artefatos relacionados ao item atual. Isso reduz reexploração.

Handoff bom registra decisões temporárias e comandos necessários, sem duplicar documentação permanente.

## 21.5 Bloqueios

BLOCKED precisa de causa, dependência, responsável e próxima ação quando conhecidos. Um bloqueio sem descrição vira limbo.

Quando resolvido, volta ao fluxo normal.

## 21.6 Métricas

Contagens por prioridade e estado ajudam visualizar progresso. Percentual não deve ser usado como único indicador.

Um projeto 95% concluído pode continuar não liberável se 5% incluem requisito crítico.

## 21.7 Conclusão

STATUS preserva continuidade operacional. ADR, no próximo capítulo, preserva continuidade das decisões.

# CAPÍTULO 22 — ADR: MEMÓRIA DAS DECISÕES ARQUITETURAIS E SUAS CONSEQUÊNCIAS

Architecture Decision Records registram decisões significativas que o código mostra, mas não explica. Seu objetivo é evitar que equipes e agentes redescubram debates ou revertam escolhas sem compreender contexto.

## 22.1 Quando criar ADR

Use ADR para decisões com impacto estrutural ou difícil reversão: banco, arquitetura, autenticação, mensageria, provider crítico, estratégia de autorização.

Não use para cada nome de função.

## 22.2 Estrutura

Contexto explica problema e forças; alternativas mostram opções consideradas; decisão registra escolha; consequências reconhecem ganhos e custos; status informa proposta, aceita, substituída ou rejeitada.

Um ADR honesto registra desvantagens.

## 22.3 ADR não é eternidade

Decisões podem ser substituídas. Novo ADR referencia o anterior e explica mudança de contexto.

Editar o passado para parecer que sempre soubemos a resposta destrói valor histórico.

## 22.4 ADR e agentes

Antes de alterar área estrutural, agente carrega ADRs relacionados. Se a solução contradiz decisão ativa, precisa propor substituição ou bloquear.

Isso impede refatorações que parecem locais, mas quebram estratégia.

## 22.5 ADR e requisitos

ADRs devem apontar para drivers e REQs. Uma escolha de D1 pode decorrer de custo, Cloudflare e volume; uma policy central decorre de requisitos de autorização.

Essa ligação reduz arquitetura por preferência.

## 22.6 Template

Um template simples com ID, título, status, data, contexto, opções, decisão, consequências, REQs e substituições é suficiente.

ADRs devem ficar no repositório e participar de review.

## 22.7 Conclusão

ADR preserva o porquê. O Capítulo 23 reúne todas as provas no DEFINITION OF DONE e define quando o sistema pode ser chamado de concluído.

# CAPÍTULO 23 — DEFINITION OF DONE: O GATE QUE IMPEDE O FALSO CONCLUÍDO

Definition of Done é a condição objetiva para declarar uma unidade de trabalho ou release concluída. No ASES-300, DONE não é sentimento, porcentagem visual ou frase do agente: é resultado de critérios e evidências.

## 23.1 Implementado não é DONE

Uma feature pode existir e falhar em autorização, acessibilidade, build ou regressão. IMPLEMENTED descreve código presente; DONE descreve estado verificado.

A fórmula central é IMPLEMENTED + TESTED + VERIFIED + ACCEPTANCE PASSED = DONE.

## 23.2 DoD por requisito

Cada REQ possui aceite e verificação. PASS só ocorre quando ambos são satisfeitos. Se não se aplica, N/A exige justificativa.

FAIL e BLOCKED são estados legítimos e preferíveis a PASS falso.

## 23.3 DoD de release

REQ-281 a REQ-300 definem gate global: críticos e altos 100%, build, typecheck, lint, testes, segurança, permissões, import/export, auditoria, backup/restore, documentação e ausência de mocks/TODOs críticos.

Projetos podem adicionar gates de domínio.

## 23.4 Evidência

Cada gate aponta para artefato: log CI, relatório, teste, aprovação, restore realizado. Evidência deve ser atual.

Checklist marcado manualmente sem prova é insuficiente para itens automatizáveis.

## 23.5 Exceções

Waivers podem existir quando risco é conscientemente aceito por autoridade definida. Devem possuir justificativa, prazo e impacto.

Agente não concede waiver a si mesmo.

## 23.6 Release authorization

REQ-300 significa que o Harness calcula e apresenta estado, mas autorização pode incluir gate humano conforme produto. Nenhum release ocorre enquanto gate obrigatório falha.

Esse mecanismo encerra o ciclo iniciado em PRODUCT.

## 23.7 Conclusão

O ASES-300 agora possui sua cadeia completa: problema, domínio, requisitos, arquitetura, implementação, testes, evidência, rastreabilidade e release. O Capítulo 24 apresenta o catálogo consolidado dos 300 requisitos gerais.

# CAPÍTULO 24 — CATÁLOGO ASES-300: OS 300 REQUISITOS GERAIS EXPLICADOS

Este capítulo consolida o núcleo reutilizável do ASES-300. Os requisitos são gerais: não substituem os requisitos específicos do produto, que começam em REQ-301. Cada item apresenta uma explicação didática, sua importância, aplicabilidade e uma forma mínima de aceite. A classificação sugerida pode ser ajustada por governança, mas requisitos CORE somente devem receber N/A em situação excepcional e explicitamente aprovada.

Estados oficiais: PENDING significa ainda não concluído; IN_PROGRESS indica trabalho em curso; PASS exige evidência; FAIL indica verificação realizada e não satisfeita; BLOCKED indica obrigação aplicável impedida por dependência; N/A significa conscientemente não aplicável e sempre exige justificativa.

## 24.3 IDENTIDADE, CONTEXTO E OBJETIVOS DO PRODUTO

### REQ-001 — Nome oficial do sistema

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Define o nome oficial que deve aparecer de forma consistente na documentação, metadados e interfaces relevantes. Evita que o mesmo produto seja chamado por nomes diferentes ao longo do repositório.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que nome oficial do sistema está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-002 — Descrição resumida

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Descrição resumida como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que descrição resumida está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-003 — Problema central

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Problema central como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que problema central está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-004 — Público-alvo

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Público-alvo como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que público-alvo está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-005 — Perfis de usuários

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Perfis de usuários como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que perfis de usuários está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-006 — Objetivo principal

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Objetivo principal como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que objetivo principal está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-007 — Objetivos secundários

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Objetivos secundários como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que objetivos secundários está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-008 — Escopo obrigatório

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Escopo obrigatório como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que escopo obrigatório está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-009 — Fora do escopo

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Fora do escopo como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que fora do escopo está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-010 — Restrições técnicas

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Restrições técnicas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que restrições técnicas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-011 — Restrições financeiras

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Restrições financeiras como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que restrições financeiras está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-012 — Ambiente de implantação

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Ambiente de implantação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que ambiente de implantação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-013 — Plataformas suportadas

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Plataformas suportadas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que plataformas suportadas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-014 — Idioma e localização

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Idioma e localização como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que idioma e localização está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-015 — Critério global de conclusão

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Define as condições objetivas que permitem afirmar que o produto, ou a versão em análise, atingiu o estado global de conclusão. É a ponte inicial para a Definition of Done.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que critério global de conclusão está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

## 24.4 PRINCÍPIOS OBRIGATÓRIOS DE DESENVOLVIMENTO

### REQ-016 — Funcionalidades reais

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Funcionalidades reais como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que funcionalidades reais está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-017 — Proibição de mocks em produção

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Proíbe dados ou comportamentos simulados em produção quando apresentados como funcionalidade real. Mocks continuam permitidos em testes e ambientes explicitamente demonstrativos.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que proibição de mocks em produção está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-018 — Nenhum botão sem ação

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Nenhum botão sem ação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que nenhum botão sem ação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-019 — Nenhuma rota quebrada

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Nenhuma rota quebrada como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que nenhuma rota quebrada está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-020 — APIs funcionais

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate APIs funcionais como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que apis funcionais está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-021 — Proibição de dados hardcoded

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Impede que dados de negócio, usuários, permissões ou configurações que deveriam ser persistidos/configuráveis sejam codificados diretamente no código-fonte.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que proibição de dados hardcoded está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-022 — TypeScript Strict

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate TypeScript Strict como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que typescript strict está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-023 — Componentização

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Componentização como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que componentização está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-024 — Separação de responsabilidades

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Separação de responsabilidades como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que separação de responsabilidades está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-025 — Validação nas duas camadas

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Validação nas duas camadas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que validação nas duas camadas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-026 — Tratamento global de erros

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Tratamento global de erros como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que tratamento global de erros está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-027 — Loading states

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Loading states como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que loading states está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-028 — Empty states

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Empty states como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que empty states está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-029 — Error states

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Error states como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que error states está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-030 — Confirmação de ações destrutivas

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Confirmação de ações destrutivas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que confirmação de ações destrutivas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-031 — Feedback de operações

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Feedback de operações como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que feedback de operações está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-032 — Responsividade

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Responsividade como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que responsividade está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-033 — Acessibilidade

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Acessibilidade como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que acessibilidade está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-034 — Auditoria

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Exige trilha de auditoria para ações relevantes, permitindo responder quem fez o quê, quando e, quando necessário, sobre qual estado anterior.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que auditoria está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-035 — Documentação

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Documentação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que documentação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

## 24.5 ARQUITETURA TECNOLÓGICA

### REQ-036 — Framework frontend

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Framework frontend como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que framework frontend está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-037 — Linguagem principal

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Linguagem principal como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que linguagem principal está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-038 — Build system

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Build system como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que build system está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-039 — Framework backend

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Framework backend como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que framework backend está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-040 — Banco principal

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Banco principal como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que banco principal está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-041 — ORM

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate ORM como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que orm está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-042 — Migrations

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Migrations como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que migrations está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-043 — Cache

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Cache como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de cache, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-043 — Cache: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-044 — Armazenamento de arquivos

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Armazenamento de arquivos como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de armazenamento de arquivos, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-044 — Armazenamento de arquivos: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-045 — Filas

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Filas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de filas, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-045 — Filas: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-046 — Tarefas agendadas

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Tarefas agendadas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de tarefas agendadas, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-046 — Tarefas agendadas: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-047 — Variáveis de ambiente

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Variáveis de ambiente como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que variáveis de ambiente está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-048 — Secrets

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Exige que credenciais, tokens e chaves sejam armazenados em mecanismos próprios de secrets, nunca hardcoded, expostos ao cliente ou registrados em logs.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que secrets está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-049 — Ambientes separados

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Ambientes separados como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que ambientes separados está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-050 — API versionada

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate API versionada como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que api versionada está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-051 — Camada de domínio

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Camada de domínio como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que camada de domínio está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-052 — Repository Pattern

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Repository Pattern como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que repository pattern está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-053 — Services

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Services como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que services está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-054 — Schemas compartilhados

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Schemas compartilhados como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que schemas compartilhados está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-055 — Contratos da API

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Contratos da API como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que contratos da api está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-056 — Arquitetura modular

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Arquitetura modular como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que arquitetura modular está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-057 — Dependências justificadas

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Dependências justificadas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que dependências justificadas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-058 — Atualização de dependências

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Atualização de dependências como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que atualização de dependências está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-059 — Portabilidade

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Portabilidade como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que portabilidade está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-060 — Diagrama arquitetural

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Diagrama arquitetural como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que diagrama arquitetural está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

## 24.6 MODELAGEM E PERSISTÊNCIA DE DADOS

### REQ-061 — Identificador único

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Identificador único como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que identificador único está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-062 — Datas padronizadas

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Datas padronizadas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que datas padronizadas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-063 — Soft delete

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Define se e como registros são marcados como excluídos sem remoção física imediata, preservando histórico quando o domínio exigir. Não deve ser aplicado automaticamente a todo dado.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de soft delete, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-063 — Soft delete: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-064 — Integridade referencial

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Integridade referencial como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que integridade referencial está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-065 — Índices

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Índices como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que índices está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-066 — Restrições de unicidade

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Restrições de unicidade como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que restrições de unicidade está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-067 — Foreign keys

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Foreign keys como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que foreign keys está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-068 — Paginação

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Paginação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que paginação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-069 — Ordenação

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Ordenação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que ordenação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-070 — Versionamento de registros

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Versionamento de registros como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de versionamento de registros, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-070 — Versionamento de registros: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-071 — created_at

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate created_at como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que created_at está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-072 — updated_at

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate updated_at como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que updated_at está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-073 — created_by

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate created_by como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que created_by está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-074 — updated_by

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate updated_by como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que updated_by está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-075 — Status

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Status como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que status está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-076 — Schema documentado

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Schema documentado como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que schema documentado está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-077 — Dados obrigatórios

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Dados obrigatórios como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que dados obrigatórios está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-078 — Valores padrão

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Valores padrão como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que valores padrão está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-079 — Normalização

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Normalização como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que normalização está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-080 — Histórico

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Histórico como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de histórico, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-080 — Histórico: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-081 — Concorrência

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Define como o sistema lida com edições simultâneas, evitando sobrescrita silenciosa e estados inconsistentes por meio de locking, version columns ou outra estratégia.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que concorrência está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-082 — Transações

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Transações como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que transações está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-083 — Backup

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Exige estratégia de backup compatível com criticidade e perda de dados aceitável. Backup somente é válido se puder ser localizado, protegido e posteriormente restaurado.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de backup, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-083 — Backup: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-084 — Restauração

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Exige que o processo de restauração seja definido e testado. Possuir arquivo de backup sem prova de restore não satisfaz este requisito.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de restauração, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-084 — Restauração: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-085 — Seed

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Seed como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de seed, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-085 — Seed: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-086 — Dados de demonstração

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Dados de demonstração como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de dados de demonstração, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-086 — Dados de demonstração: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-087 — Importação

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Importação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de importação, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-087 — Importação: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-088 — Exportação

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Exportação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de exportação, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-088 — Exportação: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-089 — Limites de consulta

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Limites de consulta como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que limites de consulta está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-090 — Metadados

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Metadados como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que metadados está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

## 24.7 AUTENTICAÇÃO E AUTORIZAÇÃO

### REQ-091 — Identificação do usuário

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Identificação do usuário como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que identificação do usuário está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-092 — Login seguro

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Login seguro como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que login seguro está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-093 — Logout

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Logout como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que logout está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-094 — Sessões

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Sessões como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que sessões está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-095 — Recuperação de acesso

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Recuperação de acesso como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de recuperação de acesso, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-095 — Recuperação de acesso: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-096 — Bloqueio

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Bloqueio como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de bloqueio, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-096 — Bloqueio: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-097 — RBAC

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Exige autorização baseada em papéis quando papéis representam responsabilidades do produto. Papéis devem agrupar capacidades, não substituir policies específicas.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que rbac está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-098 — ABAC

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Exige autorização baseada em atributos quando a decisão depende de contexto, como unidade, proprietário, estado ou classificação. É CONDITIONAL quando RBAC simples é suficiente.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de abac, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-098 — ABAC: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-099 — Escopo organizacional

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Escopo organizacional como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que escopo organizacional está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-100 — Permissão por recurso

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Permissão por recurso como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que permissão por recurso está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-101 — CREATE

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate CREATE como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que create está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-102 — READ

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate READ como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que read está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-103 — UPDATE

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate UPDATE como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que update está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-104 — DELETE

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate DELETE como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que delete está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-105 — EXPORT

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate EXPORT como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que export está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-106 — IMPORT

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate IMPORT como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de import, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-106 — IMPORT: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-107 — APPROVE

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate APPROVE como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de approve, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-107 — APPROVE: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-108 — MANAGE

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate MANAGE como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que manage está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-109 — AUDIT

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate AUDIT como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que audit está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-110 — Permissão por registro

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Permissão por registro como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que permissão por registro está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-111 — Permissão por coluna

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Exige que campos sensíveis sejam filtrados de acordo com a permissão do usuário, inclusive em API, exportações e integrações; esconder a coluna apenas na interface não é suficiente.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que permissão por coluna está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-112 — Permissão de edição por coluna

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Permite que a capacidade de visualizar um campo seja diferente da capacidade de alterá-lo. A policy de escrita deve ser verificada separadamente da leitura.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que permissão de edição por coluna está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-113 — Segurança no backend

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Segurança no backend como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que segurança no backend está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-114 — Segurança de exportação

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Exige que exportações obedeçam exatamente aos mesmos limites de acesso aplicáveis às telas e APIs. Arquivos não podem se tornar caminho alternativo para vazamento.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que segurança de exportação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-115 — Privilégio mínimo

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Privilégio mínimo como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que privilégio mínimo está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

## 24.8 FUNCIONALIDADES DO CRUD

### REQ-116 — Listagem de registros

Classificação sugerida: DOMAIN/CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Listagem de registros como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL/DOMAIN — é obrigatório em produtos que ofereçam essa capacidade. Em sistemas sem esse fluxo, N/A é aceitável com justificativa.

Critério de aceite mínimo: Existe evidência objetiva de que listagem de registros está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-117 — Criação de registros

Classificação sugerida: DOMAIN/CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Criação de registros como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL/DOMAIN — é obrigatório em produtos que ofereçam essa capacidade. Em sistemas sem esse fluxo, N/A é aceitável com justificativa.

Critério de aceite mínimo: Existe evidência objetiva de que criação de registros está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-118 — Edição de registros

Classificação sugerida: DOMAIN/CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Edição de registros como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL/DOMAIN — é obrigatório em produtos que ofereçam essa capacidade. Em sistemas sem esse fluxo, N/A é aceitável com justificativa.

Critério de aceite mínimo: Existe evidência objetiva de que edição de registros está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-119 — Exclusão

Classificação sugerida: DOMAIN/CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Exclusão como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL/DOMAIN — é obrigatório em produtos que ofereçam essa capacidade. Em sistemas sem esse fluxo, N/A é aceitável com justificativa.

Critério de aceite mínimo: Existe evidência objetiva de que exclusão está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-120 — Busca textual

Classificação sugerida: DOMAIN/CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Busca textual como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL/DOMAIN — é obrigatório em produtos que ofereçam essa capacidade. Em sistemas sem esse fluxo, N/A é aceitável com justificativa.

Critério de aceite mínimo: Existe evidência objetiva de que busca textual está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-121 — Filtros

Classificação sugerida: DOMAIN/CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Filtros como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL/DOMAIN — é obrigatório em produtos que ofereçam essa capacidade. Em sistemas sem esse fluxo, N/A é aceitável com justificativa.

Critério de aceite mínimo: Existe evidência objetiva de que filtros está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-122 — Múltiplos filtros

Classificação sugerida: DOMAIN/CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Múltiplos filtros como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL/DOMAIN — é obrigatório em produtos que ofereçam essa capacidade. Em sistemas sem esse fluxo, N/A é aceitável com justificativa.

Critério de aceite mínimo: Existe evidência objetiva de que múltiplos filtros está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-123 — Ordenação

Classificação sugerida: DOMAIN/CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Ordenação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL/DOMAIN — é obrigatório em produtos que ofereçam essa capacidade. Em sistemas sem esse fluxo, N/A é aceitável com justificativa.

Critério de aceite mínimo: Existe evidência objetiva de que ordenação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-124 — Paginação

Classificação sugerida: DOMAIN/CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Paginação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL/DOMAIN — é obrigatório em produtos que ofereçam essa capacidade. Em sistemas sem esse fluxo, N/A é aceitável com justificativa.

Critério de aceite mínimo: Existe evidência objetiva de que paginação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-125 — Seleção múltipla

Classificação sugerida: DOMAIN/CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Seleção múltipla como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL/DOMAIN — é obrigatório em produtos que ofereçam essa capacidade. Em sistemas sem esse fluxo, N/A é aceitável com justificativa.

Critério de aceite mínimo: Existe evidência objetiva de que seleção múltipla está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-126 — Redimensionamento de colunas

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Redimensionamento de colunas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de redimensionamento de colunas, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-126 — Redimensionamento de colunas: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-127 — Reordenação de colunas

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Reordenação de colunas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de reordenação de colunas, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-127 — Reordenação de colunas: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-128 — Ocultação de colunas

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Ocultação de colunas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de ocultação de colunas, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-128 — Ocultação de colunas: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-129 — Fixação de colunas

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Fixação de colunas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de fixação de colunas, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-129 — Fixação de colunas: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-130 — Visualizações salvas

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Visualizações salvas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de visualizações salvas, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-130 — Visualizações salvas: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-131 — Formulário de criação

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Formulário de criação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de formulário de criação, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-131 — Formulário de criação: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-132 — Formulário de edição

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Formulário de edição como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de formulário de edição, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-132 — Formulário de edição: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-133 — Campos condicionais

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Campos condicionais como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de campos condicionais, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-133 — Campos condicionais: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-134 — Validação contextual

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Validação contextual como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de validação contextual, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-134 — Validação contextual: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-135 — Exportação CSV

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Exportação CSV como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de exportação csv, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-135 — Exportação CSV: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-136 — Exportação XLSX

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Exportação XLSX como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de exportação xlsx, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-136 — Exportação XLSX: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-137 — Exportação filtrada

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Exportação filtrada como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de exportação filtrada, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-137 — Exportação filtrada: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-138 — Importação CSV

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Importação CSV como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de importação csv, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-138 — Importação CSV: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-139 — Importação XLSX

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Importação XLSX como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de importação xlsx, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-139 — Importação XLSX: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-140 — Preview de importação

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Preview de importação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de preview de importação, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-140 — Preview de importação: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

## 24.9 LOGS E AUDITORIA

### REQ-141 — Log de autenticação

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Log de autenticação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que log de autenticação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-142 — Log de criação

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Log de criação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que log de criação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-143 — Log de alteração

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Log de alteração como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que log de alteração está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-144 — Estado anterior

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Estado anterior como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que estado anterior está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-145 — Estado posterior

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Estado posterior como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que estado posterior está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-146 — Log de exclusão

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Log de exclusão como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que log de exclusão está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-147 — Log de exportação

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Log de exportação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que log de exportação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-148 — Log de importação

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Log de importação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que log de importação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-149 — Request ID

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Request ID como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que request id está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-150 — Pesquisa nos logs

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Pesquisa nos logs como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que pesquisa nos logs está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

## 24.10 UX/UI

### REQ-151 — Hierarquia visual

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Hierarquia visual como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que hierarquia visual está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-152 — Navegação principal

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Navegação principal como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que navegação principal está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-153 — Sidebar

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Sidebar como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que sidebar está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-154 — Breadcrumb

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Breadcrumb como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que breadcrumb está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-155 — Dashboard

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Dashboard como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que dashboard está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-156 — Design consistente

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Design consistente como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que design consistente está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-157 — Design system

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Design system como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que design system está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-158 — Ações primárias

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Ações primárias como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que ações primárias está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-159 — Ações destrutivas

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Ações destrutivas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que ações destrutivas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-160 — Feedback imediato

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Feedback imediato como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que feedback imediato está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-161 — Skeleton

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Skeleton como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de skeleton, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-161 — Skeleton: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-162 — Toast

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Toast como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de toast, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-162 — Toast: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-163 — Modais

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Modais como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de modais, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-163 — Modais: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-164 — Navegação por teclado

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Navegação por teclado como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que navegação por teclado está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-165 — Contraste

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Contraste como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que contraste está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-166 — Estados de foco

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Estados de foco como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que estados de foco está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-167 — Labels

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Labels como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que labels está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-168 — Mensagens de validação

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Mensagens de validação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que mensagens de validação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-169 — Responsividade

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Responsividade como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que responsividade está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-170 — Evitar interface genérica de IA

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Impede que o agente substitua análise do domínio por layouts genéricos recorrentes de IA. A interface deve ser derivada das tarefas e jornadas reais.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que evitar interface genérica de ia está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

## 24.11 SEGURANÇA E PRIVACIDADE

### REQ-171 — HTTPS

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate HTTPS como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que https está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-172 — Validação de entrada

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Validação de entrada como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que validação de entrada está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-173 — SQL Injection

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate SQL Injection como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que sql injection está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-174 — XSS

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate XSS como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que xss está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-175 — CSRF

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate CSRF como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de csrf, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-175 — CSRF: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-176 — CORS

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate CORS como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que cors está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-177 — Rate limiting

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Rate limiting como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de rate limiting, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-177 — Rate limiting: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-178 — Secrets protegidos

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Secrets protegidos como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que secrets protegidos está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-179 — Dados mínimos

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Dados mínimos como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que dados mínimos está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-180 — Retenção

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Retenção como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de retenção, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-180 — Retenção: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-181 — LGPD

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Exige que tratamento de dados pessoais considere princípios e obrigações aplicáveis da LGPD, incluindo finalidade, necessidade, segurança, retenção e direitos quando pertinentes.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de lgpd, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-181 — LGPD: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-182 — Logs sem secrets

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Logs sem secrets como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que logs sem secrets está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-183 — Dependências vulneráveis

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Dependências vulneráveis como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que dependências vulneráveis está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-184 — Headers de segurança

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Headers de segurança como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que headers de segurança está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-185 — Segurança por padrão

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Segurança por padrão como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que segurança por padrão está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

## 24.12 IA, RAG E AUTOMAÇÃO

### REQ-186 — Uso justificado de IA

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Exige justificativa concreta para empregar IA. Se uma regra determinística ou consulta convencional resolve melhor o problema, IA não deve ser adicionada apenas por tendência.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de uso justificado de ia, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-186 — Uso justificado de IA: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-187 — Separação IA/regra determinística

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Separa resultados probabilísticos de regras determinísticas. Cálculos, autorização e invariantes não devem depender de LLM quando podem ser definidos diretamente.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de separação ia/regra determinística, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-187 — Separação IA/regra determinística: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-188 — Provider abstraction

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Provider abstraction como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de provider abstraction, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-188 — Provider abstraction: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-189 — Versionamento de prompts

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Versionamento de prompts como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de versionamento de prompts, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-189 — Versionamento de prompts: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-190 — RAG

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Exige arquitetura de Retrieval-Augmented Generation somente quando o produto realmente precisa recuperar conhecimento não estruturado. Caso contrário, deve ser N/A com justificativa.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de rag, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-190 — RAG: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-191 — Chunking

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Chunking como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de chunking, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-191 — Chunking: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-192 — Embeddings

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Embeddings como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de embeddings, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-192 — Embeddings: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-193 — Busca híbrida

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Busca híbrida como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de busca híbrida, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-193 — Busca híbrida: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-194 — Reranking

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Reranking como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de reranking, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-194 — Reranking: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-195 — Proveniência

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Proveniência como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de proveniência, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-195 — Proveniência: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-196 — Human-in-the-loop

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Exige revisão humana nos pontos em que impacto, autoridade ou incerteza tornam inadequada uma decisão totalmente automática.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de human-in-the-loop, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-196 — Human-in-the-loop: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-197 — Logs de IA

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Logs de IA como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de logs de ia, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-197 — Logs de IA: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-198 — Custos

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Custos como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de custos, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-198 — Custos: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-199 — Fallback

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Fallback como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de fallback, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-199 — Fallback: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-200 — Evals de IA

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Exige Evals repetíveis para funcionalidades de IA, com dataset, rubrica, métricas e critérios de aprovação suficientes para detectar regressões.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de evals de ia, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-200 — Evals de IA: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

## 24.13 TESTES E QUALIDADE

### REQ-201 — Testes unitários

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Testes unitários como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que testes unitários está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-202 — Testes de integração

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Testes de integração como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que testes de integração está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-203 — Testes E2E

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Testes E2E como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que testes e2e está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-204 — Testes de autorização

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Testes de autorização como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que testes de autorização está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-205 — Testes de exportação

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Testes de exportação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que testes de exportação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-206 — Testes de importação

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Testes de importação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que testes de importação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-207 — Testes de regressão

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Testes de regressão como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que testes de regressão está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-208 — Smoke tests

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Smoke tests como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que smoke tests está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-209 — Typecheck

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Typecheck como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que typecheck está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-210 — Lint

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Lint como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que lint está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-211 — Build

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Build como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que build está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-212 — Cobertura crítica

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Determina que cobertura de testes priorize risco e comportamento crítico, evitando transformar uma porcentagem arbitrária em objetivo que incentiva testes de baixo valor.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que cobertura crítica está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-213 — Testes de erro

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Testes de erro como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que testes de erro está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-214 — Testes de concorrência

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Testes de concorrência como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de testes de concorrência, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-214 — Testes de concorrência: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-215 — Testes de performance

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Testes de performance como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de testes de performance, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-215 — Testes de performance: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

## 24.14 OBSERVABILIDADE

### REQ-216 — Logs estruturados

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Logs estruturados como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que logs estruturados está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-217 — Níveis de log

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Níveis de log como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que níveis de log está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-218 — Correlação

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Correlação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que correlação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-219 — Métricas

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Métricas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que métricas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-220 — Erros rastreáveis

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Erros rastreáveis como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que erros rastreáveis está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-221 — Performance

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Performance como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que performance está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-222 — Health check

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Health check como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que health check está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-223 — Histórico operacional

Classificação sugerida: CORE. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Histórico operacional como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que histórico operacional está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-224 — Monitoramento de integrações

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Monitoramento de integrações como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de monitoramento de integrações, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-224 — Monitoramento de integrações: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-225 — Alertas

Classificação sugerida: CONDITIONAL. Prioridade sugerida: MEDIUM.

O que significa: Este requisito determina que o projeto trate Alertas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de alertas, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-225 — Alertas: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

## 24.15 HARNESS DO AGENTE DE DESENVOLVIMENTO

### REQ-226 — Leitura obrigatória da SPEC

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Obriga o agente a carregar a SPEC antes de executar trabalho relevante. Sem conhecer a obrigação, ele não pode avaliar corretamente se a implementação está concluída.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que leitura obrigatória da spec está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-227 — Leitura da arquitetura

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Leitura da arquitetura como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que leitura da arquitetura está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-228 — Consulta às regras

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Consulta às regras como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que consulta às regras está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-229 — Consulta ao estado atual

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Consulta ao estado atual como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que consulta ao estado atual está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-230 — Seleção do próximo requisito

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Seleção do próximo requisito como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que seleção do próximo requisito está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-231 — Verificação de dependências

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Verificação de dependências como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que verificação de dependências está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-232 — Plano antes da implementação

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Exige plano proporcional antes de alterações não triviais, identificando arquivos, dependências, verificações e riscos. Mudanças simples podem usar plano mínimo.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que plano antes da implementação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-233 — Implementação incremental

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Implementação incremental como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que implementação incremental está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-234 — Typecheck após implementação

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Typecheck após implementação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que typecheck após implementação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-235 — Lint após implementação

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Lint após implementação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que lint após implementação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-236 — Testes relacionados

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Testes relacionados como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que testes relacionados está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-237 — Regressão

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Regressão como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que regressão está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-238 — Verificação do critério de aceite

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Obriga o Harness a comparar o resultado com o critério de aceite do requisito; testes verdes que não cobrem o aceite não bastam.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que verificação do critério de aceite está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-239 — Correção automática

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Correção automática como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que correção automática está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-240 — Registro de conclusão

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Registro de conclusão como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que registro de conclusão está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-241 — Registro de falhas

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Registro de falhas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que registro de falhas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-242 — Registro de bloqueios

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Registro de bloqueios como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que registro de bloqueios está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-243 — Evidência de conclusão

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Exige prova vinculada ao PASS: teste, relatório, artefato, screenshot, aprovação ou outra evidência apropriada.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que evidência de conclusão está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-244 — Proibição de falso DONE

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Proíbe declarar conclusão com base apenas em implementação aparente. DONE só existe quando implementação, testes, aceite e evidência convergem.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que proibição de falso done está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-245 — Continuidade entre sessões

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Continuidade entre sessões como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que continuidade entre sessões está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

## 24.16 RASTREABILIDADE

### REQ-246 — ID único de requisito

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate ID único de requisito como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que id único de requisito está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-247 — Prioridade

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Prioridade como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que prioridade está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-248 — Dependências

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Dependências como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que dependências está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-249 — Arquivos relacionados

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Arquivos relacionados como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que arquivos relacionados está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-250 — Testes relacionados

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Testes relacionados como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que testes relacionados está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-251 — Status

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Padroniza estados em PENDING, IN_PROGRESS, PASS, FAIL, BLOCKED e N/A, evitando estados vagos como 'quase pronto'.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que status está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-252 — Evidência

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Evidência como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que evidência está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-253 — Matriz de rastreabilidade

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Matriz de rastreabilidade como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que matriz de rastreabilidade está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-254 — Percentual verificável

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Percentual verificável como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que percentual verificável está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-255 — Requisitos críticos

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Impede release final enquanto requisitos críticos permanecem FAIL ou PENDING. Criticidade prevalece sobre porcentagem geral.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que requisitos críticos está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

## 24.17 MEMÓRIA OPERACIONAL E ADR

### REQ-256 — STATUS.md

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate STATUS.md como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que status.md está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-257 — Último requisito concluído

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Último requisito concluído como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que último requisito concluído está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-258 — Requisito atual

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Requisito atual como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que requisito atual está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-259 — Próximos requisitos

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Próximos requisitos como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que próximos requisitos está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-260 — Bloqueios

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Bloqueios como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que bloqueios está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-261 — ADR

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate ADR como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que adr está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-262 — Contexto da decisão

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Contexto da decisão como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que contexto da decisão está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-263 — Alternativas

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Alternativas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que alternativas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-264 — Decisão

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Decisão como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que decisão está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-265 — Consequências

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Consequências como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que consequências está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

## 24.18 SELF-AUDIT

### REQ-266 — Procurar botões sem ação

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Procurar botões sem ação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar botões sem ação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-267 — Procurar rotas quebradas

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Procurar rotas quebradas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar rotas quebradas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-268 — Procurar TODO/FIXME

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Procurar TODO/FIXME como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar todo/fixme está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-269 — Procurar mocks

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Procurar mocks como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar mocks está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-270 — Procurar secrets

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Procurar secrets como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar secrets está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-271 — Procurar any

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Procurar any como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar any está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-272 — Procurar erros ignorados

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Procurar erros ignorados como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar erros ignorados está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-273 — Procurar endpoints sem autorização

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Procurar endpoints sem autorização como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar endpoints sem autorização está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-274 — Procurar endpoints sem validação

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Procurar endpoints sem validação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar endpoints sem validação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-275 — Procurar exposição de dados

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Procurar exposição de dados como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar exposição de dados está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-276 — Procurar código morto

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Procurar código morto como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar código morto está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-277 — Procurar duplicação

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Procurar duplicação como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar duplicação está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-278 — Procurar inconsistências de UX

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Procurar inconsistências de UX como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar inconsistências de ux está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-279 — Procurar problemas responsivos

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Procurar problemas responsivos como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que procurar problemas responsivos está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-280 — Auditoria final contra a SPEC

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Exige uma auditoria final sistemática comparando o estado do produto com a SPEC completa antes do release.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que auditoria final contra a spec está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

## 24.19 DEFINITION OF DONE E RELEASE

### REQ-281 — Critical = 100%

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Critical = 100% como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: A matriz de rastreabilidade demonstra Critical = 100% dos requisitos dessa prioridade em PASS ou N/A excepcionalmente aprovado quando permitido.

### REQ-282 — High = 100%

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate High = 100% como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: A matriz de rastreabilidade demonstra High = 100% dos requisitos dessa prioridade em PASS ou N/A excepcionalmente aprovado quando permitido.

### REQ-283 — Build aprovado

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Build aprovado como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: O pipeline registra build aprovado sem falhas para o commit candidato a release.

### REQ-284 — Typecheck aprovado

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Typecheck aprovado como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: O pipeline registra typecheck aprovado sem falhas para o commit candidato a release.

### REQ-285 — Lint aprovado

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Lint aprovado como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: O pipeline registra lint aprovado sem falhas para o commit candidato a release.

### REQ-286 — Unit tests aprovados

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Unit tests aprovados como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: O pipeline registra unit tests aprovados sem falhas para o commit candidato a release.

### REQ-287 — Integration tests aprovados

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Integration tests aprovados como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: O pipeline registra integration tests aprovados sem falhas para o commit candidato a release.

### REQ-288 — E2E crítico aprovado

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate E2E crítico aprovado como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: O pipeline registra e2e crítico aprovado sem falhas para o commit candidato a release.

### REQ-289 — Segurança aprovada

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Segurança aprovada como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que segurança aprovada está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-290 — Permissões aprovadas

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Permissões aprovadas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que permissões aprovadas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-291 — Exportação aprovada

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Exportação aprovada como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que exportação aprovada está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-292 — Importação aprovada

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Importação aprovada como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que importação aprovada está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-293 — Auditoria aprovada

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Auditoria aprovada como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que auditoria aprovada está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-294 — Backup verificado

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Exige evidência de que backups foram produzidos conforme política e podem ser localizados e validados.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de backup verificado, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-294 — Backup verificado: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-295 — Restore verificado

Classificação sugerida: CONDITIONAL. Prioridade sugerida: HIGH.

O que significa: Exige teste real de restauração conforme política. É o requisito que transforma backup de promessa em capacidade de recuperação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CONDITIONAL — aplique quando a capacidade existir ou quando o contexto a exigir. Se não houver aplicabilidade real, use N/A com justificativa explícita.

Critério de aceite mínimo: Quando aplicável, existe implementação/documentação de restore verificado, teste ou verificação correspondente e evidência; quando não aplicável, há justificativa N/A.

Exemplo de N/A: “REQ-295 — Restore verificado: N/A. O produto não possui a capacidade ou condição que torna este requisito aplicável nesta versão. Justificativa aprovada e registrada.”

### REQ-296 — Documentação atualizada

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Documentação atualizada como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que documentação atualizada está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-297 — Sem mocks indevidos

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Sem mocks indevidos como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que sem mocks indevidos está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-298 — Sem TODO crítico

Classificação sugerida: CORE. Prioridade sugerida: HIGH.

O que significa: Este requisito determina que o projeto trate Sem TODO crítico como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: Sua importância está em reduzir ambiguidade, comportamento inconsistente e decisões improvisadas durante implementação e manutenção.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que sem todo crítico está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-299 — Sem funcionalidades falsas

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Este requisito determina que o projeto trate Sem funcionalidades falsas como uma obrigação explícita, documentada e verificável, em vez de deixá-la implícita na implementação.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: Existe evidência objetiva de que sem funcionalidades falsas está definido e/ou implementado conforme a SPEC, com verificação proporcional ao risco.

### REQ-300 — Release autorizada pelo Harness

Classificação sugerida: CORE. Prioridade sugerida: CRITICAL.

O que significa: Define o gate final: somente o Harness, após verificar requisitos, testes, evidências e Definition of Done, pode apresentar o release como tecnicamente autorizado; gates humanos adicionais continuam possíveis.

Por que importa: É crítico porque uma falha aqui pode invalidar segurança, integridade, verificabilidade ou a própria declaração de conclusão.

Aplicabilidade: CORE — normalmente aplicável a qualquer projeto ASES-300; N/A somente em situação excepcional e justificada.

Critério de aceite mínimo: O release-check retorna PASS e não existem gates obrigatórios pendentes.

Ao final do catálogo, os requisitos específicos começam em REQ-301. Eles devem usar a mesma gramática: definição, prioridade, dependências, aceite, verificação, estado e evidência. Assim, um sistema pode ser ASES-300+37, ASES-300+120 ou ASES-300+300 sem alterar o núcleo geral.

# CAPÍTULO 25 — REFERÊNCIAS

As referências abaixo consolidam as fontes utilizadas ao longo da obra nesta versão do manuscrito. Foram priorizadas publicações recentes, fontes institucionais e materiais de acesso aberto. Na revisão editorial final, DOI, paginação, nomes completos e disponibilidade devem ser novamente conferidos antes da publicação.

ABOU ALI, Mohamad; DORNAIKA, Fadi; CHARAFEDDINE, Jinan. Agentic AI: a comprehensive survey of architectures, applications, and future directions. **Artificial Intelligence Review**, v. 59, art. 11, 2026. Disponível em: https://doi.org/10.1007/s10462-025-11422-4. Acesso em: 20 set. 2026.

AHMAD, Khlood; ABDELRAZEK, Mohamed; ARORA, Chetan; BANO, Muneera; GRUNDY, John. Requirements engineering for artificial intelligence systems: A systematic mapping study. **Information and Software Technology**, v. 158, art. 107176, 2023. Disponível em: https://doi.org/10.1016/j.infsof.2023.107176. Acesso em: 20 set. 2026.

ANTHROPIC. **Effective harnesses for long-running agents**. 2025. Disponível em: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents. Acesso em: 20 set. 2026.

BAMBAZEK, Peter; GROHER, Iris; SEYFF, Norbert. Requirements engineering for sustainable software systems: a systematic mapping study. **Requirements Engineering**, v. 28, p. 481-505, 2023. Disponível em: https://doi.org/10.1007/s00766-023-00402-1. Acesso em: 20 set. 2026.

BEN CHAABEN, Meriem; BURGUEÑO, Lola; DAVID, Istvan; SAHRAOUI, Houari. On the Utility of Domain Modeling Assistance with Large Language Models. arXiv, 2024. Disponível em: https://arxiv.org/abs/2410.12577. Acesso em: 20 set. 2026.

BJARNASON, Elizabeth; ÅBERG, Patrik; BIN ALI, Nauman. Software selection in large-scale software engineering: A model and criteria based on interactive rapid reviews. **Empirical Software Engineering**, v. 28, art. 51, 2023. Disponível em: https://doi.org/10.1007/s10664-023-10288-w. Acesso em: 20 set. 2026.

BOGNER, Justus; KOTSTEIN, Sebastian; PFAFF, Timo. Do RESTful API design rules have an impact on the understandability of Web APIs? **Empirical Software Engineering**, v. 28, art. 132, 2023. Disponível em: https://doi.org/10.1007/s10664-023-10367-y. Acesso em: 20 set. 2026.

BROWN, Simon. **The C4 model for visualising software architecture**. Disponível em: https://c4model.com/. Acesso em: 20 set. 2026.

BUCAIONI, Alessio; CICCHETTI, Antonio; CICCOZZI, Federico. Modelling in low-code development: a multi-vocal systematic review. **Software and Systems Modeling**, v. 21, p. 1959-1981, 2022. Disponível em: https://doi.org/10.1007/s10270-021-00964-0. Acesso em: 20 set. 2026.

BUCAIONI, Alessio; WEYSSOW, Martin; HE, Junda; LYU, Yunbo; LO, David. A Functional Software Reference Architecture for LLM-Integrated Systems. arXiv, 2025. Disponível em: https://arxiv.org/abs/2501.12904. Acesso em: 20 set. 2026.

EHSAN, Adeel; ABUHALIQA, Mohammed Ahmad M. E.; CATAL, Cagatay; MISHRA, Deepti. RESTful API Testing Methodologies: Rationale, Challenges, and Solution Directions. **Applied Sciences**, v. 12, n. 9, art. 4369, 2022. Disponível em: https://doi.org/10.3390/app12094369. Acesso em: 20 set. 2026.

GOMEZ, Alejandro; VESEY, Alex. **On the Design, Development, and Testing of Modern APIs**. Pittsburgh: Software Engineering Institute, Carnegie Mellon University, 2024. Disponível em: https://insights.sei.cmu.edu/library/on-the-design-development-and-testing-of-modern-apis/. Acesso em: 20 set. 2026.

HABIBA, Umm-e-; HAUG, Markus; BOGNER, Justus; WAGNER, Stefan et al. How mature is requirements engineering for AI-based systems? A systematic mapping study on practices, challenges, and future research directions. **Requirements Engineering**, v. 29, p. 567-600, 2024. Disponível em: https://doi.org/10.1007/s00766-024-00432-3. Acesso em: 20 set. 2026.

HE, Junda; TREUDE, Christoph; LO, David. LLM-Based Multi-Agent Systems for Software Engineering: Literature Review, Vision, and the Road Ahead. **ACM Transactions on Software Engineering and Methodology**, v. 34, n. 5, art. 124, 2025. Disponível em: https://doi.org/10.1145/3712003. Acesso em: 20 set. 2026.

HEMMAT, Ali; SHARBAF, Mehdi; KOLAHDouz-RAHIMI, Shekoufeh; LANO, Kevin; TEHRANI, Seyed Yasser. Research directions for using LLM in software requirement engineering: a systematic review. **Frontiers in Computer Science**, v. 7, art. 1519437, 2025. Disponível em: https://doi.org/10.3389/fcomp.2025.1519437. Acesso em: 20 set. 2026.

HUANG, Xu; LIU, Weiwen; CHEN, Xiaolong; WANG, Xingmei; WANG, Hao; LIAN, Defu; WANG, Yasheng; TANG, Ruiming; CHEN, Enhong. Understanding the planning of LLM agents: A survey. arXiv, 2024. Disponível em: https://arxiv.org/abs/2402.02716. Acesso em: 20 set. 2026.

JAHIĆ, Benjamin; GUELFI, Nicolas; RIES, Benoît. SEMKIS-DSL: A Domain-Specific Language to Support Requirements Engineering of Datasets and Neural Network Recognition. **Information**, v. 14, n. 4, art. 213, 2023. Disponível em: https://doi.org/10.3390/info14040213. Acesso em: 20 set. 2026.

KAUR, Kamaljit; KAUR, Parminder. The application of AI techniques in requirements classification: a systematic mapping. **Artificial Intelligence Review**, v. 57, art. 57, 2024. Disponível em: https://doi.org/10.1007/s10462-023-10667-1. Acesso em: 20 set. 2026.

LAMOTHE, Maxime; GUÉHÉNEUC, Yann-Gaël; SHANG, Weiyi. A Systematic Review of API Evolution Literature. **ACM Computing Surveys**, v. 54, n. 8, art. 171, p. 1-36, 2021. Disponível em: https://doi.org/10.1145/3470133. Acesso em: 20 set. 2026.

LI, Xinyi; WANG, Sai; ZENG, Siqi; WU, Yu; YANG, Yi. A survey on LLM-based multi-agent systems: workflow, infrastructure, and challenges. **Vicinagearth**, v. 1, art. 9, 2024. Disponível em: https://doi.org/10.1007/s44336-024-00009-2. Acesso em: 20 set. 2026.

MICROSOFT. Agent Harness. Microsoft Learn, 2026. Disponível em: https://learn.microsoft.com/agent-framework/agents/harness. Acesso em: 20 set. 2026.

MU, Fangwen; SHI, Lin; WANG, Song; YU, Zhuohao; ZHANG, Binquan; WANG, ChenXue; LIU, Shichao; WANG, Qing. ClarifyGPT: A Framework for Enhancing LLM-Based Code Generation via Requirements Clarification. **Proceedings of the ACM on Software Engineering**, v. 1, n. FSE, art. 103, p. 2332-2354, 2024. Disponível em: https://doi.org/10.1145/3660810. Acesso em: 20 set. 2026.

OLSSON, Thomas; SENTILLES, Séverine; PAPATHEOCHAROUS, Efi. A systematic literature review of empirical research on quality requirements. **Requirements Engineering**, v. 27, p. 249-271, 2022. Disponível em: https://doi.org/10.1007/s00766-022-00373-9. Acesso em: 20 set. 2026.

OPENAI. Harness engineering: leveraging Codex in an agent-first world. 2026. Disponível em: https://openai.com/index/harness-engineering/. Acesso em: 20 set. 2026.

PANTOJA YÉPEZ, Wilson Libardo; HURTADO ALEGRÍA, Julio Ariel; BANDI, Ajay; KIWELEKAR, Arvind W. et al. Training software architects suiting software industry needs: A literature review. **Education and Information Technologies**, v. 29, p. 10931-10994, 2024. Disponível em: https://doi.org/10.1007/s10639-023-12149-x. Acesso em: 20 set. 2026.

SALEEM, Summra; ASIM, Muhammad Nabeel; VAN ELST, Ludger; DENGEL, Andreas et al. Generative language models potential for requirement engineering applications: insights into current strengths and limitations. **Complex & Intelligent Systems**, v. 11, art. 278, 2025. Disponível em: https://doi.org/10.1007/s40747-024-01707-6. Acesso em: 20 set. 2026.

SCHMID, Larissa; HEY, Tobias; ARMBRUSTER, Martin; CORALLO, Sophie; FUCHß, Dominik; KEIM, Jan; LIU, Haoyu; KOZIOLEK, Anne. Software Architecture Meets LLMs: A Systematic Literature Review. arXiv, 2025. Disponível em: https://arxiv.org/abs/2505.16697. Acesso em: 20 set. 2026.

SCHWARZ, Georg-Daniel. Ensuring Syntactic Interoperability Using Consumer-Driven Contract Testing. **Software Testing, Verification and Reliability**, v. 35, n. 5, e70006, 2025. Disponível em: https://doi.org/10.1002/stvr.70006. Acesso em: 20 set. 2026.

SOAVI, Michele; ZENI, Nicola; MYLOPOULOS, John; MICH, Luisa; DUCATO, Rossana. From Legal Contracts to Formal Specifications: A Systematic Literature Review. **SN Computer Science**, v. 3, art. 298, 2022. Disponível em: https://doi.org/10.1007/s42979-022-01228-4. Acesso em: 20 set. 2026.

UMAR, Muhammad Aminu; LANO, Kevin. Advances in automated support for requirements engineering: a systematic literature review. **Requirements Engineering**, v. 29, p. 177-207, 2024. Disponível em: https://doi.org/10.1007/s00766-023-00411-0. Acesso em: 20 set. 2026.

WANG, Lei; MA, Chen; FENG, Xueyang; ZHANG, Zeyu; YANG, Hao; ZHANG, Jingsen; CHEN, Zhiyuan; TANG, Jiakai; CHEN, Xu; LIN, Yankai; ZHAO, Wayne Xin; WEI, Zhewei; WEN, Jirong. A survey on large language model based autonomous agents. **Frontiers of Computer Science**, v. 18, art. 186345, 2024. Disponível em: https://doi.org/10.1007/s11704-024-40231-1. Acesso em: 20 set. 2026.

XU, Weikai; HUANG, Chengrui; GAO, Shen; SHANG, Shuo. LLM-Based Agents for Tool Learning: A Survey. **Data Science and Engineering**, v. 10, p. 533-563, 2025. Disponível em: https://doi.org/10.1007/s41019-025-00296-9. Acesso em: 20 set. 2026.

YANG, John; JIMENEZ, Carlos E.; WETTIG, Alexander; LIERET, Kilian; YAO, Shunyu; NARASIMHAN, Karthik; PRESS, Ofir. SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering. **Advances in Neural Information Processing Systems**, v. 37, 2024. Disponível em: https://proceedings.neurips.cc/. Acesso em: 20 set. 2026.

ZHANG, Dawen; XU, Xiwei; WANG, Chen; XING, Zhenchang; MAO, Robert. A Layered Architecture for Developing and Enhancing Capabilities in Large Language Model-based Software Systems. arXiv, 2024. Disponível em: https://arxiv.org/abs/2411.12357. Acesso em: 20 set. 2026.

ZHANG, Zeyu; BO, Xiaohe; MA, Chen; LI, Rui; CHEN, Xu; DAI, Quanyu; ZHU, Jieming; DONG, Zhenhua; WEN, Jirong. A Survey on the Memory Mechanism of Large Language Model based Agents. arXiv, 2024. Disponível em: https://arxiv.org/abs/2404.13501. Acesso em: 20 set. 2026.

ZIMMERMANN, Olaf; STOCKER, Mirko; LÜBBKE, Daniel; PLOCHER, Christian; UZDILLI, Kadir. Conformance assessment of Architectural Design Decisions on API endpoint designs derived from domain models. **Journal of Systems and Software**, v. 193, art. 111433, 2022. Disponível em: https://doi.org/10.1016/j.jss.2022.111433. Acesso em: 20 set. 2026.

## 25.1 Nota editorial para a versão 1.0

Antes da publicação definitiva, recomenda-se uma revisão bibliográfica final, conferência de todos os nomes completos de autores, DOI, volumes, números, paginação e condição de acesso aberto; atualização automática do sumário no Microsoft Word; revisão ortográfica integral; normalização de tabelas e figuras; e validação cruzada entre os 300 requisitos, seus capítulos explicativos e os templates do método.

O ASES-300 é apresentado nesta obra como método proposto pelo autor, e não como norma técnica reconhecida externamente. Sua validação futura pode envolver estudos de caso, experimentos, avaliação por especialistas, aplicação em projetos reais e comparação com processos tradicionais de Engenharia de Software.
