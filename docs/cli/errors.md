# CLI errors and recovery

With `--json`, command failures return a stable `code` where the command defines one. The human-readable output may add context; scripts should branch on the numeric exit code and JSON `code`, not parse prose. Not every usage error has a dedicated JSON code yet.

| Code | Exit | Meaning | Recovery |
|---|---:|---|---|
| `ASES_COMMAND_UNKNOWN` | 1 | Unknown top-level command | Run `ases help`; verify spelling and CLI version. |
| `ASES_INIT_EXISTS` | 0 | Workspace already has managed initialization files | Review listed conflicts; ASES does not overwrite them. |
| `ASES_INTERVIEW_JSON_REQUIRES_ANSWERS` | 2 | JSON mode has no answer file | Provide `--answers <file.json>`, or use interactive mode without `--json`. |
| `ASES_INTERVIEW_TTY_REQUIRED` | 2 | Interactive interview was started without a terminal | Provide `--answers <file.json>` for automation or attach an interactive TTY. |
| `ASES_HOST_INVALID` | 2 | Unsupported host ID | Run `ases host list`; use a listed ID. |
| `ASES_REQUIREMENT_NOT_FOUND` | 2 | Requirement ID is absent from selected catalog | Check the ID and catalog/product selection. |
| `ASES_UNINSTALL_UNSAFE_PATH` | 3 | Managed directory is a symlink or unsafe filesystem object | Inspect `.ases` path and symlinks manually; rerun only after correcting the workspace. |
| `ASES_UNINSTALL_MANIFEST_INVALID` | 3 | Ownership manifest is missing, modified, or malformed | Preserve files; inspect manifest and local changes. Do not delete recursively. |
| `ASES_UNINSTALL_FAILED` | 3 | Safe project uninstall could not complete | Read the structured error, check permissions and paths, then rerun the read-only plan. |
| `ASES_PLUGIN_REMOVE_FAILED` | 3 | Plugin removal validation or filesystem operation failed | Review `ases plugin remove <id> --json`; repair ownership/path issues before `--apply`. |
| `ASES_CONFIG_READ` | 3 | Config could not be read or resolved | Check the path, JSON syntax, file permissions, and allowed keys. |
| `ASES_INTERVIEW_INVALID` | 4 | Interview answers are missing or invalid | Correct the answer file using the schema and rerun; use `--resume` to inspect saved progress. |
| `ASES_CATALOG_IMPORT` | 5 | ASES-300 import failed | Verify source path/format and workspace permissions; keep imported data marked not homologated. |
| `ASES_PRODUCT_CATALOG_IMPORT` | 5 | Product catalog import failed | Verify product ID and source; keep the catalog isolated from ASES-300. |
| `ASES_CATALOG_UNAVAILABLE` | 5 | Selected catalog is unavailable or invalid | Import the approved local source, then inspect its status and hash. |
| `ASES_REQUIREMENT_UPDATE` | 5 | Requirement update was rejected | Check allowed status, evidence path/hash/context, and required rationale. |
| `ASES_DECISION_UPDATE` | 5 | Decision update was rejected | Check requirement ID, decision status, reference, and rationale. |
| `ASES_HOST_PLAN_FAILED` | 5 | Host plan could not be generated | Verify workspace path and symlinks; check adapter ID and filesystem permissions. |
| `ASES_HOST_APPLY_FAILED` | 5 | Host integration apply failed | Inspect conflicts and ownership manifest; use plan first and `--apply` only after review. |
| `ASES_HOST_UPDATE_FAILED` | 5 | Host update failed | Check modified owned files and backup location; do not delete preserved backups. |
| `ASES_HOST_UNINSTALL_FAILED` | 5 | Host removal failed | Review preserved/modified files and symlink paths; use the read-only plan first. |
| `ASES_HOST_RESTORE_FAILED` | 3 | Backup snapshot could not be verified or restored | Check the backup ID, snapshot manifest and current host ownership; retain the backup and inspect conflicts before retrying. |

Exit codes are stable at a broad level: `0` success/unchanged, `1` unknown command, `2` usage/precondition, `3` configuration/safe removal, `4` interview data, and `5` catalog/host/requirement operation. JSON mode is recommended for automation.
