CREATE TABLE "StatementBatch" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "sourceHash" TEXT NOT NULL,
  "statementDate" DATE NOT NULL,
  "closingBalance" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StatementBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StatementItem" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "occurredOn" DATE NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "amount" BIGINT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "suggestedMatchId" TEXT,
  "matchedMovementId" TEXT,
  "postedMovementId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StatementItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StatementBatch_userId_createdAt_idx" ON "StatementBatch"("userId", "createdAt");
CREATE UNIQUE INDEX "StatementBatch_userId_sourceHash_key" ON "StatementBatch"("userId", "sourceHash");
CREATE INDEX "StatementBatch_accountId_userId_idx" ON "StatementBatch"("accountId", "userId");
CREATE UNIQUE INDEX "StatementItem_batchId_rowNumber_key" ON "StatementItem"("batchId", "rowNumber");
CREATE INDEX "StatementItem_batchId_status_idx" ON "StatementItem"("batchId", "status");
CREATE INDEX "StatementItem_fingerprint_idx" ON "StatementItem"("fingerprint");

ALTER TABLE "StatementBatch" ADD CONSTRAINT "StatementBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatementBatch" ADD CONSTRAINT "StatementBatch_accountId_userId_fkey" FOREIGN KEY ("accountId", "userId") REFERENCES "FinancialAccount"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatementItem" ADD CONSTRAINT "StatementItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StatementBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StatementItem" ADD CONSTRAINT "StatementItem_suggestedMatchId_fkey" FOREIGN KEY ("suggestedMatchId") REFERENCES "Movement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StatementItem" ADD CONSTRAINT "StatementItem_matchedMovementId_fkey" FOREIGN KEY ("matchedMovementId") REFERENCES "Movement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StatementItem" ADD CONSTRAINT "StatementItem_postedMovementId_fkey" FOREIGN KEY ("postedMovementId") REFERENCES "Movement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StatementItem" ADD CONSTRAINT "StatementItem_status_check" CHECK ("status" IN ('pending', 'posted', 'matched', 'skipped'));
ALTER TABLE "StatementItem" ADD CONSTRAINT "StatementItem_kind_check" CHECK ("kind" IN ('income', 'expense'));
ALTER TABLE "StatementItem" ADD CONSTRAINT "StatementItem_amount_positive_check" CHECK ("amount" > 0);
