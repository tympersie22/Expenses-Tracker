"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Snapshot } from "@/server/snapshot";
import {
  categories,
  currencies,
  decimalMoney,
  formatMoney,
  parseMoney,
} from "@/domain/money";
import { parseCsv, type ImportRow } from "@/domain/csv";
export type DialogKind =
  "account" | "account-edit" | "transaction" | "transaction-correct" | "budget" | "goal" | "bill" | "import" | "explain";
type Props = {
  kind: DialogKind;
  data: Snapshot;
  currency: string;
  goal?: Snapshot["goals"][number];
  accountToEdit?: Snapshot["accounts"][number];
  movementToCorrect?: Snapshot["movements"][number];
  close: () => void;
  saved: (message: string) => Promise<void>;
};
export function EntryDialog({
  kind,
  data,
  currency,
  goal,
  accountToEdit,
  movementToCorrect,
  close,
  saved,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null),
    requestKey = useRef(crypto.randomUUID());
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [type, setType] = useState(movementToCorrect?.kind ?? "expense"),
    [accountId, setAccountId] = useState(
      movementToCorrect?.entries.find((entry) => entry.amount.startsWith("-"))?.accountId ??
        movementToCorrect?.entries[0]?.accountId ?? goal?.accountId ??
        data.accounts.find((a) => a.currency === currency)?.id ??
        data.accounts[0]?.id ??
        "",
    ),
    [rows, setRows] = useState<ImportRow[]>([]);
  const account = data.accounts.find((a) => a.id === accountId),
    unit = account?.currency ?? currency,
    correctionEntry = movementToCorrect?.entries.find((entry) => entry.amount.startsWith("-")) ?? movementToCorrect?.entries[0],
    correctionDestination = movementToCorrect?.kind === "transfer"
      ? movementToCorrect.entries.find((entry) => entry.accountId !== accountId)?.accountId
      : undefined;
  const sum = data.summaries.find((s) => s.currency === currency)!;
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const title = {
    account: "Add an account",
    "account-edit": "Edit account",
    transaction: "Record a transaction",
    "transaction-correct": "Correct transaction",
    budget: "Set a budget",
    goal: goal ? "Update goal" : "Add a goal",
    bill: "Plan a bill",
    import: "Import a statement",
    explain: "How available to spend works",
  }[kind];
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    const form = Object.fromEntries(new FormData(e.currentTarget));
    let resource = "",
      payload: unknown,
      method = "POST";
    try {
      if (kind === "account") {
        resource = "accounts";
        payload = { ...form, idempotencyKey: requestKey.current };
      }
      if (kind === "account-edit") {
        resource = "accounts";
        payload = { ...form, id: accountToEdit?.id };
        method = "PATCH";
      }
      if (kind === "transaction" || kind === "transaction-correct") {
        resource = "transactions";
        payload = { ...form, idempotencyKey: requestKey.current, ...(kind === "transaction-correct" ? { id: movementToCorrect?.id } : {}) };
        method = kind === "transaction-correct" ? "PATCH" : "POST";
        if (type !== "transfer")
          delete (payload as Record<string, unknown>).toAccountId;
      }
      if (kind === "budget") {
        resource = "budgets";
        payload = { ...form, currency, month: data.month };
      }
      if (kind === "goal") {
        resource = "goals";
        payload = goal ? { ...form, id: goal.id } : form;
        method = goal ? "PATCH" : "POST";
      }
      if (kind === "bill") {
        resource = "bills";
        payload = form;
      }
      if (kind === "import") {
        resource = "import";
        if (!rows.length) throw new Error("Choose a CSV file first.");
        for (const [i, row] of rows.entries()) {
          try {
            parseMoney(row.amount, unit);
          } catch (e) {
            throw new Error(`Row ${i + 2}: ${(e as Error).message}`);
          }
        }
        payload = { accountId, rows };
      }
      const response = await fetch(`/api/finance/${resource}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      close();
      await saved(
        kind === "import"
          ? `Imported ${result.imported} transactions; skipped ${result.duplicates} duplicates.`
          : "Saved. Your money picture is up to date.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const accountField = () => (
    <div className="form-field">
      <label htmlFor="entry-account">Account</label>
      <select
        id="entry-account"
        name="accountId"
        required
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
      >
        {data.accounts.map((a) => (
          <option value={a.id} key={a.id}>
            {a.name} · {a.currency}
          </option>
        ))}
      </select>
    </div>
  );
  const categoryField = () => (
    <div className="form-field">
      <label htmlFor="entry-category">Category</label>
      <select id="entry-category" name="category" defaultValue={movementToCorrect?.category ?? "Other"}>
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
    </div>
  );
  return (
    <dialog
      ref={ref}
      className={kind === "import" ? "wide" : ""}
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else close();
      }}
      onClose={close}
      aria-labelledby="dialog-title"
    >
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button
          type="button"
          className="quiet"
          disabled={busy}
          aria-label="Close dialog"
          onClick={close}
        >
          <X size={20} />
        </button>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {kind === "explain" ? (
        <>
          <p>
            Based on your recorded balances, reserved goals, and unpaid bills
            due by {data.horizon}. Overdue bills are included.
          </p>
          {[
            ["Liquid balances", sum.balance],
            ["Less savings reserved", sum.reserved],
            ["Less upcoming bills", sum.bills],
            ["Available to spend", sum.available],
          ].map(([label, value]) => (
            <div className="calculation" key={label}>
              <span>{label}</span>
              <span>{formatMoney(value, currency)}</span>
            </div>
          ))}
          <p>
            Only {currency} accounts are included. This estimate depends on
            complete, current records; unrecorded expenses and changing bills
            may affect it. Budgets are guides, not additional deductions.
          </p>
          <button className="primary" onClick={close}>
            Got it
          </button>
        </>
      ) : (
        <form onSubmit={submit}>
          {(kind === "account" || kind === "account-edit") && (
            <>
              <div className="form-field">
                <label htmlFor="account-name">Account name</label>
                <input
                  id="account-name"
                  name="name"
                  placeholder="e.g. Everyday account"
                  required
                  maxLength={120}
                  defaultValue={accountToEdit?.name}
                />
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="account-kind">Account type</label>
                  <select id="account-kind" name="kind" defaultValue={accountToEdit?.kind ?? "bank"}>
                    <option value="bank">Bank account</option>
                    <option value="cash">Cash</option>
                    <option value="mobile-money">Mobile money</option>
                    <option value="savings">Savings</option>
                    <option value="wallet">Digital wallet</option>
                  </select>
                </div>
                {kind === "account" && <div className="form-field">
                  <label htmlFor="account-currency">Currency</label>
                  <select
                    id="account-currency"
                    name="currency"
                    defaultValue={currency}
                  >
                    {currencies.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>}
              </div>
              {kind === "account" && <>
              <div className="form-field">
                <label htmlFor="opening">Opening balance</label>
                <input
                  id="opening"
                  name="openingBalance"
                  required
                  defaultValue="0"
                  inputMode="decimal"
                />
                <small>
                  The balance before transactions you intend to record or
                  import.
                </small>
              </div>
              <div className="form-field">
                <label htmlFor="opening-date">Balance date</label>
                <input
                  id="opening-date"
                  name="openingDate"
                  type="date"
                  required
                  defaultValue={data.today}
                  max={data.today}
                />
              </div>
              <p>
                This is a manually maintained account. It does not connect to
                your bank.
              </p>
              </>}
            </>
          )}
          {(kind === "transaction" || kind === "transaction-correct") && (
            <>
              <div className="form-field">
                <label htmlFor="entry-type">Transaction type</label>
                <select
                  id="entry-type"
                  name="kind"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="transfer">Transfer between accounts</option>
                </select>
              </div>
              {accountField()}
              {type === "transfer" && (
                <div className="form-field">
                  <label htmlFor="destination">To account</label>
                  <select
                    id="destination"
                    name="toAccountId"
                    required
                    defaultValue={correctionDestination ?? ""}
                  >
                    <option disabled value="">
                      Choose destination
                    </option>
                    {data.accounts
                      .filter((a) => a.id !== accountId && a.currency === unit)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} · {a.currency}
                        </option>
                      ))}
                  </select>
                  <small>
                    Transfers stay within one currency and do not count as
                    spending.
                  </small>
                </div>
              )}
              <div className="form-field">
                <label htmlFor="description">Description</label>
                <input
                  id="description"
                  name="description"
                  required
                  maxLength={120}
                  placeholder="e.g. Weekly groceries"
                  defaultValue={movementToCorrect?.description}
                />
              </div>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="entry-amount">Amount ({unit})</label>
                  <input
                    id="entry-amount"
                    name="amount"
                    required
                    inputMode="decimal"
                    placeholder="0.00"
                    defaultValue={correctionEntry ? decimalMoney((BigInt(correctionEntry.amount) < 0n ? -BigInt(correctionEntry.amount) : BigInt(correctionEntry.amount)).toString(), correctionEntry.currency) : undefined}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="entry-date">Date</label>
                  <input
                    id="entry-date"
                    name="date"
                    type="date"
                    required
                    max={data.today}
                    defaultValue={movementToCorrect?.date ?? data.today}
                  />
                </div>
              </div>
              {categoryField()}
              {kind === "transaction-correct" && <p>The original record will be voided and retained in the audit history.</p>}
            </>
          )}
          {kind === "budget" && (
            <>
              <p>
                Monthly limit for {data.month} in {currency}. Saving the same
                category updates its limit.
              </p>
              {categoryField()}
              <div className="form-field">
                <label htmlFor="budget-amount">
                  Monthly limit ({currency})
                </label>
                <input
                  id="budget-amount"
                  name="amount"
                  required
                  inputMode="decimal"
                />
              </div>
            </>
          )}
          {kind === "goal" && (
            <>
              <div className="form-field">
                <label htmlFor="goal-name">Goal name</label>
                <input
                  id="goal-name"
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={goal?.name}
                  placeholder="e.g. Emergency fund"
                />
              </div>
              {accountField()}
              <div className="form-field">
                <label htmlFor="target">Target ({unit})</label>
                <input
                  id="target"
                  name="target"
                  required
                  inputMode="decimal"
                  defaultValue={
                    goal ? decimalMoney(goal.target, goal.currency) : ""
                  }
                />
              </div>
              <div className="form-field">
                <label htmlFor="reserved">Already set aside ({unit})</label>
                <input
                  id="reserved"
                  name="reserved"
                  required
                  inputMode="decimal"
                  defaultValue={
                    goal ? decimalMoney(goal.reserved, goal.currency) : "0"
                  }
                />
                <small>
                  This reserves part of the account’s recorded balance. It does
                  not move money.
                </small>
              </div>
            </>
          )}
          {kind === "bill" && (
            <>
              <div className="form-field">
                <label htmlFor="bill-title">Bill name</label>
                <input
                  id="bill-title"
                  name="title"
                  required
                  maxLength={120}
                  placeholder="e.g. Rent"
                />
              </div>
              {accountField()}
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="bill-amount">Amount ({unit})</label>
                  <input
                    id="bill-amount"
                    name="amount"
                    required
                    inputMode="decimal"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="bill-date">Due date</label>
                  <input
                    id="bill-date"
                    name="dueOn"
                    type="date"
                    required
                    defaultValue={data.today}
                  />
                </div>
              </div>
              {categoryField()}
              <p>
                A planned bill is a reminder. Mark it paid after making the
                payment yourself; the app will record the expense.
              </p>
            </>
          )}
          {kind === "import" && (
            <>
              {accountField()}
              <p>
                CSV columns:{" "}
                <strong>date, description, amount, type, category</strong>. Use
                YYYY-MM-DD dates, positive amounts without thousands separators,
                and income or expense as type. Category is optional.
              </p>
              <p>
                Exact matches within CSV imports are skipped. Review repeated
                same-day purchases carefully. Imports add to your opening
                balance.
              </p>
              <div className="form-field">
                <label htmlFor="csv">Choose CSV (up to 500 rows)</label>
                <input
                  id="csv"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={async (e) => {
                    setError("");
                    setRows([]);
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      if (file.size > 500000)
                        throw new Error("CSV must be smaller than 500 KB.");
                      setRows(parseCsv(await file.text()));
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                />
              </div>
              {rows.length > 0 && (
                <>
                  <p>
                    {rows.length} rows ready for review. First 8 shown below.
                  </p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 8).map((r, i) => (
                          <tr key={i}>
                            <td>{r.date}</td>
                            <td>{r.description}</td>
                            <td>
                              {r.amount} {unit}
                            </td>
                            <td>{r.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
          <div className="dialog-actions">
            <button
              type="button"
              className="secondary"
              onClick={close}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              className="primary"
              disabled={busy || (kind === "import" && !rows.length)}
            >
              {busy
                ? "Saving…"
                : kind === "import"
                  ? "Import transactions"
                  : "Save"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
