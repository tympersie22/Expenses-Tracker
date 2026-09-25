CREATE TABLE "RecurringPattern" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "cadence" TEXT NOT NULL,
  "cadenceDays" INTEGER NOT NULL,
  "typicalAmount" BIGINT NOT NULL,
  "minimumAmount" BIGINT NOT NULL,
  "maximumAmount" BIGINT NOT NULL,
  "evidenceCount" INTEGER NOT NULL,
  "lastObservedOn" DATE NOT NULL,
  "nextDueOn" DATE NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'suggested',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecurringPattern_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RecurringPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RecurringPattern_accountId_userId_fkey" FOREIGN KEY ("accountId", "userId") REFERENCES "FinancialAccount"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RecurringPattern_status_check" CHECK ("status" IN ('suggested', 'active', 'dismissed')),
  CONSTRAINT "RecurringPattern_kind_check" CHECK ("kind" IN ('income', 'expense')),
  CONSTRAINT "RecurringPattern_cadence_check" CHECK ("cadence" IN ('weekly', 'monthly')),
  CONSTRAINT "RecurringPattern_amount_check" CHECK ("typicalAmount" > 0 AND "minimumAmount" > 0 AND "maximumAmount" >= "minimumAmount"),
  CONSTRAINT "RecurringPattern_evidence_check" CHECK ("evidenceCount" >= 3),
  CONSTRAINT "RecurringPattern_days_check" CHECK ("cadenceDays" BETWEEN 1 AND 366)
);

CREATE UNIQUE INDEX "RecurringPattern_userId_sourceKey_key" ON "RecurringPattern"("userId", "sourceKey");
CREATE INDEX "RecurringPattern_userId_status_nextDueOn_idx" ON "RecurringPattern"("userId", "status", "nextDueOn");
CREATE INDEX "RecurringPattern_accountId_userId_idx" ON "RecurringPattern"("accountId", "userId");
