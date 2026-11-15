# Data and migration boundaries

The ASES Framework currently has no database server, SQL schema, ORM, or database migration runner. Its own workspace state is stored as versioned JSON/Markdown files beneath `.ases/`; the project's selected application database is a recommendation recorded for the user's application and is not provisioned or migrated by this CLI.

## Current guarantees

- Config and managed ownership manifests carry `schemaVersion` fields.
- Readers validate known schemas and fail closed on unsupported or malformed ownership data.
- Host/plugin installs track owned files by hash; update backups are hash-bound and can be restored with `ases host restore`.
- No automatic downgrade or in-place conversion of an unknown `.ases` schema is provided.

## Migration policy

Until a database-backed framework feature exists, do not add speculative SQL migrations. A future persistence feature must:

1. Version its schema and define an explicit supported upgrade path.
2. Back up user data before a destructive change and verify the backup by restoring it in an isolated workspace.
3. Keep the prior schema readable or provide a tested, explicit rollback; if a downgrade is lossy or unsupported, document that boundary before release and block automatic downgrade.
4. Test interrupted migration recovery, integrity checks, and preservation of unrelated user data.
5. Require an explicit apply step when an upgrade changes user data.

This is a documented product boundary, not evidence that database migrations are implemented. Database selection in `ases interview` remains advisory for the generated application.
