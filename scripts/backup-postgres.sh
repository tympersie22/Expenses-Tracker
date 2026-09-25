#!/bin/sh
set -eu
if [ -z "${DATABASE_URL:-}" ]; then echo "DATABASE_URL is required" >&2; exit 1; fi
script_dir="$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)"
DATABASE_URL="$(node "$script_dir/postgres-url.mjs" DATABASE_URL)"
export DATABASE_URL
backup_dir="${1:-./backups}"
mkdir -p "$backup_dir"
umask 077
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="$backup_dir/expenses-tracker-$stamp.dump"
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-privileges --file="$file"
pg_restore --list "$file" >/dev/null
echo "$file"
