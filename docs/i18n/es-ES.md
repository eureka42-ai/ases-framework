# Guía rápida de EUREKA42 ASES Framework

## Requisitos e instalación

Se requiere Node.js 22 o posterior y npm. Comprueba el entorno e instala el CLI:

```sh
node --version
npm install --global @eureka42/ases-cli
ases --version
ases welcome --color
```

El paquete publicado puede ofrecerse como versión preliminar con la etiqueta `next`. Para usarla, ejecuta `npm install --global @eureka42/ases-cli@next`.

## Primeros pasos

```sh
ases --locale es-ES help
ases init ./mi-proyecto
ases doctor ./mi-proyecto
ases interview ./mi-proyecto
```

La entrevista propone una pila inicial y deja las decisiones abiertas para revisión. En automatización, proporciona un archivo de respuestas con `--answers archivo.json`. Usa `--dry-run` para revisar los planes antes de escribir archivos y `--apply` solo para operaciones que lo soliciten.

## Catálogo y seguimiento

Importa primero una fuente Markdown local con 300 requisitos ASES. Después puedes consultar y exportar las tareas:

```sh
ases catalog import-ases300 requisitos.md ./mi-proyecto
ases requirements list ./mi-proyecto
ases tracker export ./mi-proyecto > tareas.json
ases tracker import tareas.json ./mi-proyecto --json
ases tracker import tareas.json ./mi-proyecto --apply --json
```

La importación de tareas muestra una vista previa por defecto. `--apply` guarda el paquete localmente en `.ases/tracker-imports/` y no modifica el catálogo ni llama a servicios externos.

## Idioma y privacidad

El idioma del CLI puede configurarse por comando (`--locale es-ES`) o mediante la variable `ASES_LOCALE`. `.ases/config.json` también admite estos valores como metadatos del proyecto, pero no reemplaza el selector de idioma del CLI. Los valores admitidos son `pt-BR`, `en-US`, `es-ES` e `it-IT`. Las salidas JSON y los códigos de error permanecen estables para automatización.

El modo local no envía código, prompts, requisitos ni credenciales. Las integraciones con servicios externos requieren configuración y autorización adicionales.

Los scaffolds de lenguaje y stack se describen en la [guía de templates](../templates.md); usa `ases template list` para consultarlos y añade `--apply` después de revisar la previsualización.
