import { dateOnly } from "@/domain/money";
import { merchantKey } from "./recurring";

type ForecastAccount = { id: string; currency: string; balance: string };
type ForecastBill = { accountId: string; title: string; amount: bigint; dueOn: Date; paidAt: Date | null; account: { currency: string } };
type ForecastPattern = { accountId: string; title: string; kind: string; cadenceDays: number; typicalAmount: bigint; nextDueOn: Date; status: string; account: { currency: string } };

function day(value: Date) { return value.toISOString().slice(0, 10); }
function plus(value: string, days: number) {
  const result = dateOnly(value); result.setUTCDate(result.getUTCDate() + days); return day(result);
}

export function buildForecast(today: string, accounts: ForecastAccount[], bills: ForecastBill[], patterns: ForecastPattern[]) {
  const end = plus(today, 30);
  const currencies = [...new Set(accounts.map((account) => account.currency))];
  return currencies.map((currency) => {
    const current = accounts.filter((a) => a.currency === currency).reduce((sum, a) => sum + BigInt(a.balance), 0n);
    const events = new Map<string, { change: bigint; labels: string[] }>();
    const add = (date: string, change: bigint, label: string) => {
      if (date < today || date > end) return;
      const event = events.get(date) ?? { change: 0n, labels: [] };
      event.change += change; event.labels.push(label); events.set(date, event);
    };
    const relevantBills = bills.filter((bill) => !bill.paidAt && bill.account.currency === currency);
    for (const bill of relevantBills) add(day(bill.dueOn), -bill.amount, bill.title);
    for (const pattern of patterns.filter((item) => item.status === "active" && item.account.currency === currency)) {
      let due = day(pattern.nextDueOn);
      while (due <= end) {
        const duplicateBill = relevantBills.some((bill) =>
          bill.accountId === pattern.accountId && merchantKey(bill.title) === merchantKey(pattern.title) &&
          Math.abs((bill.dueOn.getTime() - dateOnly(due).getTime()) / 86_400_000) <= 3,
        );
        if (!duplicateBill) add(due, pattern.kind === "income" ? pattern.typicalAmount : -pattern.typicalAmount, pattern.title);
        due = plus(due, pattern.cadenceDays);
      }
    }
    let balance = current, lowestBalance = current, lowestOn = today;
    const points = Array.from({ length: 31 }, (_, index) => {
      const date = plus(today, index), event = events.get(date);
      if (event) balance += event.change;
      if (balance < lowestBalance) { lowestBalance = balance; lowestOn = date; }
      return { date, balance: balance.toString(), change: (event?.change ?? 0n).toString(), events: event?.labels ?? [] };
    });
    return { currency, startBalance: current.toString(), endBalance: balance.toString(), lowestBalance: lowestBalance.toString(), lowestOn, points };
  });
}
