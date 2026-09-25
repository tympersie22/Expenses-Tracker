import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { AppError } from "./errors";
import { hash, postMovement, userWrite } from "./ledger";
import { amount, date, importInput, transactionInput } from "./validation";
import { dateOnly, decimalMoney, parseMoney, today } from "@/domain/money";
import { appendAudit } from "./audit";

const stageInput = importInput.extend({
  fileName: z.string().trim().min(1).max(160),
  statementDate: date.optional(),
  closingBalance: amount.optional(),
});
const reviewInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("post"), itemId: z.string().cuid(), force: z.boolean().default(false) }).strict(),
  z.object({ action: z.literal("match"), itemId: z.string().cuid() }).strict(),
  z.object({ action: z.literal("skip"), itemId: z.string().cuid() }).strict(),
  z.object({ action: z.literal("restore"), itemId: z.string().cuid() }).strict(),
  z.object({ action: z.literal("balance"), batchId: z.string().cuid(), closingBalance: amount.nullable(), statementDate: date }).strict(),
]);

function normalizedDescription(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function dayDistance(a: string, b: string) {
  return Math.abs(dateOnly(a).getTime() - dateOnly(b).getTime()) / 86_400_000;
}
function signedAmount(kind: string, amountValue: bigint) {
  return kind === "income" ? amountValue : -amountValue;
}

export async function stageStatement(userId: string, raw: unknown) {
  const data = stageInput.parse(raw);
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { timeZone: true } });
  const lastDate = data.rows.reduce((latest, row) => row.date > latest ? row.date : latest, data.rows[0].date);
  const statementDate = data.statementDate ?? lastDate;
  if (statementDate > today(user.timeZone)) throw new AppError("Statement date cannot be in the future.");
  if (data.rows.some((row) => row.date > statementDate))
    throw new AppError("Statement date must be on or after every transaction in the file.");
  const sourceHash = hash({ accountId: data.accountId, rows: data.rows });
  const batchId = await userWrite(userId, async (tx) => {
    const previous = await tx.statementBatch.findUnique({ where: { userId_sourceHash: { userId, sourceHash } } });
    if (previous) return previous.id;
    const account = await tx.financialAccount.findFirst({ where: { id: data.accountId, userId, archivedAt: null } });
    if (!account) throw new AppError("Account not found.", 404);
    const amounts = data.rows.map((row, index) => {
      try {
        const value = parseMoney(row.amount, account.currency);
        if (value <= 0n) throw new Error("Amount must be greater than zero.");
        if (row.date > today(user.timeZone)) throw new Error("Future transactions cannot be imported.");
        return value;
      } catch (error) {
        throw new AppError(`Row ${index + 2}: ${(error as Error).message}`);
      }
    });
    let closingBalance: bigint | null = null;
    if (data.closingBalance !== undefined) {
      try { closingBalance = parseMoney(data.closingBalance, account.currency, true); }
      catch (error) { throw new AppError(`Closing balance: ${(error as Error).message}`); }
    }
    const fingerprints = data.rows.map((row, index) => hash({
      accountId: data.accountId, date: row.date,
      description: row.description.toLowerCase(),
      amount: amounts[index].toString(), type: row.type,
    }));
    const existing = await tx.movement.findMany({
      where: {
        userId, voidedAt: null,
        OR: [
          { importHash: { in: fingerprints } },
          {
            kind: { in: ["income", "expense"] },
            occurredOn: {
              gte: new Date(dateOnly(data.rows.reduce((earliest, row) => row.date < earliest ? row.date : earliest, data.rows[0].date)).getTime() - 2 * 86_400_000),
              lte: new Date(dateOnly(lastDate).getTime() + 2 * 86_400_000),
            },
            entries: { some: { accountId: data.accountId, userId } },
          },
        ],
      },
      include: { entries: { where: { accountId: data.accountId, userId } } },
    });
    const items = data.rows.map((row, index) => {
      const fingerprint = fingerprints[index];
      const exact = existing.find((movement) => movement.importHash === fingerprint);
      const candidate = exact ?? existing.find((movement) =>
        movement.kind === row.type &&
        movement.entries.some((entry) => entry.amount === signedAmount(row.type, amounts[index])) &&
        dayDistance(movement.occurredOn.toISOString().slice(0, 10), row.date) <= 2 &&
        normalizedDescription(movement.description) === normalizedDescription(row.description)
      );
      return {
        rowNumber: index + 2, occurredOn: dateOnly(row.date), description: row.description,
        category: row.category, kind: row.type, amount: amounts[index], fingerprint,
        suggestedMatchId: candidate?.id ?? null,
        // Repeated rows remain reviewable; they are never silently discarded.
        status: "pending",
      };
    });
    const batch = await tx.statementBatch.create({
      data: {
        userId, accountId: account.id, fileName: data.fileName,
        sourceHash, statementDate: dateOnly(statementDate), closingBalance,
        items: { create: items },
      },
    });
    await appendAudit(tx, userId, "statement.staged", batch.id);
    return batch.id;
  });
  return getInbox(userId, batchId);
}

export async function getInbox(userId: string, requestedBatchId?: string) {
  const batches = await db.statementBatch.findMany({
    where: { userId }, orderBy: { createdAt: "desc" }, take: 20,
    include: { account: { select: { name: true, currency: true } }, items: { select: { status: true } } },
  });
  const batchId = requestedBatchId ?? batches[0]?.id;
  const batch = batchId ? await db.statementBatch.findFirst({
    where: { id: batchId, userId },
    include: { account: { select: { name: true, currency: true } }, items: { orderBy: { rowNumber: "asc" }, include: { suggestedMatch: { select: { id: true, description: true, occurredOn: true } } } } },
  }) : null;
  if (batchId && !batch) throw new AppError("Statement not found.", 404);
  let reconciliation = null;
  if (batch) {
    const sum = await db.ledgerEntry.aggregate({
      where: { userId, accountId: batch.accountId, movement: { voidedAt: null, occurredOn: { lte: batch.statementDate } } },
      _sum: { amount: true },
    });
    const ledger = sum._sum.amount ?? 0n;
    reconciliation = {
      statementDate: batch.statementDate.toISOString().slice(0, 10),
      closingBalance: batch.closingBalance === null ? null : decimalMoney(batch.closingBalance, batch.account.currency),
      ledgerBalance: decimalMoney(ledger, batch.account.currency),
      difference: batch.closingBalance === null ? null : decimalMoney(batch.closingBalance - ledger, batch.account.currency),
      balanced: batch.closingBalance !== null && batch.closingBalance === ledger,
    };
  }
  return {
    batches: batches.map((entry) => ({
      id: entry.id, fileName: entry.fileName, accountName: entry.account.name,
      currency: entry.account.currency, createdAt: entry.createdAt.toISOString(),
      pending: entry.items.filter((item) => item.status === "pending").length,
      reviewed: entry.items.filter((item) => item.status !== "pending").length,
    })),
    batch: batch ? {
      id: batch.id, fileName: batch.fileName, accountId: batch.accountId,
      accountName: batch.account.name, currency: batch.account.currency,
      reconciliation,
      items: batch.items.map((item) => ({
        id: item.id, rowNumber: item.rowNumber, date: item.occurredOn.toISOString().slice(0, 10),
        description: item.description, category: item.category, type: item.kind,
        amount: decimalMoney(item.amount, batch.account.currency), status: item.status,
        suggestedMatch: item.suggestedMatch ? {
          id: item.suggestedMatch.id, description: item.suggestedMatch.description,
          date: item.suggestedMatch.occurredOn.toISOString().slice(0, 10),
        } : null,
        matchedMovementId: item.matchedMovementId,
        postedMovementId: item.postedMovementId,
      })),
    } : null,
  };
}

export async function reviewStatement(userId: string, raw: unknown) {
  const data = reviewInput.parse(raw);
  const batchId = await userWrite(userId, async (tx) => {
    if (data.action === "balance") {
      const batch = await tx.statementBatch.findFirst({ where: { id: data.batchId, userId }, include: { account: true, items: { select: { occurredOn: true } } } });
      if (!batch) throw new AppError("Statement not found.", 404);
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { timeZone: true } });
      if (data.statementDate > today(user.timeZone) || batch.items.some((item) => item.occurredOn > dateOnly(data.statementDate)))
        throw new AppError("Statement date must cover every row and cannot be in the future.");
      let closingBalance: bigint | null = null;
      if (data.closingBalance !== null) {
        try { closingBalance = parseMoney(data.closingBalance, batch.account.currency, true); }
        catch (error) { throw new AppError((error as Error).message); }
      }
      await tx.statementBatch.update({ where: { id: batch.id }, data: { closingBalance, statementDate: dateOnly(data.statementDate) } });
      await appendAudit(tx, userId, "statement.balance_updated", batch.id);
      return batch.id;
    }
    const item = await tx.statementItem.findFirst({ where: { id: data.itemId, batch: { userId } }, include: { batch: { include: { account: true } } } });
    if (!item) throw new AppError("Statement row not found.", 404);
    if (item.status !== "pending" && data.action !== "restore") return item.batchId;
    if (data.action === "restore") {
      if (item.status !== "skipped") throw new AppError("Only skipped rows can be restored.");
      await tx.statementItem.update({ where: { id: item.id }, data: { status: "pending" } });
    } else if (data.action === "skip") {
      await tx.statementItem.update({ where: { id: item.id }, data: { status: "skipped" } });
    } else if (data.action === "match") {
      if (!item.suggestedMatchId) throw new AppError("No matching transaction was found.");
      const match = await tx.movement.findFirst({ where: {
        id: item.suggestedMatchId, userId, voidedAt: null, kind: item.kind,
        entries: { some: { accountId: item.batch.accountId, amount: signedAmount(item.kind, item.amount) } },
      } });
      if (!match || dayDistance(match.occurredOn.toISOString().slice(0, 10), item.occurredOn.toISOString().slice(0, 10)) > 2)
        throw new AppError("The suggested transaction is no longer available. Refresh and review this row.", 409);
      const alreadyMatched = await tx.statementItem.findFirst({ where: { batchId: item.batchId, matchedMovementId: match.id, id: { not: item.id } } });
      if (alreadyMatched) throw new AppError("That transaction is already matched to another row in this statement.", 409);
      await tx.statementItem.update({ where: { id: item.id }, data: { status: "matched", matchedMovementId: match.id } });
    } else {
      const existing = await tx.movement.findUnique({ where: { userId_importHash: { userId, importHash: item.fingerprint } } });
      if (existing && !existing.voidedAt && !data.force)
        throw new AppError("This transaction was imported before. Match it or choose Add anyway.", 409);
      const movement = await postMovement(tx, userId, {
        accountId: item.batch.accountId, kind: item.kind as "income" | "expense",
        description: item.description, category: item.category as z.infer<typeof transactionInput>["category"],
        amount: decimalMoney(item.amount, item.batch.account.currency),
        date: item.occurredOn.toISOString().slice(0, 10), idempotencyKey: randomUUID(),
      }, existing ? undefined : item.fingerprint);
      await tx.statementItem.update({ where: { id: item.id }, data: { status: "posted", postedMovementId: movement.id } });
      await tx.statementItem.updateMany({
        where: { batchId: item.batchId, fingerprint: item.fingerprint, status: "pending", suggestedMatchId: null },
        data: { suggestedMatchId: movement.id },
      });
    }
    await appendAudit(tx, userId, `statement.${data.action}`, item.id);
    return item.batchId;
  });
  return getInbox(userId, batchId);
}
