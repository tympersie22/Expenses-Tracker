-- Remove the unused OAuth table before production. It contained plaintext token columns.
DROP TABLE IF EXISTS "Account";

ALTER TABLE "User"
  ADD COLUMN "twoFactorSecret" TEXT,
  ADD COLUMN "twoFactorPending" TEXT;

ALTER TABLE "Session"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "userAgent" TEXT,
  ADD COLUMN "ipHash" TEXT;

CREATE TABLE "UserToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserToken_tokenHash_key" ON "UserToken"("tokenHash");
CREATE INDEX "UserToken_userId_type_idx" ON "UserToken"("userId", "type");
CREATE INDEX "UserToken_expiresAt_idx" ON "UserToken"("expiresAt");
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FinancialAccount"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

ALTER TABLE "Movement" ADD COLUMN "correctedFromId" TEXT;
CREATE UNIQUE INDEX "Movement_correctedFromId_key" ON "Movement"("correctedFromId");
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_correctedFromId_fkey"
  FOREIGN KEY ("correctedFromId") REFERENCES "Movement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditEvent"
  ADD COLUMN "previousHash" TEXT,
  ADD COLUMN "eventHash" TEXT,
  ADD COLUMN "detail" JSONB;
CREATE UNIQUE INDEX "AuditEvent_eventHash_key" ON "AuditEvent"("eventHash");

-- Financial audit records can be appended or removed through user deletion, but never rewritten.
CREATE OR REPLACE FUNCTION reject_audit_event_update() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Audit events are append-only';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "AuditEvent_append_only"
  BEFORE UPDATE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION reject_audit_event_update();
