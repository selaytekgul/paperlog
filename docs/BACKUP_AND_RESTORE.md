# Paperlog backup and restore

Production administrator exports contain profile information, comments, OAuth records, and active session data. Never commit them, attach them to issues, or place them in a public cloud folder.

## Weekly backup

1. Sign in to Paperlog with the administrator account.
2. Open `https://paperlog.net/api/admin/export`.
3. Move the downloaded JSON file to a private directory outside the repository.
4. Restrict the directory to the owner and the file to owner read/write access.
5. Record the export time and SHA-256 checksum without copying the backup contents into project documentation.
6. Run the restore drill below after schema changes and at least once per quarter.

The first verified production backup was created on 2026-07-14 and stored outside the repository. Its contents and private location are intentionally not tracked by Git.

## Isolated restore drill

The restore utility only accepts administrator exports with `schemaVersion: 3`. It creates a new local SQLite database, applies the checked-in migrations, restores every table, validates row counts, runs SQLite foreign-key checks, and sets the restored file to owner-only access.

```bash
npm run backup:restore -- \
  --input "/private/path/paperlog-backup.json" \
  --output "/private/path/restore-tests/paperlog-restored.sqlite"
```

The command refuses to overwrite an existing restored database. Add `--force` only when intentionally replacing an isolated local restore. Never point this procedure at production.

After the command succeeds, retain the restored copy only as long as it is needed for the drill because it contains the same sensitive data as the backup.

## Recovery limitation

The current Sites-hosted production database is restored through a controlled application/hosting operation, not by this local command. The local drill proves that the exported data is complete and internally consistent; a production recovery must use a fresh deployment or provider-supported database import and must be tested away from the live database first.
