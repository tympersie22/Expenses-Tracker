import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import { AppError } from "./errors";

export const SESSION_COOKIE = "expenses_tracker_session";
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function rateLimit(
  scope: string,
  subject: string,
  max: number,
  minutes = 15,
) {
  const window = Math.floor(Date.now() / (minutes * 60_000));
  const expiresAt = new Date((window + 1) * minutes * 60_000);
  const key = digest(`${scope}:${subject}:${window}`);
  const limit = await db.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt },
    update: { count: { increment: 1 } },
  });
  if (limit.count > max)
    throw new AppError(
      "Too many attempts. Please try again in 15 minutes.",
      429,
    );
}
function clientDetails(request?: Request) {
  const forwardedValues = request?.headers.get("x-forwarded-for")?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  // The nearest trusted reverse proxy appends the right-most value. Do not trust a client-supplied first hop.
  const forwarded = forwardedValues.at(-1);
  const ip = forwarded || request?.headers.get("x-real-ip") || "unknown";
  const salt = process.env.RATE_LIMIT_SALT || process.env.APP_ENCRYPTION_KEY || "development-only";
  return {
    userAgent: request?.headers.get("user-agent")?.slice(0, 300) || null,
    ipHash: ip === "unknown" ? null : digest(`${salt}:${ip}`),
  };
}
export function clientRateLimitSubject(request: Request) {
  return clientDetails(request).ipHash ?? "unknown";
}
export async function createSession(userId: string, request?: Request) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { userId, sessionToken: digest(token), expires, ...clientDetails(request) },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.APP_ORIGIN?.startsWith("https://") ?? false,
    sameSite: "lax",
    path: "/",
    expires,
  });
}
export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.session.findUnique({
    where: { sessionToken: digest(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          baseCurrency: true,
          timeZone: true,
          language: true,
          emailVerified: true,
          twoFactorEnabled: true,
        },
      },
    },
  });
  if (!session || session.expires <= new Date()) return null;
  if (session.lastSeenAt < new Date(Date.now() - 5 * 60_000))
    void db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  return session.user;
}
export async function requireUser(options: { allowUnverified?: boolean } = {}) {
  const user = await currentUser();
  if (!user) throw new AppError("Please sign in to continue.", 401);
  const verificationRequired = process.env.REQUIRE_EMAIL_VERIFICATION === "true";
  if (verificationRequired && !options.allowUnverified && !user.emailVerified)
    throw new AppError("Verify your email to continue.", 403);
  return user;
}
export function needsEmailVerification(user: { emailVerified: boolean }) {
  return process.env.REQUIRE_EMAIL_VERIFICATION === "true" && !user.emailVerified;
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token)
    await db.session.deleteMany({ where: { sessionToken: digest(token) } });
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.APP_ORIGIN?.startsWith("https://") ?? false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
export async function currentSessionHash() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? digest(token) : null;
}
export async function verifyPassword(password: string, hash?: string) {
  // Equal-cost comparison for unknown users reduces timing-based enumeration.
  const fallback =
    "$2b$12$WZKaHC/awXE3uaMGNRuKQ.ACvrfqWLof.o17nJRXqmOL33zDgf.fu";
  const matches = await bcrypt.compare(password, hash ?? fallback);
  return Boolean(hash) && matches;
}
