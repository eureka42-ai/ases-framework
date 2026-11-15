# Host integration backups and restore

`ases host update <host> <workspace> --apply` stores each prior owned file beneath `.ases/backups/hosts/<host>/<backup-id>/`. A hash-bound `manifest.json` lists the snapshot files. Keep this directory with the project if you need rollback.

Preview a restore without changing the workspace:

```bash
ases host restore claude-code <backup-id> ./my-project
```

Review the paths, then restore explicitly:

```bash
ases host restore claude-code <backup-id> ./my-project --apply
```

Restore only proceeds if the snapshot manifest and every snapshot file match their recorded SHA-256, the active host ownership manifest is valid, and each current target still matches the hash ASES owns. It updates the ownership manifest so later updates/uninstalls remain safe. Modified files, symlinks, missing paths, tampered snapshots, and targets no longer owned cause a conflict or fail-closed error.

After restore, the host integration may be older than the checked-in assets. Run `ases host update <host> <workspace> --apply` to return to the current version. Existing snapshots without the new versioned manifest are not eligible for automatic restore.
