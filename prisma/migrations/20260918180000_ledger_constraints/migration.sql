ALTER TABLE "FinancialAccount" ADD CONSTRAINT "financial_currency_format" CHECK ("currency" ~ '^[A-Z]{3}$');
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "financial_kind" CHECK ("kind" IN ('bank','cash','mobile-money','savings','wallet'));
ALTER TABLE "Movement" ADD CONSTRAINT "movement_kind" CHECK ("kind" IN ('opening','income','expense','transfer'));
ALTER TABLE "Budget" ADD CONSTRAINT "budget_positive" CHECK ("limit" > 0);
ALTER TABLE "Bill" ADD CONSTRAINT "bill_positive" CHECK ("amount" > 0);
ALTER TABLE "Goal" ADD CONSTRAINT "goal_amounts" CHECK ("target" > 0 AND "reserved" >= 0 AND "reserved" <= "target");
ALTER TABLE "Bill" ADD CONSTRAINT "bill_payment_consistent" CHECK (("paidAt" IS NULL AND "movementId" IS NULL) OR ("paidAt" IS NOT NULL AND "movementId" IS NOT NULL));
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expires_idx" ON "Session"("expires");
