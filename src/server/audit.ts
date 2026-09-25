import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";

type AuditPayload = {
  userId: string; action: string; entityId: string; createdAt: Date;
  previousHash: string | null; detail?: unknown; hashVersion: number;
};
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]),
  );
  return value;
}
export function auditHash(event: AuditPayload) {
  let detail: unknown = event.detail ?? null;
  // The original writer ordered account-update keys this way before JSONB storage.
  if (event.hashVersion === 1 && event.action === "account.updated" && detail && typeof detail === "object") {
    const fields = detail as Record<string, unknown>;
    detail = { name: fields.name, kind: fields.kind };
  }
  if (event.hashVersion >= 2) detail = canonical(detail);
  return createHash("sha256").update(JSON.stringify({
    userId: event.userId, action: event.action, entityId: event.entityId,
    createdAt: event.createdAt.toISOString(), previousHash: event.previousHash, detail,
  })).digest("hex");
}

export function verifyAuditChain(events: (AuditPayload & { id: string; eventHash: string | null })[]) {
  let previousHash: string | null = null;
  let legacyUnhashed = 0;
  for (const event of events) {
    if (!event.eventHash && !previousHash) { legacyUnhashed++; continue; }
    if (!event.eventHash || event.previousHash !== previousHash || auditHash(event) !== event.eventHash)
      throw new Error(`Audit integrity check failed at ${event.id}`);
    previousHash = event.eventHash;
  }
  return { verified: events.length - legacyUnhashed, legacyUnhashed, head: previousHash };
}

export async function appendAudit(
  tx: Prisma.TransactionClient,
  userId: string,
  action: string,
  entityId: string,
  detail?: Prisma.InputJsonValue,
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
  const previous = await tx.auditEvent.findFirst({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { eventHash: true, createdAt: true },
  });
  const createdAt = new Date(Math.max(Date.now(), (previous?.createdAt.getTime() ?? 0) + 1));
  const previousHash = previous?.eventHash ?? null;
  const hashVersion = 2;
  const eventHash = auditHash({ userId, action, entityId, createdAt, previousHash, detail, hashVersion });
  return tx.auditEvent.create({
    data: { userId, action, entityId, createdAt, previousHash, eventHash, detail, hashVersion },
  });
}
