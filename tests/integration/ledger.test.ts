import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../../src/server/db";
import {
  createAccount,
  createMovement,
  voidMovement,
  saveBudget,
  saveGoal,
  createBill,
  payBill,
  importTransactions,
  updateAccount,
  archiveAccount,
  correctMovement,
} from "../../src/server/ledger";
import { snapshot } from "../../src/server/snapshot";
import { getInbox, reviewStatement, stageStatement } from "../../src/server/inbox";
import { decideRecurring, scanRecurring } from "../../src/server/recurring";
import { dateOnly, today } from "../../src/domain/money";
import { verifyAuditChain } from "../../src/server/audit";
if (!process.env.DATABASE_URL?.includes("money_well_test"))
  throw new Error(
    "Integration tests require the dedicated money_well_test database.",
  );
let alice: string, bob: string, checking: string, savings: string, euro: string;
const day = "2026-01-15";
before(async () => {
  alice = (
    await db.user.create({
      data: {
        email: `alice-${randomUUID()}@example.test`,
        password: "unused-test-hash",
        firstName: "Alice",
      },
    })
  ).id;
  bob = (
    await db.user.create({
      data: {
        email: `bob-${randomUUID()}@example.test`,
        password: "unused-test-hash",
        firstName: "Bob",
      },
    })
  ).id;
  const make = async (name: string, currency: string, balance: string) => {
    await createAccount(alice, {
      name,
      kind: "bank",
      currency,
      openingBalance: balance,
      openingDate: day,
      idempotencyKey: randomUUID(),
    });
    return (
      await db.financialAccount.findFirstOrThrow({
        where: { userId: alice, name },
      })
    ).id;
  };
  checking = await make("Checking", "USD", "1000");
  savings = await make("Savings", "USD", "500");
  euro = await make("Euro", "EUR", "200");
});
after(async () => {
  await db.user.deleteMany({
    where: { id: { in: [alice, bob].filter(Boolean) } },
  });
  await db.$disconnect();
});
test("ledger persists, scopes access, and preserves transfer balance", async () => {
  const request = {
    accountId: checking,
    toAccountId: savings,
    kind: "transfer",
    description: "Save",
    category: "Other",
    amount: "100",
    date: day,
    idempotencyKey: randomUUID(),
  };
  await Promise.all([
    createMovement(alice, request),
    createMovement(alice, request),
  ]);
  const state = await snapshot(alice);
  assert.equal(state.accounts.find((a) => a.id === checking)!.balance, "90000");
  assert.equal(state.accounts.find((a) => a.id === savings)!.balance, "60000");
  assert.equal(
    state.summaries.find((s) => s.currency === "USD")!.balance,
    "150000",
  );
  assert.equal(
    state.summaries.find((s) => s.currency === "EUR")!.balance,
    "20000",
  );
  await assert.rejects(
    () => createMovement(bob, { ...request, idempotencyKey: randomUUID() }),
    /Account not found/,
  );
  await assert.rejects(
    () =>
      createMovement(alice, {
        ...request,
        toAccountId: euro,
        idempotencyKey: randomUUID(),
      }),
    /matching currencies/,
  );
  await assert.rejects(
    () => createMovement(alice, { ...request, amount: "20" }),
    /different data/,
  );
  assert.equal((await snapshot(bob)).accounts.length, 0);
});
test("accounts can be renamed and safely closed, and corrections retain the original", async () => {
  const empty = await createAccount(alice, {
    name: "Temporary", kind: "cash", currency: "USD", openingBalance: "0", openingDate: day,
    idempotencyKey: randomUUID(),
  });
  await updateAccount(alice, empty.id, { name: "Envelope", kind: "wallet" });
  assert.equal((await db.financialAccount.findUniqueOrThrow({ where: { id: empty.id } })).name, "Envelope");
  await archiveAccount(alice, empty.id);
  assert.equal((await snapshot(alice)).accounts.some((account) => account.id === empty.id), false);
  await assert.rejects(() => archiveAccount(bob, checking), /not found/);

  const correctionAccount = (await createAccount(bob, {
    name: "Correction account", kind: "cash", currency: "USD", openingBalance: "100", openingDate: day,
    idempotencyKey: randomUUID(),
  })).id;
  const created = await createMovement(bob, {
    accountId: correctionAccount, kind: "expense", description: "Correction original", category: "Other",
    amount: "10", date: day, idempotencyKey: randomUUID(),
  });
  const replacement = await correctMovement(bob, created.id, {
    accountId: correctionAccount, kind: "expense", description: "Correction replacement", category: "Transport",
    amount: "12", date: day, idempotencyKey: randomUUID(),
  });
  const [oldRecord, newRecord] = await Promise.all([
    db.movement.findUniqueOrThrow({ where: { id: created.id } }),
    db.movement.findUniqueOrThrow({ where: { id: replacement.id } }),
  ]);
  assert.ok(oldRecord.voidedAt);
  assert.equal(newRecord.correctedFromId, oldRecord.id);
  await assert.rejects(() => correctMovement(bob, created.id, {
    accountId: correctionAccount, kind: "expense", description: "Again", category: "Other",
    amount: "1", date: day, idempotencyKey: randomUUID(),
  }), /no longer available/);
  const events = await db.auditEvent.findMany({ where: { userId: bob }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
  assert.ok(events.every((event) => event.eventHash));
  assert.equal(verifyAuditChain(events).verified, events.length);
  assert.throws(() => verifyAuditChain(events.map((event, index) => index === 0 ? { ...event, action: "modified" } : event)), /integrity/);
  await assert.rejects(() => db.auditEvent.update({ where: { id: events[0].id }, data: { action: "modified" } }), /append-only/);
  await assert.rejects(() => db.auditEvent.delete({ where: { id: events[0].id } }), /account deletion/);
});
test("bills, goals, and voiding recompute the same available balance", async () => {
  await saveGoal(alice, {
    accountId: savings,
    name: "Safety net",
    target: "1000",
    reserved: "300",
  });
  await assert.rejects(
    () =>
      saveGoal(alice, {
        accountId: savings,
        name: "Too much",
        target: "1000",
        reserved: "900",
      }),
    /enough money/,
  );
  const state = await snapshot(alice);
  const bill = await createBill(alice, {
    accountId: checking,
    title: "Rent",
    category: "Housing",
    amount: "200",
    dueOn: state.today,
  });
  const before = (await snapshot(alice)).summaries.find(
    (s) => s.currency === "USD",
  )!;
  assert.equal(before.available, "100000");
  const payment = await payBill(alice, bill.id, randomUUID());
  await payBill(alice, bill.id, randomUUID());
  const paid = (await snapshot(alice)).summaries.find(
    (s) => s.currency === "USD",
  )!;
  assert.equal(paid.available, before.available);
  assert.equal(paid.balance, "130000");
  assert.equal(paid.bills, "0");
  await voidMovement(alice, payment.id!);
  const restored = (await snapshot(alice)).summaries.find(
    (s) => s.currency === "USD",
  )!;
  assert.equal(restored.balance, "150000");
  assert.equal(restored.bills, "20000");
  await assert.rejects(() => voidMovement(bob, payment.id!), /not found/);
  const audit = await db.auditEvent.count({
    where: { userId: alice, action: "transaction.voided" },
  });
  assert.equal(audit, 1);
});
test("imports deduplicate and roll back invalid batches", async () => {
  const row = {
    date: day,
    description: "Groceries",
    amount: "20.25",
    type: "expense",
    category: "Food & groceries",
  };
  assert.deepEqual(
    await importTransactions(alice, { accountId: checking, rows: [row, row] }),
    { imported: 1, duplicates: 1 },
  );
  assert.deepEqual(
    await importTransactions(alice, { accountId: checking, rows: [row] }),
    { imported: 0, duplicates: 1 },
  );
  const before = (await snapshot(alice)).summaries.find(
    (s) => s.currency === "USD",
  )!.balance;
  await assert.rejects(
    () =>
      importTransactions(alice, {
        accountId: checking,
        rows: [
          { ...row, description: "Should roll back" },
          { ...row, amount: "0.001" },
        ],
      }),
    /Row 3/,
  );
  assert.equal(
    (await snapshot(alice)).summaries.find((s) => s.currency === "USD")!
      .balance,
    before,
  );
  await saveBudget(alice, {
    category: "Food & groceries",
    currency: "USD",
    month: (await snapshot(alice)).month,
    amount: "200",
  });
  assert.equal((await snapshot(alice)).budgets.length, 1);
});
test("statement inbox reviews duplicate rows and reconciles the closing balance", async () => {
  const before = (await snapshot(alice)).accounts.find((a) => a.id === checking)!;
  const expected = (BigInt(before.balance) - 1735n) / 100n;
  const cents = (BigInt(before.balance) - 1735n) % 100n;
  const closingBalance = `${expected}.${cents.toString().padStart(2, "0")}`;
  const row = {
    date: day, description: "Inbox verification 1735", amount: "17.35",
    type: "expense" as const, category: "Other" as const,
  };
  const staged = await stageStatement(alice, {
    accountId: checking, fileName: "verification.csv", statementDate: day,
    closingBalance, rows: [row, row],
  });
  assert.equal(staged.batch?.items.length, 2);
  assert.equal(staged.batch?.reconciliation!.difference, "-17.35");
  const same = await stageStatement(alice, {
    accountId: checking, fileName: "verification.csv", statementDate: day,
    closingBalance, rows: [row, row],
  });
  assert.equal(same.batch?.id, staged.batch?.id);
  const firstId = staged.batch!.items[0].id;
  const posted = await reviewStatement(alice, { action: "post", itemId: firstId });
  assert.equal(posted.batch?.items[0].status, "posted");
  assert.equal(posted.batch?.items[1].suggestedMatch?.id, posted.batch?.items[0].postedMovementId);
  assert.equal(posted.batch?.reconciliation!.balanced, true);
  const matched = await reviewStatement(alice, { action: "match", itemId: posted.batch!.items[1].id });
  assert.equal(matched.batch?.items[1].status, "matched");
  assert.equal(matched.batch?.reconciliation!.difference, "0.00");
  assert.equal((await getInbox(bob)).batch, null);
  await assert.rejects(() => reviewStatement(bob, { action: "skip", itemId: firstId }), /not found/);
});
test("recurring suggestions require confirmation before entering the forecast", async () => {
  const current = today("UTC");
  const shifted = (days: number) => {
    const value = dateOnly(current);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  };
  for (const date of [shifted(-60), shifted(-30), current]) {
    await createMovement(alice, {
      accountId: checking, kind: "expense", description: "Signal Monthly Test",
      category: "Utilities", amount: "25", date, idempotencyKey: randomUUID(),
    });
  }
  assert.deepEqual(await scanRecurring(alice), { found: 1 });
  let view = await snapshot(alice);
  const pattern = view.recurring.find((item) => item.title === "Signal Monthly Test")!;
  assert.equal(pattern.status, "suggested");
  const before = view.forecast.find((item) => item.currency === "USD")!;
  assert.ok(before.points.every((point) => !point.events.includes("Signal Monthly Test")));
  await decideRecurring(alice, { id: pattern.id, action: "confirm" });
  view = await snapshot(alice);
  const after = view.forecast.find((item) => item.currency === "USD")!;
  assert.equal(BigInt(after.endBalance), BigInt(before.endBalance) - 2500n);
  assert.ok(after.points.some((point) => point.events.includes("Signal Monthly Test")));
});
