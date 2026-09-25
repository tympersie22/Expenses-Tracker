import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
const database = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(database.hostname) || !/_test$/.test(database.pathname)) throw new Error("Use a local dedicated _test database");
const origin = "http://127.0.0.1:3137";
const env = { ...process.env, PORT: "3137", HOSTNAME: "127.0.0.1", APP_ORIGIN: origin, APP_ENCRYPTION_KEY: randomBytes(32).toString("base64"), RATE_LIMIT_SALT: randomBytes(32).toString("hex"), REQUIRE_EMAIL_VERIFICATION: "false", REQUIRE_PRODUCTION_CONFIG: "false" };
const server = spawn(process.execPath, [".next/standalone/server.js"], { env, stdio: ["ignore", "pipe", "pipe"] });
let logs = "";
server.stdout.on("data", (chunk) => { logs = (logs + chunk).slice(-5000); });
server.stderr.on("data", (chunk) => { logs = (logs + chunk).slice(-5000); });
function run(script) { return new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [script], { env, stdio: "inherit" });
  child.on("error", reject); child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${script} failed`)));
}); }
try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) throw new Error(`API exited early: ${logs}`);
    try { const response = await fetch(origin + "/api/health", { signal: AbortSignal.timeout(1000) }); ready = response.ok; } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error(`API startup failed: ${logs}`);
  await run("scripts/verify-http.mjs");
  await run("scripts/verify-lifecycle.mjs");
} finally { server.kill("SIGTERM"); }
