# Backup and restore runbook

Production PostgreSQL must provide encrypted automated backups and point-in-time recovery. Configure backup-failure alerts and retention before accepting public data.

Use `scripts/backup-postgres.sh` for an additional encrypted-at-rest operator backup destination. Never commit generated dumps. Test a dump only in an empty dedicated database whose actual URL database name contains `restore_drill`. The restore script refuses a nonempty destination and does not drop schemas:

```sh
DATABASE_URL='postgresql://…/expenses_tracker' ./scripts/backup-postgres.sh /secure/backups
RESTORE_DATABASE_URL='postgresql://…/expenses_tracker_restore_drill' ./scripts/restore-drill.sh /secure/backups/expenses-tracker-TIMESTAMP.dump
```

After restore, point a staging instance at the isolated database. Run migrations, integration smoke tests, cross-user ownership checks, and sampled balance comparisons. Record backup time, restore start/end, measured recovery point, measured recovery time, record counts, balance checks, operator, and failures. Delete the drill database under the provider’s approved process.

## Automated local proof

Run `npm run test:recovery` with a local PostgreSQL administrator able to create temporary databases. The runner creates two unique isolated databases, migrates and seeds fictional users, records a transfer, expense correction, CSV import, goals, budgets and bills, then dumps and restores the database. It compares complete records and multi-currency balances, verifies authentication, ownership and audit chains, and removes only its own databases.

The populated report in `restore-drills/2026-09-25-populated.json` passed with 2 users, 4 accounts, 9 movements, 10 entries and 14 verified audit events. This proves local logical backup recovery, not the production provider’s PITR, recovery time under load or off-site retention. Repeat against the managed service once provisioned.
