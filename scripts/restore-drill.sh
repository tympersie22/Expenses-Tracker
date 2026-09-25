#!/bin/sh
set -eu
if [ -z "${RESTORE_DATABASE_URL:-}" ]; then echo "RESTORE_DATABASE_URL is required" >&2; exit 1; fi
script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
RESTORE_DATABASE_URL="$(node "$script_dir/postgres-url.mjs" RESTORE_DATABASE_URL)"
export RESTORE_DATABASE_URL
# Validate the actual URL database path, not a substring in a password or query.
node --input-type=module -e '
const url = new URL(process.env.RESTORE_DATABASE_URL);
const name = decodeURIComponent(url.pathname.slice(1));
if (!["postgres:", "postgresql:"].includes(url.protocol) || !/^[a-z0-9_]*restore_drill[a-z0-9_]*$/.test(name)) {
  throw new Error("Use a dedicated database whose name contains restore_drill");
}
'
dump="${1:?Pass a pg_dump custom-format file}"
pg_restore --list "$dump" >/dev/null
objects="$(psql "$RESTORE_DATABASE_URL" -At -v ON_ERROR_STOP=1 -c "SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','p','v','m','S','f');")"
if [ "$objects" != "0" ]; then echo "Restore refused: destination must be empty. Create a new drill database." >&2; exit 1; fi
pg_restore --dbname="$RESTORE_DATABASE_URL" --exit-on-error --single-transaction --no-owner --no-privileges "$dump"
psql "$RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 -c 'SELECT COUNT(*) AS users FROM "User"; SELECT COUNT(*) AS movements FROM "Movement"; SELECT COUNT(*) AS audit_events FROM "AuditEvent";'
