import { redactSensitiveText } from "./memory.js";

export interface SafeLogRecord {
  timestamp: string;
  event: string;
  data: unknown;
}

export interface SafeLogResult {
  record: SafeLogRecord;
  redactions: number;
  line: string;
}

const sensitiveField = /(?:password|passwd|secret|api[\s_-]*key|token|authorization|credential|private[\s_-]*key|e-?mail|phone|ssn|social[\s_-]*security|passport|birth(?:date)?|home[\s_-]*address)/i;
const MAX_DEPTH = 8;
const MAX_ENTRIES = 200;
const MAX_TEXT_LENGTH = 4_000;
const MAX_LINE_LENGTH = 20_000;

/** Recursively converts arbitrary runtime data to bounded, redacted log-safe values. */
export function createSafeLogRecord(event: string, data: unknown, now = new Date()): SafeLogResult {
  if (!/^[a-z][a-z0-9._-]{1,95}$/i.test(event)) throw new Error("log event must be a 2-96 character identifier");
  if (!Number.isFinite(now.getTime())) throw new Error("log timestamp must be valid");
  let redactions = 0;
  const seen = new WeakSet<object>();
  const clean = (value: unknown, depth: number): unknown => {
    if (value === null || value === undefined || typeof value === "boolean" || typeof value === "number") return value ?? null;
    if (typeof value === "string") {
      const result = redactSensitiveText(value);
      redactions += result.count;
      return result.text.length > MAX_TEXT_LENGTH ? `${result.text.slice(0, MAX_TEXT_LENGTH)}[TRUNCATED]` : result.text;
    }
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "function" || typeof value === "symbol") return `[OMITTED:${typeof value}]`;
    if (value instanceof Error) return { name: value.name, message: clean(value.message, depth + 1) };
    if (Buffer.isBuffer(value)) return `[BINARY:${value.byteLength} bytes omitted]`;
    if (depth >= MAX_DEPTH) return "[MAX_DEPTH]";
    if (typeof value === "object") {
      if (seen.has(value)) return "[CIRCULAR]";
      seen.add(value);
      if (Array.isArray(value)) return value.slice(0, MAX_ENTRIES).map((item) => clean(item, depth + 1));
      const output: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
      for (const [key, item] of Object.entries(value).slice(0, MAX_ENTRIES)) {
        if (sensitiveField.test(key)) {
          output[key] = "[REDACTED]";
          redactions += 1;
        } else {
          output[key] = clean(item, depth + 1);
        }
      }
      return output;
    }
    return "[OMITTED]";
  };

  const record: SafeLogRecord = { timestamp: now.toISOString(), event, data: clean(data, 0) };
  let line = JSON.stringify(record);
  if (line.length > MAX_LINE_LENGTH) {
    record.data = { truncated: true, reason: "log-size-limit" };
    line = JSON.stringify(record);
  }
  return { record, redactions, line };
}

/** Writes only the sanitized representation; the sink never receives the original payload. */
export function writeSafeLog(sink: (line: string) => void, event: string, data: unknown, now?: Date): SafeLogResult {
  const result = createSafeLogRecord(event, data, now);
  sink(result.line);
  return result;
}
