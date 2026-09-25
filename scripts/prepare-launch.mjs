import { randomBytes } from "node:crypto";
import { mkdirSync, openSync, writeFileSync, closeSync, chmodSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
const folder = join(homedir(), "Library", "Application Support", "ExpensesTracker", "release");
mkdirSync(folder, { recursive: true, mode: 0o700 });
const file = join(folder, "production.env");
if (existsSync(file)) {
  console.log(`Existing configuration preserved: ${file}`);
} else {
  const lines = [
    "# Private launch configuration. Do not commit or share this file.",
    "# Fill the empty values through the provider dashboards.",
    "DATABASE_URL=", "MIGRATION_DATABASE_URL=", "APP_ORIGIN=",
    `APP_ENCRYPTION_KEY=${randomBytes(32).toString("base64")}`,
    `RATE_LIMIT_SALT=${randomBytes(32).toString("hex")}`,
    `MONITORING_WEBHOOK_TOKEN=${randomBytes(32).toString("base64url")}`,
    "REQUIRE_EMAIL_VERIFICATION=true", "REQUIRE_PRODUCTION_CONFIG=true",
    "EMAIL_DELIVERY_MODE=resend", "RESEND_API_KEY=", "EMAIL_FROM=",
    "NEXT_PUBLIC_SUPPORT_EMAIL=", "MONITORING_WEBHOOK_URL=", "RELEASE_SHA=",
    "EXPENSES_TRACKER_API_URL=", "EXPENSES_TRACKER_PUBLIC_URL=",
    "EXPENSES_TRACKER_DEVELOPMENT_TEAM=", "EXPENSES_TRACKER_BUILD_NUMBER=1",
    "# Owner decisions needed for published policies and store territories:",
    "LEGAL_OPERATOR_NAME=", "LAUNCH_COUNTRIES=", "BACKUP_RETENTION_DAYS=",
  ];
  const fd = openSync(file, "wx", 0o600);
  try { writeFileSync(fd, lines.join("\n") + "\n"); } finally { closeSync(fd); }
  chmodSync(file, 0o600);
  console.log(`Private launch configuration created: ${file}`);
}
console.log("Encryption/rate-limit/webhook secrets are stored privately; no secret values were printed.");
