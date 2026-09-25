import { z } from "zod";
import { requireUser, rateLimit } from "@/server/auth";
import { handle, json, assertOrigin, readBody } from "@/server/http";
import { snapshot } from "@/server/snapshot";
import {
  createAccount,
  createMovement,
  voidMovement,
  saveBudget,
  saveGoal,
  createBill,
  payBill,
  removePlan,
  importTransactions,
  updateAccount,
  archiveAccount,
  correctMovement,
} from "@/server/ledger";
import { AppError } from "@/server/errors";
import { db } from "@/server/db";
import { currency, key } from "@/server/validation";
import { decimalMoney } from "@/domain/money";
import { getInbox, reviewStatement, stageStatement } from "@/server/inbox";
import { decideRecurring, scanRecurring } from "@/server/recurring";
import { reportIOSDiagnostic } from "@/server/observability";
type Context = { params: Promise<{ resource: string }> };
export async function GET(request: Request, { params }: Context) {
  return handle(async () => {
    const user = await requireUser();
    const { resource } = await params;
    if (resource === "snapshot") return json(await snapshot(user.id));
    if (resource === "inbox") {
      const batchId = new URL(request.url).searchParams.get("batchId") ?? undefined;
      return json(await getInbox(user.id, batchId));
    }
    if (resource === "activity") {
      const url = new URL(request.url);
      const cursor = url.searchParams.get("cursor") ?? undefined;
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50));
      const records = await db.movement.findMany({
        where: { userId: user.id, voidedAt: null },
        include: { entries: { include: { account: true } }, bill: { select: { id: true } } },
        orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      const more = records.length > limit;
      const page = records.slice(0, limit);
      return json({
        records: page.map((m) => ({
          id: m.id, kind: m.kind, description: m.description, category: m.category,
          date: m.occurredOn.toISOString().slice(0, 10), billId: m.bill?.id ?? null,
          entries: m.entries.map((e) => ({ accountId: e.accountId, accountName: e.account.name, currency: e.account.currency, amount: e.amount.toString() })),
        })),
        nextCursor: more ? page.at(-1)?.id ?? null : null,
      });
    }
    if (resource === "export") {
      const transactions = await db.movement.findMany({
        where: { userId: user.id, voidedAt: null },
        include: { entries: { include: { account: true } } },
        orderBy: { occurredOn: "asc" },
      });
      // Prefix spreadsheet formula characters, then apply CSV quoting.
      const escape = (value: string) =>
        '"' +
        (/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll(
          '"',
          '""',
        ) +
        '"';
      const rows = [
        [
          "date",
          "description",
          "type",
          "category",
          "account",
          "currency",
          "amount",
        ],
        ...transactions.flatMap((m) =>
          m.entries.map((e) => [
            m.occurredOn.toISOString().slice(0, 10),
            m.description,
            m.kind,
            m.category,
            e.account.name,
            e.account.currency,
            decimalMoney(e.amount, e.account.currency),
          ]),
        ),
      ];
      return new Response(
        rows.map((r) => r.map(escape).join(",")).join("\r\n"),
        {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition":
              'attachment; filename="expenses-tracker-transactions.csv"',
            "Cache-Control": "no-store",
          },
        },
      );
    }
    if (resource === "full-export") {
      await rateLimit("export", user.id, 5, 60);
      const [profile, accounts, movements, budgets, goals, bills, statements, recurring, audit, policyAcceptances] = await db.$transaction([
        db.user.findUniqueOrThrow({ where: { id: user.id }, select: { id: true, email: true, firstName: true, lastName: true, phone: true, createdAt: true, updatedAt: true, baseCurrency: true, timeZone: true, language: true, emailVerified: true, twoFactorEnabled: true } }),
        db.financialAccount.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
        db.movement.findMany({ where: { userId: user.id }, include: { entries: true }, orderBy: { createdAt: "asc" } }),
        db.budget.findMany({ where: { userId: user.id } }),
        db.goal.findMany({ where: { userId: user.id } }),
        db.bill.findMany({ where: { userId: user.id } }),
        db.statementBatch.findMany({ where: { userId: user.id }, include: { items: true } }),
        db.recurringPattern.findMany({ where: { userId: user.id } }),
        db.auditEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
        db.policyAcceptance.findMany({ where: { userId: user.id }, select: { policyVersion: true, policyType: true, acceptedAt: true }, orderBy: { acceptedAt: "asc" } }),
      ]);
      const body = JSON.stringify({
        format: "expenses-tracker-export", version: 1, exportedAt: new Date().toISOString(),
        profile, accounts, movements, budgets, goals, bills, statements, recurring, audit, policyAcceptances,
      }, (_key, value) => typeof value === "bigint" ? value.toString() : value, 2);
      return new Response(body, { headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="expenses-tracker-full-export.json"',
        "Cache-Control": "no-store",
      } });
    }
    throw new AppError("Not found.", 404);
  });
}
export async function POST(request: Request, { params }: Context) {
  return handle(async () => {
    assertOrigin(request);
    const user = await requireUser();
    await rateLimit("write", user.id, 300);
    const { resource } = await params;
    const body = await readBody(request);
    switch (resource) {
      case "accounts":
        return json(await createAccount(user.id, body), 201);
      case "transactions":
        return json(await createMovement(user.id, body), 201);
      case "budgets":
        return json(await saveBudget(user.id, body));
      case "goals":
        return json(await saveGoal(user.id, body), 201);
      case "bills":
        return json(await createBill(user.id, body), 201);
      case "import":
        return json(await importTransactions(user.id, body));
      case "inbox":
        return json(await stageStatement(user.id, body), 201);
      case "recurring":
        return json(await scanRecurring(user.id));
      case "diagnostics": {
        const { payload } = z.object({ payload: z.string().max(350_000) }).parse(body);
        const diagnostic = Buffer.from(payload, "base64").toString("utf8");
        if (Buffer.byteLength(diagnostic) > 250_000) throw new AppError("Diagnostic is too large.", 413);
        try { JSON.parse(diagnostic); } catch { throw new AppError("Diagnostic payload is invalid."); }
        await reportIOSDiagnostic(user.id, diagnostic);
        return json({ ok: true });
      }
      case "pay-bill": {
        const b = z
          .object({ id: z.string().cuid(), idempotencyKey: key })
          .parse(body);
        return json(await payBill(user.id, b.id, b.idempotencyKey));
      }
      case "settings": {
        const data = z
          .object({
            name: z.string().trim().min(1).max(80),
            currency,
            language: z.enum(["en", "sw"]).default("en"),
            timeZone: z.string().refine((x) => {
              try {
                new Intl.DateTimeFormat("en", { timeZone: x });
                return true;
              } catch {
                return false;
              }
            }, "Invalid time zone."),
          })
          .parse(body);
        await db.user.update({
          where: { id: user.id },
          data: {
            firstName: data.name,
            baseCurrency: data.currency,
            timeZone: data.timeZone,
            language: data.language,
          },
        });
        return json({ ok: true });
      }
      default:
        throw new AppError("Not found.", 404);
    }
  });
}
export async function PATCH(request: Request, { params }: Context) {
  return handle(async () => {
    assertOrigin(request);
    const user = await requireUser();
    await rateLimit("write", user.id, 300);
    const { resource } = await params;
    const body = await readBody(request);
    if (resource === "inbox") return json(await reviewStatement(user.id, body));
    if (resource === "recurring") return json(await decideRecurring(user.id, body));
    const { id, ...values } = z
      .object({ id: z.string().cuid() })
      .passthrough()
      .parse(body);
    if (resource === "goals") return json(await saveGoal(user.id, values, id));
    if (resource === "accounts") return json(await updateAccount(user.id, id, values));
    if (resource === "transactions") return json(await correctMovement(user.id, id, values));
    throw new AppError("Not found.", 404);
  });
}
export async function DELETE(request: Request, { params }: Context) {
  return handle(async () => {
    assertOrigin(request);
    const user = await requireUser();
    await rateLimit("delete", user.id, 100);
    const { resource } = await params;
    const { id } = z
      .object({ id: z.string().cuid() })
      .parse(await readBody(request));
    if (resource === "transactions")
      return json(await voidMovement(user.id, id));
    if (resource === "accounts") return json(await archiveAccount(user.id, id));
    if (resource === "bills" || resource === "goals" || resource === "budgets")
      return json(
        await removePlan(
          user.id,
          resource.slice(0, -1) as "bill" | "goal" | "budget",
          id,
        ),
      );
    throw new AppError("Not found.", 404);
  });
}
