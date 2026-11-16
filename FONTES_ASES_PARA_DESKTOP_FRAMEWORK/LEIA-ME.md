# FONTES ASES PARA A PASTA FRAMEWORK

Esta pasta contém COPIAS byte a byte dos originais disponíveis e as cópias de trabalho previamente preparadas.

## Estado das fontes
- **ASES-300:** documento Word original de trabalho com 25 capítulos. `markdown/ASES-300_DOCUMENTACAO_INTEGRAL.md` foi convertido a partir dele e NÃO é o original. Os identificadores `REQ-001` a `REQ-300` estão presentes em ambos, mas a conversão DOCX→Markdown pode perder detalhes de paginação, estilos e layout. O original Word permanece para consulta.
- **ASES-500:** somente consolidação para validação, explicitamente identificada como RECONSTRUÇÃO; o original autônomo não foi localizado; não declarar homologação.
- **Matriz Eureka42:** documentação específica de produto; `REQ-301` a `REQ-500` NÃO são parte da base normativa universal ASES-300 e não podem ser usados como tal. A matriz está segregada em `referencia_especifica_eureka42/`.

## Integridade
A lista `SHA256SUMS.txt` registra o hash SHA-256 de cada cópia. Os arquivos foram copiados sem regravar nem editar seu conteúdo; SHA igual ao arquivo fonte no ambiente de origem. No macOS, dentro desta pasta execute: `shasum -a 256 -c SHA256SUMS.txt`.

## Colocação em Desktop/FRAMEWORK (macOS)
Baixe o arquivo ZIP do ChatGPT. No Terminal:

```sh
mkdir -p "$HOME/Desktop/FRAMEWORK"
unzip -n "$HOME/Downloads/ASES_FONTES_PARA_DESKTOP_FRAMEWORK.zip" -d "$HOME/Desktop/FRAMEWORK"
```

O parâmetro `-n` evita sobrescrever arquivos já existentes. A extração criará `FONTES_ASES_PARA_DESKTOP_FRAMEWORK/` dentro de `FRAMEWORK`.

O pacote original está incluído sem alterações no repositório público oficial. Consulte `LICENSES.md` na raiz para o escopo da distribuição e preserve os hashes e os rótulos de estado metodológico.
