import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  clientRateLimitSubject,
  createSession,
  currentSessionHash,
  logout,
  rateLimit,
  requireUser,
  verifyPassword,
} from "@/server/auth";
import { db } from "@/server/db";
import { handle, assertOrigin, readBody, json } from "@/server/http";
import { currency } from "@/server/validation";
import { AppError } from "@/server/errors";
import { base32, decrypt, encrypt, verifyTotp } from "@/server/secure-data";
import { sendAccountEmail } from "@/server/mail";

const credentials = z.object({
  email: z.string().trim().email().max(254).transform((x) => x.toLowerCase()),
  password: z.string().min(1).max(72),
  code: z.string().trim().regex(/^(\d{6}|[a-z0-9]{8}-[a-z0-9]{8})$/i).optional(),
});
const tokenHash = (value: string) => createHash("sha256").update(value).digest("hex");

async function issueToken(userId: string, type: "verify" | "reset", minutes: number) {
  const token = randomBytes(32).toString("base64url");
  await db.$transaction([
    db.userToken.deleteMany({ where: { userId, type, usedAt: null } }),
    db.userToken.create({
      data: { userId, type, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + minutes * 60_000) },
    }),
  ]);
  return token;
}

async function emailToken(type: "verify" | "reset", email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || (type === "verify" && user.emailVerified)) return;
  const token = await issueToken(user.id, type, type === "verify" ? 60 * 24 : 30);
  await sendAccountEmail(type, user.email, token);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  return handle(async () => {
    const { action } = await params;
    if (action !== "sessions") throw new AppError("Not found.", 404);
    const user = await requireUser({ allowUnverified: true });
    const current = await currentSessionHash();
    const sessions = await db.session.findMany({
      where: { userId: user.id, expires: { gt: new Date() } },
      select: { id: true, sessionToken: true, createdAt: true, lastSeenAt: true, expires: true, userAgent: true },
      orderBy: { lastSeenAt: "desc" },
    });
    return json({
      sessions: sessions.map(({ sessionToken, ...session }) => ({ ...session, current: sessionToken === current })),
    });
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  return handle(async () => {
    assertOrigin(request);
    const { action } = await params;
    const ip = clientRateLimitSubject(request);

    if (action === "logout") {
      await logout();
      return json({ ok: true });
    }
    if (action === "forgot-password" || action === "resend-verification") {
      const { email } = credentials.pick({ email: true }).parse(await readBody(request));
      await rateLimit(action, email, 5, 30);
      await rateLimit(`${action}-ip`, ip, 20, 30);
      await emailToken(action === "forgot-password" ? "reset" : "verify", email);
      return json({ ok: true, message: "If the account can receive this email, a secure link is on its way." });
    }
    if (action === "verify-email") {
      const { token } = z.object({ token: z.string().min(30).max(200) }).parse(await readBody(request));
      await rateLimit("verify-token", ip, 20, 30);
      const record = await db.userToken.findUnique({ where: { tokenHash: tokenHash(token) } });
      if (!record || record.type !== "verify" || record.usedAt || record.expiresAt <= new Date())
        throw new AppError("This verification link is invalid or has expired.", 400);
      await db.$transaction(async (tx) => {
        const claimed = await tx.userToken.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
        if (claimed.count !== 1) throw new AppError("This verification link was already used.", 409);
        await tx.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
      });
      // Proving mailbox ownership must never bypass password or enabled MFA.
      return json({ ok: true, signInRequired: true });
    }
    if (action === "reset-password") {
      const data = z.object({
        token: z.string().min(30).max(200),
        password: z.string().min(12, "Use at least 12 characters.").max(72),
      }).parse(await readBody(request));
      if (Buffer.byteLength(data.password) > 72) throw new AppError("Password must fit in 72 UTF-8 bytes.");
      await rateLimit("reset-token", ip, 10, 30);
      const record = await db.userToken.findUnique({ where: { tokenHash: tokenHash(data.token) } });
      if (!record || record.type !== "reset" || record.usedAt || record.expiresAt <= new Date())
        throw new AppError("This reset link is invalid or has expired.", 400);
      const password = await bcrypt.hash(data.password, 12);
      await db.$transaction(async (tx) => {
        const claimed = await tx.userToken.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
        if (claimed.count !== 1) throw new AppError("This reset link was already used.", 409);
        await tx.user.update({ where: { id: record.userId }, data: { password, failedAttempts: 0, lockedUntil: null } });
        await tx.session.deleteMany({ where: { userId: record.userId } });
      });
      await logout();
      return json({ ok: true, signInRequired: true });
    }

    if (action === "password") {
      const user = await requireUser({ allowUnverified: true });
      await rateLimit("password", user.id, 10);
      const data = z.object({ current: z.string().max(72), password: z.string().min(12, "Use at least 12 characters.").max(72) }).parse(await readBody(request));
      if (Buffer.byteLength(data.password) > 72) throw new AppError("Password must fit in 72 UTF-8 bytes.");
      const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      if (!(await verifyPassword(data.current, record.password))) throw new AppError("Current password is incorrect.", 400);
      const password = await bcrypt.hash(data.password, 12);
      await db.$transaction([
        db.user.update({ where: { id: user.id }, data: { password } }),
        db.session.deleteMany({ where: { userId: user.id } }),
      ]);
      await createSession(user.id, request);
      return json({ ok: true });
    }
    if (action === "revoke-session") {
      const user = await requireUser({ allowUnverified: true });
      const { id } = z.object({ id: z.string().cuid() }).parse(await readBody(request));
      const current = await currentSessionHash();
      const session = await db.session.findFirst({ where: { id, userId: user.id } });
      if (!session) throw new AppError("Session not found.", 404);
      if (session.sessionToken === current) throw new AppError("Sign out to end this session.", 400);
      await db.session.delete({ where: { id } });
      return json({ ok: true });
    }
    if (action === "mfa-setup") {
      const user = await requireUser({ allowUnverified: true });
      await rateLimit("mfa", user.id, 10, 30);
      const { password } = credentials.pick({ password: true }).parse(await readBody(request));
      const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      if (!(await verifyPassword(password, record.password))) throw new AppError("Current password is incorrect.", 400);
      if (record.twoFactorEnabled) throw new AppError("Disable your existing authenticator before replacing it.", 409);
      const secret = base32(randomBytes(20));
      await db.user.update({ where: { id: user.id }, data: { twoFactorPending: encrypt(secret) } });
      const label = encodeURIComponent(`Expenses Tracker:${user.email}`);
      return json({ secret, uri: `otpauth://totp/${label}?secret=${secret}&issuer=Expenses%20Tracker&digits=6&period=30` });
    }
    if (action === "mfa-enable") {
      const user = await requireUser({ allowUnverified: true });
      await rateLimit("mfa", user.id, 10, 30);
      const { code } = z.object({ code: z.string().regex(/^\d{6}$/) }).parse(await readBody(request));
      const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      if (record.twoFactorEnabled || !record.twoFactorPending || !verifyTotp(decrypt(record.twoFactorPending), code))
        throw new AppError("The authentication code is incorrect.", 400);
      const recoveryCodes = Array.from({ length: 8 }, () => `${randomBytes(4).toString("hex")}-${randomBytes(4).toString("hex")}`);
      const current = await currentSessionHash();
      await db.$transaction(async (tx) => {
        const enabled = await tx.user.updateMany({ where: { id: user.id, twoFactorEnabled: false, twoFactorPending: record.twoFactorPending }, data: { twoFactorSecret: record.twoFactorPending, twoFactorPending: null, twoFactorEnabled: true, twoFactorRecovery: recoveryCodes.map(tokenHash) } });
        if (enabled.count !== 1) throw new AppError("Authenticator setup changed. Start again.", 409);
        await tx.session.deleteMany({ where: { userId: user.id, ...(current ? { sessionToken: { not: current } } : {}) } });
      });
      return json({ ok: true, recoveryCodes });
    }
    if (action === "mfa-disable") {
      const user = await requireUser({ allowUnverified: true });
      await rateLimit("mfa", user.id, 10, 30);
      const data = z.object({ password: z.string().max(72), code: z.string().regex(/^(\d{6}|[a-z0-9]{8}-[a-z0-9]{8})$/i) }).parse(await readBody(request));
      const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      const validMfa = !!record.twoFactorSecret && (verifyTotp(decrypt(record.twoFactorSecret), data.code) || record.twoFactorRecovery.includes(tokenHash(data.code.toLowerCase())));
      if (!(await verifyPassword(data.password, record.password)) || !validMfa)
        throw new AppError("Password or authentication code is incorrect.", 400);
      await db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorPending: null, twoFactorRecovery: [] } });
      return json({ ok: true });
    }
    if (action === "delete-account") {
      const user = await requireUser({ allowUnverified: true });
      await rateLimit("delete-account", user.id, 5, 60);
      const data = z.object({ password: z.string().max(72), confirmation: z.literal("DELETE MY ACCOUNT") }).parse(await readBody(request));
      const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      if (!(await verifyPassword(data.password, record.password))) throw new AppError("Current password is incorrect.", 400);
      await db.user.delete({ where: { id: user.id } });
      await logout();
      return json({ ok: true });
    }

    if (!["login", "signup"].includes(action)) throw new AppError("Not found.", 404);
    const raw = await readBody(request);
    const data = credentials.parse(raw);
    await rateLimit(action, data.email, 10);
    await rateLimit(`${action}-ip`, ip, action === "signup" ? 20 : 50);
    if (action === "signup") {
      const signup = credentials.extend({
        name: z.string().trim().min(1).max(80),
        currency,
        acceptTerms: z.literal(true, { errorMap: () => ({ message: "Accept the Terms and Privacy Policy to continue." }) }),
        timeZone: z.string().max(100).refine((x) => {
          try { new Intl.DateTimeFormat("en", { timeZone: x }); return true; }
          catch { return false; }
        }, "Choose a valid time zone."),
      }).parse(raw);
      if (signup.password.length < 12 || Buffer.byteLength(signup.password) > 72)
        throw new AppError("Use at least 12 characters, within 72 UTF-8 bytes.");
      if (await db.user.findUnique({ where: { email: signup.email } }))
        throw new AppError("Unable to create this account. Try signing in or recovering access.", 409);
      const password = await bcrypt.hash(signup.password, 12);
      const user = await db.user.create({ data: {
        email: signup.email, password, firstName: signup.name, baseCurrency: signup.currency, timeZone: signup.timeZone,
        policyAcceptances: { create: [
          { policyVersion: "2026-09-24", policyType: "terms", ipHash: ip },
          { policyVersion: "2026-09-24", policyType: "privacy", ipHash: ip },
        ] },
      } });
      if (process.env.REQUIRE_EMAIL_VERIFICATION === "true") {
        try { await emailToken("verify", user.email); }
        catch (error) { console.error(JSON.stringify({ level: "error", type: "verification-email-failed", userId: user.id, error: error instanceof Error ? error.name : "Unknown" })); }
      }
      await createSession(user.id, request);
      return json({ ok: true, verificationRequired: process.env.REQUIRE_EMAIL_VERIFICATION === "true" }, 201);
    }

    const user = await db.user.findUnique({ where: { email: data.email } });
    const validPassword = await verifyPassword(data.password, user?.password);
    if (!validPassword) {
      if (user) {
        const failedAttempts = user.failedAttempts + 1;
        await db.user.update({ where: { id: user.id }, data: { failedAttempts, lastFailedAttempt: new Date(), lockedUntil: failedAttempts >= 8 ? new Date(Date.now() + 15 * 60_000) : null } });
      }
      throw new AppError("Email or password is incorrect.", 401);
    }
    if (user!.lockedUntil && user!.lockedUntil > new Date())
      throw new AppError("This account is temporarily locked. Try again later or reset your password.", 429);
    if (user!.twoFactorEnabled) {
      if (!data.code) return json({ error: "Enter the code from your authenticator app.", mfaRequired: true }, 428);
      const recoveryHash = tokenHash(data.code.toLowerCase());
      const usedRecovery = user!.twoFactorRecovery.includes(recoveryHash);
      if (!user!.twoFactorSecret || (!verifyTotp(decrypt(user!.twoFactorSecret), data.code) && !usedRecovery))
        throw new AppError("The authentication code is incorrect.", 401);
      if (usedRecovery) {
        // One conditional update prevents two concurrent requests using the same code.
        // array_remove preserves other codes consumed by concurrent logins.
        const claimed = await db.$executeRaw`UPDATE "User"
          SET "twoFactorRecovery" = array_remove("twoFactorRecovery", ${recoveryHash})
          WHERE "id" = ${user!.id} AND "twoFactorEnabled" = true
            AND "twoFactorSecret" = ${user!.twoFactorSecret}
            AND "password" = ${user!.password}
            AND ${recoveryHash} = ANY("twoFactorRecovery")`;
        if (claimed !== 1) throw new AppError("The recovery code is no longer available.", 401);
      }
    }
    await db.user.update({ where: { id: user!.id }, data: { failedAttempts: 0, lockedUntil: null } });
    await createSession(user!.id, request);
    return json({ ok: true, verificationRequired: process.env.REQUIRE_EMAIL_VERIFICATION === "true" && !user!.emailVerified });
  });
}
