import assert from "node:assert/strict";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const origin = process.env.APP_ORIGIN;
if (!origin || !/^http:\/\/(localhost|127\.0\.0\.1):/.test(origin)) throw new Error("Lifecycle verification is restricted to a local server.");
const db = new PrismaClient();
const email = `lifecycle-${randomUUID()}@example.test`;
const firstPassword = "Lifecycle-passphrase-2026";
const secondPassword = "Lifecycle-updated-passphrase-2026";
let cookie = "";
const hash = (value) => createHash("sha256").update(value).digest("hex");
async function request(path, method = "GET", body, useCookie = true) {
  const response = await fetch(origin + path, {
    method,
    headers: { ...(method !== "GET" ? { Origin: origin, "Content-Type": "application/json" } : {}), ...(useCookie && cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = response.headers.get("set-cookie");
  if (set && useCookie) cookie = set.split(";", 1)[0];
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null, setCookie: set };
}
function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of value) bits += alphabet.indexOf(char).toString(2).padStart(5, "0");
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
function totp(secret) {
  const input = Buffer.alloc(8);
  input.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", decodeBase32(secret)).update(input).digest();
  const offset = digest.at(-1) & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
}

try {
  const signup = await request("/api/auth/signup", "POST", { email, password: firstPassword, name: "Lifecycle Test", currency: "USD", timeZone: "UTC", acceptTerms: true });
  assert.equal(signup.status, 201, JSON.stringify(signup.data));
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  const verifyToken = `verify-${randomUUID()}-${randomUUID()}`;
  await db.userToken.deleteMany({ where: { userId: user.id, type: "verify" } });
  await db.userToken.create({ data: { userId: user.id, type: "verify", tokenHash: hash(verifyToken), expiresAt: new Date(Date.now() + 60_000) } });
  assert.equal((await request("/api/auth/verify-email", "POST", { token: verifyToken })).status, 200);
  assert.equal((await request("/api/auth/verify-email", "POST", { token: verifyToken })).status, 400);

  const setup = await request("/api/auth/mfa-setup", "POST", { password: firstPassword });
  assert.equal(setup.status, 200);
  const enabled = await request("/api/auth/mfa-enable", "POST", { code: totp(setup.data.secret) });
  assert.equal(enabled.status, 200);
  assert.equal(enabled.data.recoveryCodes.length, 8);
  assert.equal((await request("/api/auth/mfa-setup", "POST", { password: firstPassword })).status, 409);
  const [firstRecovery, secondRecovery, racingRecovery] = enabled.data.recoveryCodes;
  assert.equal((await request("/api/auth/logout", "POST", {})).status, 200);
  cookie = "";
  assert.equal((await request("/api/auth/login", "POST", { email, password: firstPassword })).status, 428);
  assert.equal((await request("/api/auth/login", "POST", { email, password: firstPassword, code: firstRecovery })).status, 200);
  assert.equal((await request("/api/auth/logout", "POST", {})).status, 200);
  cookie = "";
  assert.equal((await request("/api/auth/login", "POST", { email, password: firstPassword, code: firstRecovery })).status, 401);

  const races = await Promise.all(Array.from({ length: 2 }, () => request("/api/auth/login", "POST", { email, password: firstPassword, code: racingRecovery }, false)));
  assert.deepEqual(races.map((result) => result.status).sort(), [200, 401], "A recovery code must succeed at most once under concurrency");
  const oldSession = races.find((result) => result.status === 200).setCookie.split(";", 1)[0];

  const mfaVerifyToken = `verify-mfa-${randomUUID()}-${randomUUID()}`;
  await db.userToken.create({ data: { userId: user.id, type: "verify", tokenHash: hash(mfaVerifyToken), expiresAt: new Date(Date.now() + 60_000) } });
  const mfaVerify = await request("/api/auth/verify-email", "POST", { token: mfaVerifyToken }, false);
  assert.equal(mfaVerify.status, 200);
  assert.equal(mfaVerify.setCookie, null, "Verification must not establish a session bypassing MFA");
  assert.equal((await request("/api/finance/snapshot", "GET", undefined, false)).status, 401);

  const resetToken = `reset-${randomUUID()}-${randomUUID()}`;
  await db.userToken.create({ data: { userId: user.id, type: "reset", tokenHash: hash(resetToken), expiresAt: new Date(Date.now() + 60_000) } });
  assert.equal((await request("/api/auth/reset-password", "POST", { token: resetToken, password: secondPassword }, false)).status, 200);
  assert.equal((await request("/api/finance/snapshot", "GET", undefined, false)).status, 401, "Password reset must not bypass MFA");
  const revoked = await fetch(origin + "/api/finance/snapshot", { headers: { Cookie: oldSession } });
  assert.equal(revoked.status, 401, "Password reset must revoke existing sessions");
  assert.equal((await request("/api/auth/reset-password", "POST", { token: resetToken, password: firstPassword }, false)).status, 400);
  cookie = "";
  assert.equal((await request("/api/auth/login", "POST", { email, password: secondPassword, code: secondRecovery })).status, 200);
  const archive = await request("/api/finance/full-export");
  assert.equal(archive.status, 200);
  assert.equal(archive.data.policyAcceptances.length, 2);
  assert.equal((await request("/api/auth/delete-account", "POST", { password: secondPassword, confirmation: "DELETE MY ACCOUNT" })).status, 200);
  assert.equal(await db.user.count({ where: { email } }), 0);
  console.log("PASS: verification/reset cannot bypass MFA; token replay, concurrent recovery-code reuse, session revocation, TOTP, full export, and deletion.");
} finally {
  await db.user.deleteMany({ where: { email } });
  await db.$disconnect();
}
