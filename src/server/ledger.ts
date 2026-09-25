import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { AppError } from "./errors";
import { parseMoney, dateOnly, today } from "@/domain/money";
import {
  transactionInput,
  accountInput,
  budgetInput,
  goalInput,
  billInput,
  importInput,
  accountUpdateInput,
} from "./validation";
import { appendAudit } from "./audit";
export const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
type Tx = Prisma.TransactionClient;
async function ownedAccount(tx: Tx, userId: string, id: string) {
  const account = await tx.financialAccount.findFirst({
    where: { id, userId, archivedAt: null },
  });
  if (!account) throw new AppError("Account not found.", 404);
  return account;
}
function money(value: string, currency: string, negative = false) {
  try {
    return parseMoney(value, currency, negative);
  } catch (e) {
    throw new AppError((e as Error).message);
  }
}
function positive(value: string, currency: string) {
  const n = money(value, currency);
  if (n <= 0n) throw new AppError("Amount must be greater than zero.");
  return n;
}
export async function userWrite<T>(
  userId: string,
  work: (tx: Tx) => Promise<T>,
) {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      return work(tx);
    },
    { timeout: 30_000 },
  );
}
async function existing(
  tx: Tx,
  userId: string,
  key: string,
  requestHash: string,
) {
  const m = await tx.movement.findUnique({
    where: { userId_idempotencyKey: { userId, idempotencyKey: key } },
  });
  if (m && m.requestHash !== requestHash)
    throw new AppError(
      "Request identifier was already used for different data.",
      409,
    );
  return m;
}
async function assertPostedDate(tx: Tx, userId: string, value: string) {
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
  if (value > today(user.timeZone))
    throw new AppError(
      "Future transactions belong in your plan. Choose today or an earlier date.",
    );
  return dateOnly(value);
}
export async function createAccount(userId: string, raw: unknown) {
  const data = accountInput.parse(raw);
  return userWrite(userId, async (tx) => {
    const requestHash = hash(data);
    const previous = await existing(
      tx,
      userId,
      data.idempotencyKey,
      requestHash,
    );
    if (previous) {
      const entry = await tx.ledgerEntry.findFirstOrThrow({
        where: { movementId: previous.id, userId },
      });
      return { id: entry.accountId };
    }
    if ((await tx.financialAccount.count({ where: { userId } })) >= 100)
      throw new AppError("You can have up to 100 financial accounts.");
    const amount = money(data.openingBalance, data.currency, true);
    const occurredOn = await assertPostedDate(tx, userId, data.openingDate);
    const account = await tx.financialAccount.create({
      data: {
        userId,
        name: data.name,
        kind: data.kind,
        currency: data.currency,
      },
    });
    await tx.movement.create({
      data: {
        userId,
        kind: "opening",
        description: `Opening balance · ${data.name}`,
        category: "Other",
        occurredOn,
        idempotencyKey: data.idempotencyKey,
        requestHash,
        entries: { create: { accountId: account.id, amount } },
      },
    });
    await appendAudit(tx, userId, "account.created", account.id);
    return { id: account.id };
  });
}
export async function updateAccount(userId: string, id: string, raw: unknown) {
  const data = accountUpdateInput.parse(raw);
  return userWrite(userId, async (tx) => {
    const account = await tx.financialAccount.findFirst({ where: { id, userId, archivedAt: null } });
    if (!account) throw new AppError("Account not found.", 404);
    await tx.financialAccount.update({ where: { id }, data });
    await appendAudit(tx, userId, "account.updated", id, { name: data.name, kind: data.kind });
    return { ok: true };
  });
}

export async function archiveAccount(userId: string, id: string) {
  return userWrite(userId, async (tx) => {
    const account = await tx.financialAccount.findFirst({ where: { id, userId, archivedAt: null } });
    if (!account) throw new AppError("Account not found.", 404);
    const balance = await tx.ledgerEntry.aggregate({
      where: { userId, accountId: id, movement: { voidedAt: null } }, _sum: { amount: true },
    });
    if ((balance._sum.amount ?? 0n) !== 0n)
      throw new AppError("Move or correct the remaining balance before closing this account.");
    const [goals, bills] = await Promise.all([
      tx.goal.count({ where: { userId, accountId: id } }),
      tx.bill.count({ where: { userId, accountId: id, paidAt: null } }),
    ]);
    if (goals || bills) throw new AppError("Remove this account’s active goals and unpaid bills before closing it.");
    await tx.financialAccount.update({ where: { id }, data: { archivedAt: new Date() } });
    await appendAudit(tx, userId, "account.closed", id);
    return { ok: true };
  });
}
export async function postMovement(
  tx: Tx,
  userId: string,
  data: z.infer<typeof transactionInput>,
  importHash?: string,
) {
  const requestHash = hash(data);
  const previous = await existing(tx, userId, data.idempotencyKey, requestHash);
  if (previous) return previous;
  const source = await ownedAccount(tx, userId, data.accountId);
  const amount = positive(data.amount, source.currency);
  const occurredOn = await assertPostedDate(tx, userId, data.date);
  const entries = [
    { accountId: source.id, amount: data.kind === "income" ? amount : -amount },
  ];
  if (data.kind === "transfer") {
    if (!data.toAccountId || data.toAccountId === source.id)
      throw new AppError("Choose a different destination account.");
    const target = await ownedAccount(tx, userId, data.toAccountId);
    if (target.currency !== source.currency)
      throw new AppError("Transfers currently require matching currencies.");
    entries.push({ accountId: target.id, amount });
  }
  const movement = await tx.movement.create({
    data: {
      userId,
      kind: data.kind,
      description: data.description,
      category: data.kind === "transfer" ? "Other" : data.category,
      occurredOn,
      idempotencyKey: data.idempotencyKey,
      requestHash,
      importHash,
      entries: { create: entries },
    },
  });
  await appendAudit(tx, userId, "transaction.created", movement.id);
  return movement;
}
export async function createMovement(userId: string, raw: unknown) {
  const data = transactionInput.parse(raw);
  return userWrite(userId, (tx) => postMovement(tx, userId, data));
}
export async function correctMovement(userId: string, id: string, raw: unknown) {
  const data = transactionInput.parse(raw);
  return userWrite(userId, async (tx) => {
    const original = await tx.movement.findFirst({
      where: { id, userId }, include: { bill: true, correction: true },
    });
    if (!original) throw new AppError("Transaction not found.", 404);
    if (original.kind === "opening") throw new AppError("Opening balances cannot be corrected here.");
    if (original.voidedAt || original.correction) throw new AppError("This transaction is no longer available for correction.", 409);
    if (original.bill) throw new AppError("Void the bill payment and pay the bill again to correct it.");
    const replacement = await postMovement(tx, userId, data);
    await tx.movement.update({ where: { id: replacement.id }, data: { correctedFromId: original.id } });
    await tx.movement.update({ where: { id: original.id }, data: { voidedAt: new Date() } });
    await appendAudit(tx, userId, "transaction.corrected", original.id, { replacementId: replacement.id });
    return { id: replacement.id };
  });
}
export async function voidMovement(userId: string, id: string) {
  return userWrite(userId, async (tx) => {
    const movement = await tx.movement.findFirst({
      where: { id, userId },
      include: { bill: true },
    });
    if (!movement) throw new AppError("Transaction not found.", 404);
    if (movement.kind === "opening")
      throw new AppError(
        "Opening balances cannot be removed. Add a correction transaction instead.",
      );
    if (movement.voidedAt) return { ok: true };
    await tx.movement.update({ where: { id }, data: { voidedAt: new Date() } });
    if (movement.bill)
      await tx.bill.update({
        where: { id: movement.bill.id },
        data: { paidAt: null, movementId: null },
      });
    await appendAudit(tx, userId, "transaction.voided", id);
    return { ok: true };
  });
}
export async function saveBudget(userId: string, raw: unknown) {
  const data = budgetInput.parse(raw);
  const limit = positive(data.amount, data.currency);
  return userWrite(userId, async (tx) => {
    const budget = await tx.budget.upsert({
      where: {
        userId_currency_month_category: {
          userId,
          currency: data.currency,
          month: data.month,
          category: data.category,
        },
      },
      create: {
        userId,
        currency: data.currency,
        month: data.month,
        category: data.category,
        limit,
      },
      update: { limit },
    });
    await appendAudit(tx, userId, "budget.saved", budget.id);
    return { id: budget.id };
  });
}
export async function saveGoal(userId: string, raw: unknown, id?: string) {
  const data = goalInput.parse(raw);
  return userWrite(userId, async (tx) => {
    if (id && !(await tx.goal.findFirst({ where: { id, userId } })))
      throw new AppError("Goal not found.", 404);
    const account = await ownedAccount(tx, userId, data.accountId);
    const target = positive(data.target, account.currency),
      reserved = money(data.reserved, account.currency);
    if (reserved > target)
      throw new AppError("Reserved amount cannot exceed the target.");
    const sums = await tx.ledgerEntry.aggregate({
      where: { userId, accountId: account.id, movement: { voidedAt: null } },
      _sum: { amount: true },
    });
    const other = await tx.goal.aggregate({
      where: {
        userId,
        accountId: account.id,
        ...(id ? { id: { not: id } } : {}),
      },
      _sum: { reserved: true },
    });
    if (reserved + (other._sum.reserved ?? 0n) > (sums._sum.amount ?? 0n))
      throw new AppError(
        "This account does not have enough money to reserve that amount.",
      );
    const values = { accountId: account.id, name: data.name, target, reserved };
    const goal = id
      ? await tx.goal.update({ where: { id }, data: values })
      : await tx.goal.create({ data: { userId, ...values } });
    await appendAudit(tx, userId, "goal.saved", goal.id);
    return { id: goal.id };
  });
}
export async function createBill(userId: string, raw: unknown) {
  const data = billInput.parse(raw);
  return userWrite(userId, async (tx) => {
    const account = await ownedAccount(tx, userId, data.accountId);
    const amount = positive(data.amount, account.currency);
    const bill = await tx.bill.create({
      data: {
        userId,
        accountId: account.id,
        title: data.title,
        category: data.category,
        amount,
        dueOn: dateOnly(data.dueOn),
      },
    });
    await appendAudit(tx, userId, "bill.created", bill.id);
    return { id: bill.id };
  });
}
export async function payBill(
  userId: string,
  id: string,
  idempotencyKey: string,
) {
  return userWrite(userId, async (tx) => {
    const bill = await tx.bill.findFirst({
      where: { userId, id },
      include: { account: true },
    });
    if (!bill) throw new AppError("Bill not found.", 404);
    if (bill.paidAt) return { id: bill.movementId };
    const requestHash = hash({ billId: id });
    const previous = await existing(tx, userId, idempotencyKey, requestHash);
    if (previous)
      throw new AppError(
        "This payment request was already used. Refresh and try again.",
        409,
      );
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const movement = await tx.movement.create({
      data: {
        userId,
        kind: "expense",
        description: bill.title,
        category: bill.category,
        occurredOn: dateOnly(today(user.timeZone)),
        idempotencyKey,
        requestHash,
        entries: {
          create: { accountId: bill.accountId, amount: -bill.amount },
        },
      },
    });
    await tx.bill.update({
      where: { id },
      data: { paidAt: new Date(), movementId: movement.id },
    });
    await appendAudit(tx, userId, "bill.paid", id);
    return { id: movement.id };
  });
}
export async function removePlan(
  userId: string,
  kind: "bill" | "goal" | "budget",
  id: string,
) {
  return userWrite(userId, async (tx) => {
    if (kind === "bill") {
      const b = await tx.bill.findFirst({ where: { id, userId } });
      if (!b) throw new AppError("Bill not found.", 404);
      if (b.paidAt)
        throw new AppError("Paid bills are retained with their transactions.");
      await tx.bill.delete({ where: { id } });
    }
    if (kind === "goal") {
      const result = await tx.goal.deleteMany({ where: { id, userId } });
      if (!result.count) throw new AppError("Goal not found.", 404);
    }
    if (kind === "budget") {
      const result = await tx.budget.deleteMany({ where: { id, userId } });
      if (!result.count) throw new AppError("Budget not found.", 404);
    }
    await appendAudit(tx, userId, `${kind}.removed`, id);
    return { ok: true };
  });
}
export async function importTransactions(userId: string, raw: unknown) {
  const data = importInput.parse(raw);
  return userWrite(userId, async (tx) => {
    const account = await ownedAccount(tx, userId, data.accountId);
    let imported = 0,
      duplicates = 0;
    for (const [index, row] of data.rows.entries()) {
      let amount: bigint;
      try {
        amount = positive(row.amount, account.currency);
        await assertPostedDate(tx, userId, row.date);
      } catch (e) {
        throw new AppError(`Row ${index + 2}: ${(e as Error).message}`);
      }
      const fingerprint = hash({
        accountId: account.id,
        date: row.date,
        description: row.description.toLowerCase(),
        amount: amount.toString(),
        type: row.type,
      });
      if (
        await tx.movement.findUnique({
          where: { userId_importHash: { userId, importHash: fingerprint } },
        })
      ) {
        duplicates++;
        continue;
      }
      // Stable import identity, separate from client-generated request IDs.
      const request = {
        accountId: account.id,
        kind: row.type,
        description: row.description,
        category: row.category,
        amount: row.amount,
        date: row.date,
        idempotencyKey: `import-${fingerprint}`,
      };
      await postMovement(tx, userId, request, fingerprint);
      imported++;
    }
    return { imported, duplicates };
  });
}
