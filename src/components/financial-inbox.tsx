"use client";

import { useEffect, useState } from "react";
import { parseCsv, type ImportRow } from "@/domain/csv";
import { formatMoney, parseMoney } from "@/domain/money";
import type { Snapshot } from "@/server/snapshot";

type Summary = {
  id: string; fileName: string; accountName: string; currency: string;
  createdAt: string; pending: number; reviewed: number;
};
type InboxItem = {
  id: string; rowNumber: number; date: string; description: string;
  category: string; type: "income" | "expense"; amount: string; status: string;
  suggestedMatch: { id: string; description: string; date: string } | null;
  matchedMovementId: string | null; postedMovementId: string | null;
};
type Batch = {
  id: string; fileName: string; accountId: string; accountName: string;
  currency: string; items: InboxItem[];
  reconciliation: {
    statementDate: string; closingBalance: string | null;
    ledgerBalance: string; difference: string | null; balanced: boolean;
  };
};
type InboxState = { batches: Summary[]; batch: Batch | null };

export function FinancialInbox({
  accounts,
  onPosted,
}: {
  accounts: Snapshot["accounts"];
  onPosted: () => Promise<void>;
}) {
  const [state, setState] = useState<InboxState>({ batches: [], batch: null });
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [statementDate, setStatementDate] = useState("");
  const [closingBalance, setClosingBalance] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const account = accounts.find((entry) => entry.id === accountId);
  const batch = state.batch;
  const pending = batch?.items.filter((item) => item.status === "pending") ?? [];
  const reviewed = batch?.items.filter((item) => item.status !== "pending") ?? [];

  useEffect(() => {
    void load();
    // The selected statement is refreshed explicitly after every inbox action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showMoney(value: string, currency: string) {
    try {
      return formatMoney(parseMoney(value, currency, true), currency);
    } catch {
      return value + " " + currency;
    }
  }
  function apply(next: InboxState) {
    setState(next);
    setStatementDate(next.batch?.reconciliation.statementDate ?? "");
    setClosingBalance(next.batch?.reconciliation.closingBalance ?? "");
  }
  async function load(batchId?: string) {
    setError("");
    try {
      const suffix = batchId ? "?batchId=" + encodeURIComponent(batchId) : "";
      const response = await fetch("/api/finance/inbox" + suffix, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      apply(data);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  async function request(method: "POST" | "PATCH", body: unknown) {
    const response = await fetch("/api/finance/inbox", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Unable to update the inbox.");
    apply(data);
  }
  async function stage() {
    if (!rows.length || !account) return;
    setBusy(true);
    setError("");
    try {
      rows.forEach((row, index) => {
        try {
          if (parseMoney(row.amount, account.currency) <= 0n)
            throw new Error("Amount must be positive.");
        } catch (cause) {
          throw new Error("Row " + (index + 2) + ": " + (cause as Error).message);
        }
      });
      const body: Record<string, unknown> = {
        accountId, fileName, rows, statementDate,
      };
      if (closingBalance.trim()) {
        parseMoney(closingBalance, account.currency, true);
        body.closingBalance = closingBalance.trim();
      }
      await request("POST", body);
      setRows([]);
      setFileName("");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function review(
    item: InboxItem,
    action: "post" | "match" | "skip" | "restore",
  ) {
    setBusy(true);
    setError("");
    try {
      await request("PATCH", {
        action,
        itemId: item.id,
        ...(action === "post" ? { force: Boolean(item.suggestedMatch) } : {}),
      });
      if (action === "post") await onPosted();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveBalance() {
    if (!batch) return;
    setBusy(true);
    setError("");
    try {
      if (closingBalance.trim()) parseMoney(closingBalance, batch.currency, true);
      await request("PATCH", {
        action: "balance",
        batchId: batch.id,
        statementDate,
        closingBalance: closingBalance.trim() || null,
      });
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function itemCard(item: InboxItem) {
    if (!batch) return null;
    return (
      <article className="inbox-row" key={item.id}>
        <div className="inbox-row-head">
          <div>
            <h3>{item.description}</h3>
            <p>{item.date} · {item.category}</p>
          </div>
          <strong>
            {item.type === "expense" ? "−" : "+"}
            {showMoney(item.amount, batch.currency)}
          </strong>
        </div>
        {item.suggestedMatch && item.status === "pending" && (
          <p className="inbox-match">
            Possible match: {item.suggestedMatch.description} · {item.suggestedMatch.date}
          </p>
        )}
        {item.status === "pending" ? (
          <div className="inbox-actions">
            {item.suggestedMatch && (
              <button className="secondary" disabled={busy} onClick={() => review(item, "match")}>
                Match existing
              </button>
            )}
            <button className="primary" disabled={busy} onClick={() => review(item, "post")}>
              {item.suggestedMatch ? "Add anyway" : "Add to account"}
            </button>
            <button className="quiet" disabled={busy} onClick={() => review(item, "skip")}>
              Skip
            </button>
          </div>
        ) : (
          <div className="inbox-actions">
            <span className="small-copy">
              {item.status === "posted"
                ? "Added to account"
                : item.status === "matched"
                  ? "Matched existing transaction"
                  : "Skipped"}
            </span>
            {item.status === "skipped" && (
              <button className="text-btn" disabled={busy} onClick={() => review(item, "restore")}>
                Restore
              </button>
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="inbox-layout">
      {error && <div className="error" role="alert">{error}</div>}
      <section className="inbox-panel">
        <div className="section-head"><h2>Add a statement</h2></div>
        {accounts.length ? (
          <div className="inbox-form">
            <label>
              Account
              <select
                value={accountId}
                onChange={(event) => {
                  setAccountId(event.target.value);
                  setRows([]);
                  setFileName("");
                }}
              >
                {accounts.map((entry) => (
                  <option value={entry.id} key={entry.id}>
                    {entry.name} · {entry.currency}
                  </option>
                ))}
              </select>
            </label>
            <label>
              CSV file
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={async (event) => {
                  setError("");
                  setRows([]);
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    if (file.size > 500_000)
                      throw new Error("Choose a CSV smaller than 500 KB.");
                    const parsed = parseCsv(await file.text());
                    setRows(parsed);
                    setFileName(file.name);
                    setStatementDate(
                      parsed.reduce(
                        (latest, row) => row.date > latest ? row.date : latest,
                        parsed[0].date,
                      ),
                    );
                    setClosingBalance("");
                  } catch (cause) {
                    setError((cause as Error).message);
                  }
                }}
              />
            </label>
            <p className="small-copy">
              CSV columns: date, description, amount, type, and optional category.
              Use YYYY-MM-DD dates and positive amounts.
            </p>
            {rows.length > 0 && (
              <>
                <p><strong>{rows.length} rows</strong> ready for review from {fileName}.</p>
                <div className="inbox-fields">
                  <label>
                    Statement date
                    <input type="date" value={statementDate} onChange={(event) => setStatementDate(event.target.value)} />
                  </label>
                  <label>
                    Closing balance · {account?.currency}
                    <input inputMode="decimal" placeholder="Optional" value={closingBalance} onChange={(event) => setClosingBalance(event.target.value)} />
                  </label>
                </div>
                <button className="primary" disabled={busy} onClick={stage}>
                  Review statement
                </button>
              </>
            )}
          </div>
        ) : <p>Add an account before importing a statement.</p>}
      </section>

      {batch && (
        <>
          <section className="inbox-panel">
            <div className="inbox-row-head">
              <div>
                <p className="eyebrow">Current statement</p>
                <h2>{batch.fileName}</h2>
                <p>{batch.accountName} · {batch.currency}</p>
              </div>
              <label className="inbox-switcher">
                Statements
                <select value={batch.id} onChange={(event) => void load(event.target.value)}>
                  {state.batches.map((entry) => (
                    <option value={entry.id} key={entry.id}>
                      {entry.fileName} · {entry.pending} pending
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="inbox-balance">
              <div>
                <span>Recorded through {batch.reconciliation.statementDate}</span>
                <strong>{showMoney(batch.reconciliation.ledgerBalance, batch.currency)}</strong>
              </div>
              <div>
                <span>Statement closing balance</span>
                <strong>
                  {batch.reconciliation.closingBalance === null
                    ? "Not set"
                    : showMoney(batch.reconciliation.closingBalance, batch.currency)}
                </strong>
              </div>
              {batch.reconciliation.difference !== null && (
                <div className="inbox-difference">
                  <span>Difference</span>
                  <strong>{showMoney(batch.reconciliation.difference, batch.currency)}</strong>
                </div>
              )}
            </div>
            {batch.reconciliation.balanced && (
              <p className="inbox-balanced">✓ Statement and recorded balance agree.</p>
            )}
            <details>
              <summary>Update statement balance</summary>
              <div className="inbox-fields">
                <label>
                  Statement date
                  <input type="date" value={statementDate} onChange={(event) => setStatementDate(event.target.value)} />
                </label>
                <label>
                  Closing balance · {batch.currency}
                  <input inputMode="decimal" value={closingBalance} onChange={(event) => setClosingBalance(event.target.value)} />
                </label>
              </div>
              <button className="secondary" disabled={busy} onClick={saveBalance}>
                Save balance check
              </button>
            </details>
          </section>
          <section>
            <div className="section-head"><h2>To review · {pending.length}</h2></div>
            {pending.length
              ? pending.map(itemCard)
              : <div className="empty">All rows reviewed. Check the balance difference above for anything still missing.</div>}
          </section>
          {reviewed.length > 0 && (
            <details>
              <summary>Reviewed · {reviewed.length}</summary>
              {reviewed.map(itemCard)}
            </details>
          )}
        </>
      )}
    </div>
  );
}
