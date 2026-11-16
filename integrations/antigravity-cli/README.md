# EUREKA42 ASES para Antigravity CLI

Plugin nativo para Google Antigravity CLI (`agy`). Empacota a Skill `ases-project-start`, o logo oficial do Eureka42 e um script local de boas-vindas. Não depende do pacote npm `ases` para exibir a marca.

## Requisitos

- Google Antigravity CLI instalado (`agy --version`).
- Node.js 22 ou posterior para o script local do logo.
- Um workspace Git com o repositório `eureka42-ai/ases-framework` clonado.

## Validar e instalar no Antigravity

Na raiz deste repositório:

```sh
agy plugin validate --strict ./integrations/antigravity-cli
agy plugin install ./integrations/antigravity-cli
agy plugin list
```

O comando de instalação registra o plugin no perfil local do Antigravity. Para removê-lo:

```sh
agy plugin uninstall eureka42-ases
```

## Iniciar um projeto

Abra o workspace de destino com `agy`, inicie uma conversa nova e invoque a Skill:

```text
/ases-project-start
```

A primeira ação de terminal da Skill executa o script local do plugin e imprime o logo Eureka42 em verde RGB antes de inspecionar arquivos ou perguntar sobre o projeto. A entrevista segue esta ordem: tipo de aplicativo, linguagem, hospedagem, banco de dados, escala e dados pessoais/sensíveis. Decisões existentes são avaliadas, recomendações ausentes ficam `PROPOSED` e nenhuma escolha é confirmada sem a pessoa.

O script do logo só escreve no terminal. A Skill inspeciona manifestos conhecidos sem ler `.env`, credenciais ou arquivos secretos, e não persiste respostas sem autorização explícita.

## Desenvolvimento e smoke test

```sh
agy plugin validate --strict ./integrations/antigravity-cli
agy plugin install ./integrations/antigravity-cli
agy plugin list
agy
```

Dentro da sessão, execute `/ases-project-start`. Confirme visualmente o logo verde antes da primeira pergunta e peça que a Skill pare após a pergunta sobre tipo de aplicativo, sem editar arquivos. Registre versão do `agy`, modelo selecionado, Skill carregada, saída RGB do logo e pergunta inicial. `agy plugin validate` sozinho valida o pacote; não substitui o smoke numa conversa real.

## Fontes oficiais

- [Agent Skills do Antigravity](https://antigravity.google/docs/skills)
- [Build plugins e manifesto `plugin.json`](https://antigravity.google/docs/build-plugins)
- [Plugins do Antigravity CLI](https://antigravity.google/docs/plugins?tab=cli)
