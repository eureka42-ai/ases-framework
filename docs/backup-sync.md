# Backup cifrado e sync opt-in

O pacote exporta `encryptBackup`/`decryptBackup` e upload/download/delete de envelopes cifrados. A cifragem acontece localmente no runtime do aplicativo antes de chamar o storage. O backup usa AES-256-GCM, chave derivada com PBKDF2-HMAC-SHA-256 (600.000 iterações), salt aleatório de 16 bytes, IV aleatório de 12 bytes, tag de autenticação de 128 bits e autentica o cabeçalho como AAD. Cada cifragem cria salt e IV novos. O formato e os limites estão versionados no código.

```ts
import { createR2BackupObjectStore, uploadEncryptedBackup, downloadEncryptedBackup } from "@eureka42/ases-cli";

// MY_BACKUPS é um binding R2 definido pelo app Cloudflare Worker.
const store = createR2BackupObjectStore(env.MY_BACKUPS);
const options = {
  enabled: true,
  objectKey: "ases/project-123/backup-2026-11-15",
  passphrase: env.ASES_BACKUP_PASSPHRASE,
};

await uploadEncryptedBackup(store, serializedBackupBytes, options);
const restoredBytes = await downloadEncryptedBackup(store, options);
```

`enabled: true` é exigido em cada operação remota. Construir o adapter não acessa a nuvem, e nenhuma rotina em background é criada. O binding R2 precisa ser configurado pelo app hospedeiro; `put/get/delete` seguem a [API oficial do R2 Workers](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/). Outros storages podem implementar `EncryptedBackupObjectStore` e receber apenas o envelope JSON cifrado.

O formato não armazena a passphrase nem oferece recuperação de chave: mantenha uma cópia segura e independente da passphrase, pois perdê-la torna o backup irrecuperável. Use uma passphrase longa e gerada por um gerenciador. A interface de sync transporta um snapshot cifrado por chave de objeto; não mescla conteúdo, detecta conflitos entre dispositivos, agenda uploads, apaga versões antigas nem grava plaintext no workspace. O app é responsável por serializar o snapshot, proteger o binding, escolher retenção e só restaurar após autenticação. Tamanho máximo do plaintext: 32 MiB; envelope armazenado: 46 MiB.

O algoritmo segue as primitivas expostas pelo [Web Crypto API oficial do Node.js](https://nodejs.org/api/webcrypto.html); AES-GCM exige IV único por chave e bytes autenticados para integridade. Ciphertexts são tratados como dados sensíveis, mesmo quando cifrados.
