import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir, userInfo } from "node:os";
import { join } from "node:path";
const admin = new URL(process.env.RESTORE_ADMIN_DATABASE_URL ?? `postgresql://${encodeURIComponent(userInfo().username)}@127.0.0.1:5432/postgres`);
if (!["localhost", "127.0.0.1"].includes(admin.hostname)) throw new Error("Automated fixture drill is restricted to local PostgreSQL");
const suffix = randomBytes(6).toString("hex");
const source = `expenses_recovery_source_${suffix}`;
const target = `expenses_recovery_restore_drill_${suffix}`;
const directory = mkdtempSync(join(tmpdir(), "expenses-recovery-"));
const manifest = join(directory, "expected.json");
const url = (name) => { const value = new URL(admin); value.pathname = `/${name}`; return value.href; };
function run(command, args, env = {}) {
  const result = spawnSync(command, args, { env: { ...process.env, ...env }, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} failed: ${(result.stderr || result.stdout).replaceAll(admin.href, "[database]").slice(-3000)}`);
  return result.stdout.trim();
}
const started = Date.now();
const created = [];
try {
  for (const name of [source, target]) { run("psql", [admin.href, "-v", "ON_ERROR_STOP=1", "-c", `CREATE DATABASE "${name}"`]); created.push(name); }
  run("npm", ["run", "db:migrate"], { DATABASE_URL: url(source) });
  const before = JSON.parse(run("npx", ["--no-install", "tsx", "scripts/recovery-fixture.ts", "seed", manifest], { DATABASE_URL: url(source) }));
  const dump = run("sh", ["scripts/backup-postgres.sh", directory], { DATABASE_URL: url(source) + "?schema=public&connection_limit=5" });
  const restoreStarted = Date.now();
  run("sh", ["scripts/restore-drill.sh", dump], { RESTORE_DATABASE_URL: url(target) + "?schema=public" });
  const after = JSON.parse(run("npx", ["--no-install", "tsx", "scripts/recovery-fixture.ts", "verify", manifest], { DATABASE_URL: url(target) }));
  const report = { occurredAt: new Date().toISOString(), kind: "local-populated-logical-restore", passed: true, restoreAndVerificationMs: Date.now() - restoreStarted, totalMs: Date.now() - started, before, after, limitation: "Does not validate managed-provider PITR or production latency." };
  const output = process.env.RECOVERY_REPORT_PATH ?? join(directory, "report.json");
  writeFileSync(output, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
  console.log(`Report: ${output}`);
} finally {
  // Only the randomly named databases created by this process can be removed.
  for (const name of created.reverse()) run("psql", [admin.href, "-v", "ON_ERROR_STOP=1", "-c", `DROP DATABASE "${name}"`]);
}
