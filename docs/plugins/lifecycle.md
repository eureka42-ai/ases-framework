# Plugin install ownership and removal

`ases plugin remove <plugin-id> [workspace]` is read-only by default. It reads `.ases/plugins/<plugin-id>/install-manifest.json`, verifies the manifest digest, and compares each owned regular file with its recorded SHA-256. Review the plan, then pass `--apply` to remove only the intact files listed in the valid ownership manifest.

Modified files, symlinks, special files, untracked files and workspace data remain in place. A partial removal keeps the ownership manifest for a later review. The command refuses symlinked `.ases` or plugin parent directories and never recursively deletes a plugin directory. It removes empty plugin-owned directories only after all owned files are removed and no unowned data remains.

The ownership manifest format is versioned and binds the plugin ID plus sorted relative file paths and hashes. Missing files are treated as already removed. Missing, malformed or tampered manifests fail closed and do not authorize deletion.
