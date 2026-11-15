# Guida rapida a EUREKA42 ASES Framework

## Requisiti e installazione

È necessario Node.js 22 o successivo e npm. Verifica l'ambiente e installa la CLI:

```sh
node --version
npm install --global @eureka42/ases-cli
ases --version
ases welcome --color
```

Il pacchetto pubblicato può essere distribuito in anteprima con il tag `next`. Per installarlo, esegui `npm install --global @eureka42/ases-cli@next`.

## Avvio rapido

```sh
ases --locale it-IT help
ases init ./mio-progetto
ases doctor ./mio-progetto
ases interview ./mio-progetto
```

L'intervista propone uno stack iniziale e lascia le decisioni aperte alla revisione. Per l'automazione, fornisci un file di risposte con `--answers file.json`. Usa `--dry-run` per esaminare i piani prima di scrivere file e `--apply` solo per le operazioni che lo richiedono.

## Catalogo e attività

Importa prima una fonte Markdown locale con 300 requisiti ASES. Poi consulta ed esporta le attività:

```sh
ases catalog import-ases300 requisiti.md ./mio-progetto
ases requirements list ./mio-progetto
ases tracker export ./mio-progetto > attivita.json
ases tracker import attivita.json ./mio-progetto --json
ases tracker import attivita.json ./mio-progetto --apply --json
```

L'importazione delle attività mostra un'anteprima per impostazione predefinita. `--apply` salva il bundle localmente in `.ases/tracker-imports/`, senza modificare il catalogo né contattare servizi esterni.

## Lingua e privacy

La lingua della CLI si configura per comando (`--locale it-IT`) oppure con la variabile `ASES_LOCALE`. `.ases/config.json` accetta gli stessi valori come metadati del progetto, ma non sostituisce il selettore della lingua CLI. I valori supportati sono `pt-BR`, `en-US`, `es-ES` e `it-IT`. Output JSON e codici di errore restano stabili per l'automazione.

La modalità locale non invia codice, prompt, requisiti o credenziali. Le integrazioni con servizi esterni richiedono configurazione e autorizzazioni aggiuntive.
