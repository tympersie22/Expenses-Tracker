import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import { db } from "../src/server/db";
import { createAccount, createMovement, correctMovement, createBill, payBill, saveBudget, saveGoal, importTransactions } from "../src/server/ledger";
import { snapshot } from "../src/server/snapshot";
import { verifyAuditChain } from "../src/server/audit";

const name = new URL(process.env.DATABASE_URL!).pathname.slice(1);
if (!/^expenses_recovery_(source|restore_drill)_[a-f0-9]+$/.test(name)) throw new Error("Dedicated recovery fixture database required");
const [mode, file] = process.argv.slice(2);
const stringify = (value: unknown) => JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item);
async function main() {
try {
  if (mode === "seed") {
    const password = await bcrypt.hash("Recovery-drill-passphrase-2026", 12);
    const user = await db.user.create({ data: { email: "recovery@example.test", password, firstName: "Recovery", emailVerified: true } });
    await db.user.create({ data: { email: "isolation@example.test", password, firstName: "Isolated", emailVerified: true } });
    const day = (await snapshot(user.id)).today;
    const account = async (currency: string, balance: string) => createAccount(user.id, { name: currency, kind: "bank", currency, openingBalance: balance, openingDate: day, idempotencyKey: randomUUID() });
    const usd = await account("USD", "1000");
    const savings = await account("USD", "500");
    await account("JPY", "12000");
    await account("KWD", "123.456");
    await createMovement(user.id, { accountId: usd.id, toAccountId: savings.id, kind: "transfer", description: "Reserve transfer", category: "Other", amount: "100", date: day, idempotencyKey: randomUUID() });
    const expense = await createMovement(user.id, { accountId: usd.id, kind: "expense", description: "Original", category: "Other", amount: "10", date: day, idempotencyKey: randomUUID() });
    await correctMovement(user.id, expense.id, { accountId: usd.id, kind: "expense", description: "Corrected", category: "Other", amount: "12.34", date: day, idempotencyKey: randomUUID() });
    await importTransactions(user.id, { accountId: usd.id, rows: [{ date: day, description: "Imported", amount: "20", type: "expense", category: "Other" }] });
    await saveGoal(user.id, { accountId: savings.id, name: "Emergency", target: "1000", reserved: "200" });
    await saveBudget(user.id, { currency: "USD", category: "Other", month: day.slice(0, 7), amount: "200" });
    const bill = await createBill(user.id, { accountId: usd.id, title: "Paid bill", category: "Other", amount: "50", dueOn: day });
    await payBill(user.id, bill.id, randomUUID());
    await createBill(user.id, { accountId: usd.id, title: "Upcoming bill", category: "Other", amount: "25", dueOn: day });
  }
  const users = await db.user.findMany({ orderBy: { id: "asc" } });
  const records = {
    users,
    accounts: await db.financialAccount.findMany({ orderBy: { id: "asc" } }),
    movements: await db.movement.findMany({ orderBy: { id: "asc" } }),
    entries: await db.ledgerEntry.findMany({ orderBy: { id: "asc" } }),
    budgets: await db.budget.findMany({ orderBy: { id: "asc" } }),
    goals: await db.goal.findMany({ orderBy: { id: "asc" } }),
    bills: await db.bill.findMany({ orderBy: { id: "asc" } }),
    audit: await db.auditEvent.findMany({ orderBy: [{ createdAt: "asc" }, { id: "asc" }] }),
  };
  const states = await Promise.all(users.map((user) => snapshot(user.id)));
  const state = states.find((value) => value.user.email === "recovery@example.test")!;
  assert.equal(state.summaries.find((value) => value.currency === "USD")!.balance, "141766");
  assert.equal(state.summaries.find((value) => value.currency === "KWD")!.balance, "123456");
  assert.equal(state.summaries.find((value) => value.currency === "JPY")!.balance, "12000");
  assert.equal(states.find((value) => value.user.email === "isolation@example.test")!.accounts.length, 0);
  assert.ok(await bcrypt.compare("Recovery-drill-passphrase-2026", users[0].password));
  const integrity = users.map((user) => verifyAuditChain(records.audit.filter((event) => event.userId === user.id)));
  const manifest = stringify({ records, states });
  if (mode === "seed") writeFileSync(file, manifest, { mode: 0o600 });
  else assert.equal(manifest, readFileSync(file, "utf8"), "Every record and financial snapshot must match before/after restore");
  console.log(JSON.stringify({ mode, counts: Object.fromEntries(Object.entries(records).map(([key, value]) => [key, value.length])), balances: state.summaries.map(({ currency, balance }) => ({ currency, balance })), digest: createHash("sha256").update(manifest).digest("hex"), auditEventsVerified: integrity.reduce((sum, value) => sum + value.verified, 0) }));
} finally { await db.$disconnect(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
