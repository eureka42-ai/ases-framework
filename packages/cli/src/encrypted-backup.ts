const FORMAT = "eureka42-encrypted-backup";
const VERSION = 1;
const PBKDF2_ITERATIONS = 600_000;
const MAX_PLAINTEXT_BYTES = 32 * 1024 * 1024;
const MAX_ENVELOPE_BYTES = 46 * 1024 * 1024;

export interface EncryptedBackupEnvelope {
  format: typeof FORMAT;
  version: typeof VERSION;
  algorithm: "AES-256-GCM";
  kdf: "PBKDF2-SHA256";
  iterations: typeof PBKDF2_ITERATIONS;
  salt: string;
  iv: string;
  encryptedAt: string;
  ciphertext: string;
}
export interface EncryptedBackupObjectStore {
  put(key: string, encryptedEnvelope: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array | undefined>;
  delete(key: string): Promise<void>;
}
export interface R2BucketBinding {
  put(key: string, value: ArrayBufferView | ArrayBuffer | string, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer>; body?: ReadableStream<Uint8Array> } | null>;
  delete(key: string): Promise<void>;
}

function webCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto API is unavailable in this runtime");
  return globalThis.crypto;
}
function arrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}
function validatePassphrase(passphrase: string): void {
  if (typeof passphrase !== "string" || passphrase.length < 16 || passphrase.length > 1_024 || /\0/.test(passphrase)) throw new Error("backup passphrase must be 16 to 1024 characters and contain no NUL");
}
function validateObjectKey(key: string): void {
  if (typeof key !== "string" || key.length > 256 || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(key) || key.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("backup object key is invalid");
}
function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  return btoa(binary);
}
function fromBase64(value: string, expectedLength: number): Uint8Array {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error("encrypted backup encoding is invalid");
  const decoded = atob(value);
  if (decoded.length !== expectedLength) throw new Error("encrypted backup parameters have invalid lengths");
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}
function assertEnvelopeBytes(bytes: Uint8Array): void {
  try {
    const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as Record<string, unknown>;
    if (value.format !== FORMAT || value.version !== VERSION || value.algorithm !== "AES-256-GCM" || value.kdf !== "PBKDF2-SHA256" || typeof value.ciphertext !== "string") throw new Error();
  } catch { throw new Error("cloud backup adapter accepts encrypted ASES backup envelopes only"); }
}
async function readR2Object(object: { arrayBuffer(): Promise<ArrayBuffer>; body?: ReadableStream<Uint8Array> }): Promise<Uint8Array> {
  if (!object.body) {
    const buffer = await object.arrayBuffer();
    if (buffer.byteLength > MAX_ENVELOPE_BYTES) throw new Error("encrypted backup object exceeds 46 MiB");
    return new Uint8Array(buffer);
  }
  const reader = object.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_ENVELOPE_BYTES) { await reader.cancel().catch(() => undefined); throw new Error("encrypted backup object exceeds 46 MiB"); }
    chunks.push(value);
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}
function header(envelope: Omit<EncryptedBackupEnvelope, "ciphertext">): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({ format: envelope.format, version: envelope.version, algorithm: envelope.algorithm, kdf: envelope.kdf, iterations: envelope.iterations, salt: envelope.salt, iv: envelope.iv, encryptedAt: envelope.encryptedAt }));
}
async function deriveKey(passphrase: string, salt: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
  const crypto = webCrypto();
  const material = await crypto.subtle.importKey("raw", arrayBuffer(new TextEncoder().encode(passphrase)), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: arrayBuffer(salt), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, usage);
}

/** Encrypts caller-provided backup bytes locally; only ciphertext is returned for storage. */
export async function encryptBackup(plaintext: Uint8Array, passphrase: string): Promise<Uint8Array> {
  validatePassphrase(passphrase);
  if (!(plaintext instanceof Uint8Array) || plaintext.byteLength > MAX_PLAINTEXT_BYTES) throw new Error("backup plaintext must be a byte array of at most 32 MiB");
  const snapshot = Uint8Array.from(plaintext);
  const crypto = webCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const fields: Omit<EncryptedBackupEnvelope, "ciphertext"> = { format: FORMAT, version: VERSION, algorithm: "AES-256-GCM", kdf: "PBKDF2-SHA256", iterations: PBKDF2_ITERATIONS, salt: base64(salt), iv: base64(iv), encryptedAt: new Date().toISOString() };
  const key = await deriveKey(passphrase, salt, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: arrayBuffer(iv), additionalData: arrayBuffer(header(fields)), tagLength: 128 }, key, arrayBuffer(snapshot)));
  const envelope: EncryptedBackupEnvelope = { ...fields, ciphertext: base64(ciphertext) };
  const serialized = new TextEncoder().encode(JSON.stringify(envelope));
  if (serialized.byteLength > MAX_ENVELOPE_BYTES) throw new Error("encrypted backup envelope exceeded its 46 MiB limit");
  return serialized;
}

/** Authenticates and decrypts a backup; wrong passphrases and tampering share one error. */
export async function decryptBackup(serialized: Uint8Array, passphrase: string): Promise<Uint8Array> {
  validatePassphrase(passphrase);
  if (!(serialized instanceof Uint8Array) || serialized.byteLength > MAX_ENVELOPE_BYTES) throw new Error("encrypted backup must be a byte array of at most 46 MiB");
  let envelope: Partial<EncryptedBackupEnvelope>;
  try { envelope = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(serialized)) as Partial<EncryptedBackupEnvelope>; }
  catch { throw new Error("encrypted backup envelope is invalid"); }
  if (!envelope || envelope.format !== FORMAT || envelope.version !== VERSION || envelope.algorithm !== "AES-256-GCM" || envelope.kdf !== "PBKDF2-SHA256" || envelope.iterations !== PBKDF2_ITERATIONS || typeof envelope.salt !== "string" || typeof envelope.iv !== "string" || typeof envelope.encryptedAt !== "string" || typeof envelope.ciphertext !== "string" || !Number.isFinite(Date.parse(envelope.encryptedAt))) throw new Error("encrypted backup envelope is unsupported or malformed");
  const salt = fromBase64(envelope.salt, 16);
  const iv = fromBase64(envelope.iv, 12);
  const ciphertext = fromBase64(envelope.ciphertext, Math.floor(envelope.ciphertext.length * 3 / 4) - (envelope.ciphertext.endsWith("==") ? 2 : envelope.ciphertext.endsWith("=") ? 1 : 0));
  if (ciphertext.byteLength < 16 || ciphertext.byteLength > MAX_PLAINTEXT_BYTES + 16) throw new Error("encrypted backup ciphertext has an invalid size");
  const fields = { format: envelope.format, version: envelope.version, algorithm: envelope.algorithm, kdf: envelope.kdf, iterations: envelope.iterations, salt: envelope.salt, iv: envelope.iv, encryptedAt: envelope.encryptedAt } as Omit<EncryptedBackupEnvelope, "ciphertext">;
  try {
    const key = await deriveKey(passphrase, salt, ["decrypt"]);
    return new Uint8Array(await webCrypto().subtle.decrypt({ name: "AES-GCM", iv: arrayBuffer(iv), additionalData: arrayBuffer(header(fields)), tagLength: 128 }, key, arrayBuffer(ciphertext)));
  } catch { throw new Error("backup authentication failed; passphrase may be incorrect or data may be damaged"); }
}

/** Adapts an injected Cloudflare R2 Worker binding; construction performs no I/O. */
export function createR2BackupObjectStore(bucket: R2BucketBinding): EncryptedBackupObjectStore {
  if (!bucket || typeof bucket.put !== "function" || typeof bucket.get !== "function" || typeof bucket.delete !== "function") throw new Error("R2 bucket binding is invalid");
  return Object.freeze({
    async put(key: string, bytes: Uint8Array) {
      validateObjectKey(key);
      if (!(bytes instanceof Uint8Array) || bytes.byteLength > MAX_ENVELOPE_BYTES) throw new Error("encrypted backup object is invalid or too large");
      assertEnvelopeBytes(bytes);
      try { await bucket.put(key, bytes, { httpMetadata: { contentType: "application/vnd.eureka42.ases-backup+json" } }); }
      catch { throw new Error("encrypted backup storage write failed; provider details omitted"); }
    },
    async get(key: string) {
      validateObjectKey(key);
      try {
        const object = await bucket.get(key);
        if (!object) return undefined;
        const bytes = await readR2Object(object);
        return bytes;
      } catch (error) { if (error instanceof Error && error.message.includes("46 MiB")) throw error; throw new Error("encrypted backup storage read failed; provider details omitted"); }
    },
    async delete(key: string) {
      validateObjectKey(key);
      try { await bucket.delete(key); } catch { throw new Error("encrypted backup storage delete failed; provider details omitted"); }
    },
  });
}

export interface BackupSyncOptions { enabled: boolean; objectKey: string; passphrase: string }
/** Uploads locally encrypted bytes only after explicit opt-in; no schedule or background sync is created. */
export async function uploadEncryptedBackup(store: EncryptedBackupObjectStore, plaintext: Uint8Array, options: BackupSyncOptions): Promise<{ objectKey: string; encryptedBytes: number }> {
  if (options.enabled !== true) throw new Error("backup upload requires explicit enabled: true");
  validateObjectKey(options.objectKey);
  const envelope = await encryptBackup(plaintext, options.passphrase);
  await store.put(options.objectKey, envelope);
  return { objectKey: options.objectKey, encryptedBytes: envelope.byteLength };
}
/** Downloads one encrypted object and returns plaintext only after local authentication succeeds. */
export async function downloadEncryptedBackup(store: EncryptedBackupObjectStore, options: BackupSyncOptions): Promise<Uint8Array | undefined> {
  if (options.enabled !== true) throw new Error("backup download requires explicit enabled: true");
  validateObjectKey(options.objectKey);
  const envelope = await store.get(options.objectKey);
  return envelope ? decryptBackup(envelope, options.passphrase) : undefined;
}
export async function deleteEncryptedBackup(store: EncryptedBackupObjectStore, options: Pick<BackupSyncOptions, "enabled" | "objectKey">): Promise<void> {
  if (options.enabled !== true) throw new Error("backup deletion requires explicit enabled: true");
  validateObjectKey(options.objectKey);
  await store.delete(options.objectKey);
}
