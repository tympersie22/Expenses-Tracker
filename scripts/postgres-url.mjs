// libpq tools do not understand Prisma-only connection options.
export function postgresToolURL(value) {
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("A PostgreSQL URL is required");
  for (const key of ["schema", "pgbouncer", "connection_limit", "pool_timeout", "socket_timeout", "statement_cache_size", "sslaccept"]) url.searchParams.delete(key);
  return url.toString();
}
if (process.argv[2]) process.stdout.write(postgresToolURL(process.env[process.argv[2]] ?? ""));
