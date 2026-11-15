# Safe structured logging

Use `writeSafeLog()` or `createSafeLogRecord()` before sending runtime data to a log sink. The sink receives only a bounded JSON line after field-level redaction and text-pattern redaction. Sensitive keys such as password, token, authorization, email, SSN, and private-key fields are replaced wholesale. Text patterns cover common provider tokens, bearer credentials, credential-bearing URLs, private-key blocks, email addresses, SSNs, and credential assignments. Error stacks and binary contents are omitted; cycles, nesting, collection size, individual text, and final line size are bounded.

```ts
import { writeSafeLog } from "@eureka42/ases-cli";

writeSafeLog((line) => process.stderr.write(`${line}\n`), "provider.failure", {
  provider: "example",
  api_key: process.env.API_KEY,
  message: error,
});
```

Redaction is pattern-based and can miss novel secrets or sensitive free text. Do not put credentials or personal data into log fields; prefer stable IDs and error codes. Review logging sinks before enabling verbose or remote telemetry.
