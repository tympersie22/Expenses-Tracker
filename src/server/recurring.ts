import { z } from "zod";
import { db } from "./db";
import { AppError } from "./errors";
import { hash, userWrite } from "./ledger";
import { dateOnly, today } from "@/domain/money";
import { appendAudit } from "./audit";

type Observation = {
  accountId: string;
  kind: "income" | "expense";
  description: string;
  category: string;
  date: string;
  amount: bigint;
};

export type DetectedPattern = {
  sourceKey: string;
  accountId: string;
  title: string;
  category: string;
  kind: "income" | "expense";
  cadence: "weekly" | "monthly";
  cadenceDays: number;
  typicalAmount: bigint;
  minimumAmount: bigint;
  maximumAmount: bigint;
  evidenceCount: number;
  lastObservedOn: string;
  nextDueOn: string;
};

export function merchantKey(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\b\d{3,}\b/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function addDays(day: string, count: number) {
  const value = dateOnly(day);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

export function detectRecurring(observations: Observation[], currentDay: string): DetectedPattern[] {
  const groups = new Map<string, Observation[]>();
  for (const item of observations) {
    const name = merchantKey(item.description);
    if (!name) continue;
    const key = `${item.accountId}|${item.kind}|${name}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const result: DetectedPattern[] = [];
  for (const [groupKey, raw] of groups) {
    const rows = raw.sort((a, b) => a.date.localeCompare(b.date));
    if (rows.length < 3) continue;
    const intervals = rows.slice(1).map((row, index) =>
      Math.round((dateOnly(row.date).getTime() - dateOnly(rows[index].date).getTime()) / 86_400_000),
    );
    const sortedIntervals = [...intervals].sort((a, b) => a - b);
    const interval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
    const cadence = interval >= 6 && interval <= 8
      ? "weekly"
      : interval >= 25 && interval <= 35 ? "monthly" : null;
    if (!cadence) continue;
    const tolerance = cadence === "weekly" ? 2 : 7;
    if (intervals.some((value) => Math.abs(value - interval) > tolerance)) continue;
    const amounts = rows.map((row) => row.amount).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
    const minimumAmount = amounts[0], maximumAmount = amounts[amounts.length - 1];
    if (maximumAmount > minimumAmount * 2n) continue;
    const typicalAmount = amounts[Math.floor(amounts.length / 2)];
    const last = rows[rows.length - 1];
    let nextDueOn = addDays(last.date, interval);
    while (nextDueOn < currentDay) nextDueOn = addDays(nextDueOn, interval);
    result.push({
      sourceKey: hash(groupKey), accountId: last.accountId, title: last.description,
      category: last.category, kind: last.kind, cadence, cadenceDays: interval,
      typicalAmount, minimumAmount, maximumAmount, evidenceCount: rows.length,
      lastObservedOn: last.date, nextDueOn,
    });
  }
  return result;
}

export async function scanRecurring(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { timeZone: true } });
  const currentDay = today(user.timeZone);
  const since = dateOnly(currentDay);
  since.setUTCDate(since.getUTCDate() - 190);
  return userWrite(userId, async (tx) => {
    const movements = await tx.movement.findMany({
      where: { userId, voidedAt: null, kind: { in: ["income", "expense"] }, occurredOn: { gte: since } },
      include: { entries: true }, orderBy: { occurredOn: "asc" },
    });
    const observations: Observation[] = movements.flatMap((movement) =>
      movement.entries.map((entry) => ({
        accountId: entry.accountId, kind: movement.kind as "income" | "expense",
        description: movement.description, category: movement.category,
        date: movement.occurredOn.toISOString().slice(0, 10), amount: entry.amount < 0n ? -entry.amount : entry.amount,
      })),
    );
    const patterns = detectRecurring(observations, currentDay);
    for (const pattern of patterns) {
      await tx.recurringPattern.upsert({
        where: { userId_sourceKey: { userId, sourceKey: pattern.sourceKey } },
        create: {
          ...pattern, userId, lastObservedOn: dateOnly(pattern.lastObservedOn), nextDueOn: dateOnly(pattern.nextDueOn),
        },
        update: {
          title: pattern.title, category: pattern.category, cadence: pattern.cadence,
          cadenceDays: pattern.cadenceDays, typicalAmount: pattern.typicalAmount,
          minimumAmount: pattern.minimumAmount, maximumAmount: pattern.maximumAmount,
          evidenceCount: pattern.evidenceCount, lastObservedOn: dateOnly(pattern.lastObservedOn),
          nextDueOn: dateOnly(pattern.nextDueOn),
        },
      });
    }
    await appendAudit(tx, userId, "recurring.scanned", String(patterns.length));
    return { found: patterns.length };
  });
}

const decision = z.object({
  id: z.string().cuid(),
  action: z.enum(["confirm", "dismiss"]),
}).strict();

export async function decideRecurring(userId: string, raw: unknown) {
  const data = decision.parse(raw);
  return userWrite(userId, async (tx) => {
    const pattern = await tx.recurringPattern.findFirst({ where: { id: data.id, userId } });
    if (!pattern) throw new AppError("Recurring pattern not found.", 404);
    await tx.recurringPattern.update({
      where: { id: pattern.id }, data: { status: data.action === "confirm" ? "active" : "dismissed" },
    });
    await appendAudit(tx, userId, `recurring.${data.action}`, pattern.id);
    return { ok: true };
  });
}

export function recurringJson(pattern: {
  id: string; accountId: string; title: string; category: string; kind: string;
  cadence: string; typicalAmount: bigint; minimumAmount: bigint; maximumAmount: bigint;
  evidenceCount: number; lastObservedOn: Date; nextDueOn: Date; status: string;
  account: { name: string; currency: string };
}) {
  return {
    id: pattern.id, accountId: pattern.accountId, accountName: pattern.account.name,
    currency: pattern.account.currency, title: pattern.title, category: pattern.category,
    kind: pattern.kind, cadence: pattern.cadence,
    typicalAmount: pattern.typicalAmount.toString(),
    minimumAmount: pattern.minimumAmount.toString(),
    maximumAmount: pattern.maximumAmount.toString(),
    evidenceCount: pattern.evidenceCount,
    lastObservedOn: pattern.lastObservedOn.toISOString().slice(0, 10),
    nextDueOn: pattern.nextDueOn.toISOString().slice(0, 10), status: pattern.status,
  };
}
