CREATE TABLE "PolicyAcceptance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "policyVersion" TEXT NOT NULL,
  "policyType" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipHash" TEXT,
  CONSTRAINT "PolicyAcceptance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PolicyAcceptance_userId_policyVersion_policyType_key" ON "PolicyAcceptance"("userId", "policyVersion", "policyType");
CREATE INDEX "PolicyAcceptance_userId_acceptedAt_idx" ON "PolicyAcceptance"("userId", "acceptedAt");
ALTER TABLE "PolicyAcceptance" ADD CONSTRAINT "PolicyAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
