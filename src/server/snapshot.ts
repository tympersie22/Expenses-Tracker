import { db } from "./db";
import { today, dateOnly, available } from "@/domain/money";
import { buildForecast } from "./forecast";
import { recurringJson } from "./recurring";
export async function snapshot(userId: string) {
  return db.$transaction(
    async (tx) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          baseCurrency: true,
          timeZone: true,
          language: true,
          emailVerified: true,
          twoFactorEnabled: true,
        },
      });
      const day = today(user.timeZone),
        month = day.slice(0, 7);
      const horizon = new Date(dateOnly(day));
      horizon.setUTCDate(horizon.getUTCDate() + 14);
      const [accounts, balances, movements, bills, goals, budgets, monthly, recurringPatterns] =
        await Promise.all([
          tx.financialAccount.findMany({
            where: { userId, archivedAt: null },
            orderBy: { createdAt: "asc" },
          }),
          tx.ledgerEntry.groupBy({
            by: ["accountId"],
            where: { userId, movement: { voidedAt: null } },
            _sum: { amount: true },
          }),
          tx.movement.findMany({
            where: { userId, voidedAt: null },
            include: {
              entries: { include: { account: true } },
              bill: { select: { id: true } },
            },
            orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
            take: 200,
          }),
          tx.bill.findMany({
            where: { userId },
            include: { account: true },
            orderBy: { dueOn: "asc" },
          }),
          tx.goal.findMany({
            where: { userId },
            include: { account: true },
            orderBy: { name: "asc" },
          }),
          tx.budget.findMany({
            where: { userId, month },
            orderBy: { category: "asc" },
          }),
          tx.movement.findMany({
            where: {
              userId,
              voidedAt: null,
              kind: "expense",
              occurredOn: { gte: dateOnly(`${month}-01`), lte: dateOnly(day) },
            },
            include: {
              entries: { include: { account: { select: { currency: true } } } },
            },
          }),
          tx.recurringPattern.findMany({
            where: { userId, status: { in: ["suggested", "active"] } },
            include: { account: { select: { name: true, currency: true } } },
            orderBy: [{ status: "asc" }, { nextDueOn: "asc" }],
          }),
        ]);
      const enriched = accounts.map((a) => ({
        ...a,
        balance: (
          balances.find((b) => b.accountId === a.id)?._sum.amount ?? 0n
        ).toString(),
      }));
      const currencies = Array.from(
        new Set([
          user.baseCurrency,
          ...accounts.map((a) => a.currency),
          ...budgets.map((b) => b.currency),
        ]),
      );
      const summaries = currencies.map((currency) => {
        const balance = enriched
          .filter((a) => a.currency === currency)
          .reduce((n, a) => n + BigInt(a.balance), 0n);
        const reserved = goals
          .filter((g) => g.account.currency === currency)
          .reduce((n, g) => n + g.reserved, 0n);
        const upcoming = bills
          .filter(
            (b) =>
              !b.paidAt &&
              b.account.currency === currency &&
              b.dueOn <= horizon,
          )
          .reduce((n, b) => n + b.amount, 0n);
        const spent = monthly
          .flatMap((m) => m.entries)
          .filter((e) => e.account.currency === currency)
          .reduce((n, e) => n - e.amount, 0n);
        return {
          currency,
          balance: balance.toString(),
          reserved: reserved.toString(),
          bills: upcoming.toString(),
          available: available(balance, reserved, upcoming).toString(),
          spent: spent.toString(),
        };
      });
      return {
        user,
        today: day,
        month,
        horizon: horizon.toISOString().slice(0, 10),
        accounts: enriched,
        summaries,
        movements: movements.map((m) => ({
          id: m.id,
          kind: m.kind,
          description: m.description,
          category: m.category,
          date: m.occurredOn.toISOString().slice(0, 10),
          billId: m.bill?.id ?? null,
          entries: m.entries.map((e) => ({
            accountId: e.accountId,
            accountName: e.account.name,
            currency: e.account.currency,
            amount: e.amount.toString(),
          })),
        })),
        bills: bills.map((b) => ({
          id: b.id,
          accountId: b.accountId,
          accountName: b.account.name,
          currency: b.account.currency,
          title: b.title,
          category: b.category,
          amount: b.amount.toString(),
          dueOn: b.dueOn.toISOString().slice(0, 10),
          paid: !!b.paidAt,
        })),
        goals: goals.map((g) => ({
          id: g.id,
          name: g.name,
          accountId: g.accountId,
          accountName: g.account.name,
          currency: g.account.currency,
          target: g.target.toString(),
          reserved: g.reserved.toString(),
        })),
        budgets: budgets.map((b) => ({
          id: b.id,
          category: b.category,
          currency: b.currency,
          month: b.month,
          limit: b.limit.toString(),
          spent: monthly
            .filter((m) => m.category === b.category)
            .flatMap((m) => m.entries)
            .filter((e) => e.account.currency === b.currency)
            .reduce((n, e) => n - e.amount, 0n)
            .toString(),
        })),
        recurring: recurringPatterns.map(recurringJson),
        forecast: buildForecast(day, enriched, bills, recurringPatterns),
      };
    },
    { isolationLevel: "RepeatableRead" },
  );
}
export type Snapshot = Awaited<ReturnType<typeof snapshot>>;
