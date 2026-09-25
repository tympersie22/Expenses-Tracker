import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseEnv } from "node:util";
const file = process.argv[2] ?? join(homedir(), "Library", "Application Support", "ExpensesTracker", "release", "production.env");
const env = { ...(existsSync(file) ? parseEnv(readFileSync(file, "utf8")) : {}), ...process.env };
const required = ["DATABASE_URL", "MIGRATION_DATABASE_URL", "APP_ORIGIN", "RESEND_API_KEY", "EMAIL_FROM", "NEXT_PUBLIC_SUPPORT_EMAIL", "MONITORING_WEBHOOK_URL", "EXPENSES_TRACKER_API_URL", "EXPENSES_TRACKER_PUBLIC_URL", "EXPENSES_TRACKER_DEVELOPMENT_TEAM", "LEGAL_OPERATOR_NAME", "LAUNCH_COUNTRIES", "BACKUP_RETENTION_DAYS"];
const missing = required.filter((key) => !env[key]?.trim());
const invalid = [];
for (const key of ["APP_ORIGIN","EXPENSES_TRACKER_API_URL","EXPENSES_TRACKER_PUBLIC_URL","MONITORING_WEBHOOK_URL"]) {
  if (!env[key]) continue;
  try { const url = new URL(env[key]); if (url.protocol !== "https:" || url.username || url.password || /(^localhost$|\.(invalid|test|example|local)$)/.test(url.hostname) || ["example.com","example.org","example.net"].includes(url.hostname)) invalid.push(key); } catch { invalid.push(key); }
}
if (Buffer.from(env.APP_ENCRYPTION_KEY ?? "", "base64").length !== 32) invalid.push("APP_ENCRYPTION_KEY");
if ((env.RATE_LIMIT_SALT ?? "").length < 32) invalid.push("RATE_LIMIT_SALT");
if (env.REQUIRE_EMAIL_VERIFICATION !== "true") invalid.push("REQUIRE_EMAIL_VERIFICATION");
if (env.REQUIRE_PRODUCTION_CONFIG !== "true") invalid.push("REQUIRE_PRODUCTION_CONFIG");
if (env.DATABASE_URL && env.DATABASE_URL === env.MIGRATION_DATABASE_URL) invalid.push("DATABASE_ROLES_MUST_DIFFER");
console.log(JSON.stringify({ readyForHostedValidation: missing.length === 0 && invalid.length === 0, missing, invalid, note: "Names only; configuration values are never printed. Passing this check does not prove deployment, delivery, signing, or managed recovery." }, null, 2));
process.exitCode = missing.length || invalid.length ? 1 : 0;
