import { db } from "../src/server/db";
async function main() {
try {
  const now = new Date();
  const [sessions, buckets, tokens] = await db.$transaction([
    db.session.deleteMany({ where: { expires: { lt: now } } }),
    db.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.userToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] } }),
  ]);
  console.log(
    `Removed ${sessions.count} expired sessions, ${buckets.count} expired rate-limit buckets, and ${tokens.count} expired or used account tokens.`,
  );
} finally {
  await db.$disconnect();
}
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
