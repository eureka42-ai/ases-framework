# Context bundle archive import

The ZIP importer is deliberately narrow. It accepts only JSON, Markdown, and text files; rejects traversal, absolute paths, platform-specific paths, symlinks/special files, encrypted or unsupported ZIP entries, and oversized archives; and writes imported files as regular mode-`0600` data. Imported files are never executed.

## Preview first

```ts
import { importBundleArchive, previewBundleArchive } from "@eureka42/ases-cli";
import { readFile } from "node:fs/promises";

const archive = await readFile("context-bundle.zip");
const preview = await previewBundleArchive(workspace, archive);
if (preview.status === "CONFLICT") {
  console.log(preview.conflicts);
} else {
  // Review every path, hash, size, and the total byte count before applying.
  await importBundleArchive(workspace, archive, { apply: true });
}
```

`importBundleArchive(..., { apply: false })` returns a preview and performs no writes. Applying requires `apply: true`; the importer aborts the whole import if any target already exists and never overwrites. File creation is exclusive, and a partial failure removes files/directories created during that attempt.

The parser supports single-disk, non-ZIP64 ZIP files with stored or deflate entries. It verifies central/local names, sizes, and CRCs, caps entry count, per-file size, total uncompressed size, and compression ratio. Hosts should continue to verify ContextBundle schema/integrity after import and request user approval before using imported decisions or requirements.
