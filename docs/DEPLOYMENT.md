# Production deployment

Use separate staging and production services, databases, encryption keys, email credentials, monitoring endpoints, and support contacts. `REQUIRE_PRODUCTION_CONFIG=true` makes `/api/health` fail until every required production setting is present.

## Database identities

Create a migration owner and a non-owner runtime role. `MIGRATION_DATABASE_URL` belongs to the migration owner and must exist only in the protected `staging-database` / `production-database` GitHub environments. The manual Database release workflow uses it to migrate and apply grants. Never add this credential to a Render web service or cron job: service environment variables are visible to its runtime, including those used by pre-deploy commands. `DATABASE_URL` belongs to the runtime role and is used by the application and prune job.

After migrations, apply runtime grants as the database owner:

```sh
psql "$MIGRATION_DATABASE_URL" -v runtime_role=expenses_tracker_runtime -f scripts/configure-runtime-role.sql
```

The runtime role can read and write application tables but cannot directly update or delete `AuditEvent`. Database triggers also reject audit updates and direct deletes; deleting a user still cascades their records. Review grants after every migration that creates a table.

## Release order

1. Build and test an immutable commit in CI.
2. Back up and confirm point-in-time recovery is healthy.
3. Apply backward-compatible migrations with the migration identity.
4. Deploy the standalone artifact and wait for `/api/health`.
5. Run the authenticated smoke journey against staging, then production with a disposable account.
6. Promote the matching iOS build to TestFlight.

Roll back the application artifact when smoke tests fail. Do not reverse a migration during an incident; migrations must support the previous and current application versions until the next release removes old fields.

The smoke account must be verified and must not have MFA enabled. Store its password only in the deployment secret manager:

```sh
SMOKE_BASE_URL=https://staging.example.com SMOKE_EMAIL=... SMOKE_PASSWORD=... npm run smoke:production
```

## Workflow setup

Create the two protected database environments, restrict deployment branches, and store `MIGRATION_DATABASE_URL` there. Create the non-owner runtime role through the database provider first. Run Database release on the exact tested commit; verify its success before manually deploying that commit on Render. Automatic deployment is disabled in the blueprint. Keep staging and production credentials separate. The prune job receives the same restricted runtime role as the web service.
