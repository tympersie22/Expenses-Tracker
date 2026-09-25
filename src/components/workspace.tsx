"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Home,
  List,
  CalendarDays,
  Wallet,
  Plus,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  Settings,
  ArrowRightLeft,
  Download,
} from "lucide-react";
import type { Snapshot } from "@/server/snapshot";
import { formatMoney, parseMoney } from "@/domain/money";
import { EntryDialog, type DialogKind } from "./entry-dialog";
import { FinancialInbox } from "./financial-inbox";
import { CashFlowForecast } from "./cash-flow-forecast";
import { SettingsPanel } from "./settings-panel";
import { translate } from "@/domain/language";
type Section = "home" | "activity" | "plan" | "accounts" | "settings";
const percent = (part: string, total: string) =>
  Math.min(100, Number((BigInt(part) * 100n) / BigInt(total)));
const navigation = [
  { id: "home", label: "Home", icon: Home },
  { id: "activity", label: "Activity", icon: List },
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "accounts", label: "Accounts", icon: Wallet },
];
const titles = {
  home: "Your money, at a glance.",
  activity: "All activity.",
  plan: "Plan what comes next.",
  accounts: "Your accounts.",
  settings: "Settings.",
};
const subtitles = {
  home: "See what is available now and what is coming up.",
  activity: "Review incoming statements and every recorded movement.",
  plan: "Budgets, goals, and bills in one clear view.",
  accounts: "Every balance, kept in its original currency.",
  settings: "Preferences, language, connections, and security.",
};
export function Workspace({
  initial,
  section,
}: {
  initial: Snapshot;
  section: Section;
}) {
  const [data, setData] = useState(initial),
    [currency, setCurrency] = useState(initial.user.baseCurrency),
    [hidden, setHidden] = useState(false),
    [dialog, setDialog] = useState<DialogKind | null>(null),
    [editGoal, setEditGoal] = useState<Snapshot["goals"][number]>(),
    [editAccount, setEditAccount] = useState<Snapshot["accounts"][number]>(),
    [correctMovement, setCorrectMovement] = useState<Snapshot["movements"][number]>(),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [inboxOpen, setInboxOpen] = useState(false),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [purchase, setPurchase] = useState("");
  const [activityRecords, setActivityRecords] = useState(initial.movements),
    [hasOlderActivity, setHasOlderActivity] = useState(initial.movements.length >= 200),
    [loadingOlder, setLoadingOlder] = useState(false);
  const summary =
    data.summaries.find((s) => s.currency === currency) ?? data.summaries[0];
  const unit = summary.currency;
  const t = (value: string) => translate(data.user.language, value);
  const money = (amount: string | bigint, c = unit) =>
    hidden ? "••••" : formatMoney(amount, c);
  const accountCount = data.accounts.length;
  const goals = data.goals.filter((g) => g.currency === unit),
    bills = data.bills.filter((b) => b.currency === unit && !b.paid),
    budgets = data.budgets.filter((b) => b.currency === unit),
    recurring = data.recurring.filter((item) => item.currency === unit),
    forecast = data.forecast.find((item) => item.currency === unit);
  const activity = activityRecords.filter((m) =>
    m.entries.some((e) => e.currency === unit),
  );
  const transactions = activity.filter(
    (m) =>
      (filter === "all" || m.kind === filter) &&
      `${m.description} ${m.category} ${m.entries.map((e) => e.accountName).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  let scenario: string = "Enter a purchase amount to see what would remain.";
  if (purchase) {
    try {
      const amount = parseMoney(purchase, unit);
      const remaining = BigInt(summary.available) - amount;
      scenario = hidden
        ? "Reveal amounts to explore a purchase."
        : remaining >= 0n
          ? `${money(remaining)} would remain after this purchase.`
          : `This is ${money(-remaining)} beyond your available amount.`;
    } catch {
      scenario = "Enter a valid, positive amount for this currency.";
    }
  }
  function open(kind: DialogKind, goal?: Snapshot["goals"][number]) {
    setEditGoal(goal);
    if (kind !== "account-edit") setEditAccount(undefined);
    if (kind !== "transaction-correct") setCorrectMovement(undefined);
    setDialog(kind);
    setError("");
    setMessage("");
  }
  async function refresh() {
    const response = await fetch("/api/finance/snapshot", {
      cache: "no-store",
    });
    if (response.status === 401) {
      window.location.assign("/login");
      return;
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setData(result);
    setActivityRecords(result.movements);
    setHasOlderActivity(result.movements.length >= 200);
  }
  async function loadOlderActivity() {
    const cursor = activityRecords.at(-1)?.id;
    if (!cursor || loadingOlder) return;
    setLoadingOlder(true); setError("");
    try {
      const response = await fetch(`/api/finance/activity?cursor=${encodeURIComponent(cursor)}&limit=100`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setActivityRecords((current) => [...current, ...result.records.filter((record: Snapshot["movements"][number]) => !current.some((item) => item.id === record.id))]);
      setHasOlderActivity(Boolean(result.nextCursor));
    } catch (cause) { setError((cause as Error).message); }
    finally { setLoadingOlder(false); }
  }
  async function saved(text: string) {
    setMessage(text);
    setError("");
    try {
      await refresh();
    } catch {
      setError(
        "Your change was saved, but the view could not refresh. Please reload.",
      );
    }
  }
  async function mutate(
    resource: string,
    payload: unknown,
    method = "POST",
    confirmation?: string,
  ) {
    if (busy) return;
    if (confirmation && !window.confirm(confirmation)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/finance/${resource}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await saved("Your records are up to date.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function signout() {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/logout", { method: "POST" });
      if (!r.ok) throw new Error("Could not sign out. Try again.");
      window.location.assign("/login");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  async function scanHistory() {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/finance/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await refresh();
      setMessage(result.found === 0
        ? "No recurring pattern yet. Add at least three weekly or monthly transactions with the same description, then check again."
        : `Reviewed your history and found ${result.found} recurring pattern${result.found === 1 ? "" : "s"}.`);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function transactionRows(rows: Snapshot["movements"]) {
    return rows.map((m) => {
      const entry =
        m.entries.find((e) => BigInt(e.amount) < 0n) ?? m.entries[0];
      return (
        <div className="transaction" key={m.id}>
          <div className="merchant" aria-hidden="true">
            {m.kind === "transfer" ? (
              <ArrowRightLeft size={18} />
            ) : (
              m.description[0]?.toLowerCase()
            )}
          </div>
          <div>
            <h3>{m.description}</h3>
            <p>
              {t(m.kind === "transfer" ? "Transfer" : m.category)} ·{" "}
              {m.entries.map((e) => e.accountName).join(" → ")} · {m.date}
            </p>
          </div>
          <div className={"value " + (m.kind === "income" ? "positive" : "")}>
            {money(entry.amount, entry.currency)}
            {section === "activity" && m.kind !== "opening" && (
              <div className="bill-actions">
                {!m.billId && <button disabled={busy} onClick={() => { setCorrectMovement(m); setDialog("transaction-correct"); }}>{t("Correct")}</button>}
                <button
                  disabled={busy}
                  onClick={() =>
                    mutate(
                      "transactions",
                      { id: m.id },
                      "DELETE",
                      "Remove this transaction from your balances? Its audit record will be retained. Paid bills will return to your plan.",
                    )
                  }
                >
                  {t("Remove")}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    });
  }
  function goalCards() {
    return goals.map((g) => (
      <section className="goal" key={g.id}>
        <div className="goal-top">
          <span className="eyebrow">{g.accountName}</span>
          <CalendarDays size={20} />
        </div>
        <h3>{g.name}</h3>
        <div className="goal-number">
          {money(g.reserved)} <small>of {money(g.target)}</small>
        </div>
        <progress
          max={100}
          value={percent(g.reserved, g.target)}
          aria-label={`${g.name} progress`}
        />
        <p>Reserved from your recorded account balance.</p>
        <div className="toolbar">
          <button className="text-btn" onClick={() => open("goal", g)}>
            {t("Update goal")}
          </button>
          {section === "plan" && (
            <button
              className="text-btn"
              disabled={busy}
              onClick={() =>
                mutate(
                  "goals",
                  { id: g.id },
                  "DELETE",
                  "Remove this goal and release its reserved money?",
                )
              }
            >
              {t("Remove")}
            </button>
          )}
        </div>
      </section>
    ));
  }
  function billRows(limit?: number) {
    return bills.slice(0, limit).map((b) => (
      <div className="event" key={b.id}>
        <div className="event-icon">
          <CalendarDays size={18} />
        </div>
        <div>
          <h3>{b.title}</h3>
          <p>
            {b.dueOn < data.today ? "Overdue · " : ""}
            {b.dueOn} · {b.accountName}
          </p>
        </div>
        <div className="event-amount">
          {money(b.amount)}
          {section === "plan" && (
            <div className="bill-actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  mutate(
                    "pay-bill",
                    { id: b.id, idempotencyKey: crypto.randomUUID() },
                    "POST",
                    "Have you paid this bill? This records an expense; it does not send money.",
                  )
                }
              >
                {t("Mark paid")}
              </button>
              <button
                className="quiet"
                disabled={busy}
                onClick={() =>
                  mutate(
                    "bills",
                    { id: b.id },
                    "DELETE",
                    "Remove this planned bill?",
                  )
                }
              >
                {t("Remove")}
              </button>
            </div>
          )}
        </div>
      </div>
    ));
  }
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="shell">
        <aside>
          <Link className="brand" href="/home">
            <span className="mark" />
            Expenses Tracker
          </Link>
          <div className="study">Money without the guesswork</div>
          <nav aria-label="Main navigation">
            {navigation.map((n) => (
              <Link
                key={n.id}
                href={`/${n.id}`}
                aria-current={section === n.id ? "page" : undefined}
              >
                <n.icon className="icon" />
                {t(n.label)}
              </Link>
            ))}
          </nav>
          <div className="aside-foot">
            <p>
              Know what is available.
              <br />Plan what comes next.
            </p>
            <Link className="profile profile-link" href="/settings">
              <span className="avatar">
                {data.user.firstName?.slice(0, 2).toUpperCase() ?? "ME"}
              </span>
              <div>
                <strong style={{ fontSize: 12 }}>{data.user.firstName}</strong>
                <div className="small-copy">Preferences & security</div>
              </div>
            </Link>
            <button
              className="quiet small-copy"
              onClick={signout}
              disabled={busy}
            >
              <LogOut size={15} />
              {t("Sign out")}
            </button>
          </div>
        </aside>
        <main id="main">
          <header className="topbar">
            <span className="breadcrumb">Your money / {section}</span>
            <Link
              href="/home"
              className="mobile-brand"
              style={{ textDecoration: "none" }}
            >
              <span className="mark" />
              Expenses Tracker
            </Link>
            <div className="top-controls">
              <button
                className="quiet"
                aria-label={hidden ? "Show amounts" : "Hide amounts"}
                aria-pressed={hidden}
                onClick={() => setHidden(!hidden)}
              >
                {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                <span>{hidden ? "Show" : "Hide"} amounts</span>
              </button>
              <label className="currency">
                <span className="sr-only">View currency</span>
                <select
                  aria-label="View currency"
                  value={unit}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {data.summaries.map((s) => (
                    <option key={s.currency}>{s.currency}</option>
                  ))}
                </select>
              </label>
              <Link href="/settings" className="quiet" aria-label="Settings">
                <Settings size={18} />
              </Link>
            </div>
          </header>
          <div className="page-head">
            <div className="page-title">
              <p className="eyebrow">
                {section === "home"
                  ? data.today
                  : section === "plan"
                    ? `${data.month} · ${unit}`
                    : "YOUR MONEY, MADE CLEAR"}
              </p>
              <h1>{t(titles[section])}</h1>
              <p className="sub">{t(subtitles[section])}</p>
            </div>
            <div className="toolbar">
              {section === "accounts" ? (
                <button className="primary" onClick={() => open("account")}>
                  <Plus size={18} />
                  {t("Add account")}
                </button>
              ) : (
                section !== "settings" && (
                  <button
                    className="primary"
                    onClick={() =>
                      open(accountCount ? "transaction" : "account")
                    }
                  >
                    <Plus size={18} />
                    {t(accountCount ? "Add transaction" : "Add account")}
                  </button>
                )
              )}
              {section === "activity" && accountCount > 0 && (
                <>
                  <button
                    className="secondary"
                    onClick={() => setInboxOpen((current) => !current)}
                    aria-expanded={inboxOpen}
                  >
                    {t(inboxOpen ? "Close inbox" : "Financial inbox")}
                  </button>
                  <a
                    className="secondary"
                    href="/api/finance/export"
                    download="expenses-tracker-transactions.csv"
                  >
                    <Download size={14} /> {t("Export")}
                  </a>
                </>
              )}
            </div>
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="success" role="status">
              {message}
            </div>
          )}
          {section === "home" && (
            <>
              {!accountCount && (
                <section className="intro">
                  <h2>Start with one account.</h2>
                  <p>
                    Add cash, a bank account, or a mobile wallet with its
                    current balance. Record expenses and income from there. Your
                    overview will grow with your own records.
                  </p>
                  <div className="toolbar">
                    <button className="primary" onClick={() => open("account")}>
                      Add your first account <Plus size={17} />
                    </button>
                  </div>
                </section>
              )}
              <div className="overview">
                <section className="available">
                  <div className="available-top">
                    <span className="eyebrow">{t("Available to spend")}</span>
                    <span className="badge">ESTIMATE · NEXT 14 DAYS</span>
                  </div>
                  <div className="amount">{money(summary.available)}</div>
                  <p>After planned bills and money set aside.</p>
                  <div className="balance-strip">
                    <div>
                      <span>{t("Liquid balance")}</span>
                      <strong>{money(summary.balance)}</strong>
                    </div>
                    <div>
                      <span>{t("Upcoming bills")}</span>
                      <strong>{money(summary.bills)}</strong>
                    </div>
                    <div>
                      <span>{t("Set aside")}</span>
                      <strong>{money(summary.reserved)}</strong>
                    </div>
                  </div>
                  <button className="text-btn" onClick={() => open("explain")}>
                    See how this is calculated ↗
                  </button>
                  {BigInt(summary.available) < 0n && (
                    <p>
                      Your current commitments exceed your recorded balance.
                    </p>
                  )}
                </section>
                <section className="scenario">
                  <p className="eyebrow">Room for something?</p>
                  <h2>Try it before you spend it.</h2>
                  <p>Explore a purchase against your current plan.</p>
                  <label htmlFor="scenario-amount">A purchase in {unit}</label>
                  <div className="scenario-input">
                    <input
                      id="scenario-amount"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={purchase}
                      onChange={(e) => setPurchase(e.target.value)}
                      aria-describedby="scenario-result"
                    />
                  </div>
                  <div
                    className="scenario-result"
                    id="scenario-result"
                    aria-live="polite"
                  >
                    {scenario}
                  </div>
                  <p className="small-copy">
                    An illustration only. Nothing is recorded.
                  </p>
                </section>
              </div>
              <div className="content-grid">
                <section>
                  <div className="section-head">
                    <h2>On the horizon</h2>
                    <Link className="text-btn" href="/plan">
                      View plan ↗
                    </Link>
                  </div>
                  {bills.length ? (
                    <div className="timeline">{billRows(4)}</div>
                  ) : (
                    <div className="empty">
                      <h3>No bills planned yet.</h3>
                      <p>
                        Add upcoming commitments for a more useful spending
                        estimate.
                      </p>
                      {accountCount > 0 && (
                        <button
                          className="text-btn"
                          onClick={() => open("bill")}
                        >
                          Plan a bill ↗
                        </button>
                      )}
                    </div>
                  )}
                  <div className="plan-note">
                    Your estimate includes unpaid bills through {data.horizon},
                    including overdue bills.
                  </div>
                </section>
                <section>
                  <div className="section-head">
                    <h2>A little further ahead</h2>
                  </div>
                  {goals.length ? (
                    goalCards().slice(0, 1)
                  ) : (
                    <div className="goal">
                      <CalendarDays size={25} />
                      <h2 style={{ marginTop: 16 }}>Make room for a goal.</h2>
                      <p>
                        Reserve some of your balance for an emergency fund, a
                        trip, or something that matters to you.
                      </p>
                      {accountCount > 0 && (
                        <button
                          className="text-btn"
                          onClick={() => open("goal")}
                        >
                          Create a goal ↗
                        </button>
                      )}
                    </div>
                  )}
                </section>
              </div>
              <section className="activity">
                <div className="section-head">
                  <h2>Life, lately</h2>
                  <Link href="/activity" className="text-btn">
                    All activity ↗
                  </Link>
                </div>
                {activity.length ? (
                  transactionRows(activity.slice(0, 5))
                ) : (
                  <div className="empty">
                    Your recorded transactions will appear here.
                  </div>
                )}
              </section>
            </>
          )}
          {section === "activity" && (
            <>
              {inboxOpen && (
                <FinancialInbox accounts={data.accounts} onPosted={refresh} />
              )}
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="search">Find a transaction</label>
                  <input
                    id="search"
                    type="search"
                    placeholder="Merchant, category, account…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="filter">Type</label>
                  <select
                    id="filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All activity</option>
                    <option value="expense">Expenses</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfers</option>
                    <option value="opening">Opening balances</option>
                  </select>
                </div>
              </div>
              {transactions.length ? (
                transactionRows(transactions)
              ) : (
                <div className="empty">
                  {search
                    ? "No matching transactions. Try another search."
                    : "No transactions in this view yet."}
                </div>
              )}
              {hasOlderActivity && !search && filter === "all" && <button className="secondary" disabled={loadingOlder} onClick={loadOlderActivity}>{loadingOlder ? "Loading…" : "Load older activity"}</button>}
              <p className="small-copy">
                Activity loads in bounded pages. Export includes all active
                transactions across currencies. Removing a transaction
                recalculates balances and preserves its audit record.
              </p>
            </>
          )}
          {section === "accounts" && (
            <>
              {!accountCount ? (
                <section className="empty">
                  <h2>One place for all your money.</h2>
                  <p>
                    Add your first account to start recording real transactions.
                    Each account keeps its original currency.
                  </p>
                  <button className="primary" onClick={() => open("account")}>
                    Add an account
                  </button>
                </section>
              ) : (
                <div className="account-grid">
                  {data.accounts.map((a) => (
                    <section className="account" key={a.id}>
                      <Wallet size={24} />
                      <p className="eyebrow" style={{ marginTop: 20 }}>
                        {a.kind.replace("-", " ")}
                      </p>
                      <h2>{a.name}</h2>
                      <div className="account-value">
                        {money(a.balance, a.currency)}
                      </div>
                      <small>{a.currency} · Manually maintained</small>
                      <div className="toolbar" style={{ marginTop: 14 }}>
                        <button className="text-btn" onClick={() => { setEditAccount(a); setDialog("account-edit"); }}>Edit</button>
                        <button className="text-btn" disabled={busy} onClick={() => mutate("accounts", { id: a.id }, "DELETE", "Close this account? It must have a zero balance, no goals, and no unpaid bills. Its history will be retained.")}>Close account</button>
                      </div>
                      {data.goals
                        .filter((g) => g.accountId === a.id)
                        .reduce((n, g) => n + BigInt(g.reserved), 0n) >
                        BigInt(a.balance) && (
                        <p className="reserved-warning">
                          Goal reservations exceed this account’s current
                          balance. Review your plan.
                        </p>
                      )}
                    </section>
                  ))}
                </div>
              )}
              <p className="notice">
                Currencies are kept separate. No estimated exchange rate is
                applied to your money. Select a currency above to see its
                overview.
              </p>
            </>
          )}
          {section === "plan" && (
            <>
              <CashFlowForecast forecast={forecast} money={money} hidden={hidden} />
              <section className="recurring-section">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Recurring intelligence</p>
                    <h2>Money with a rhythm</h2>
                  </div>
                  <button
                    className="secondary"
                    disabled={busy || !accountCount}
                    onClick={scanHistory}
                  >
                    Check my history
                  </button>
                </div>
                {recurring.length ? (
                  <div className="recurring-grid">
                    {recurring.map((item) => (
                      <article className="recurring-card" key={item.id}>
                        <div className="recurring-title">
                          <div>
                            <span className="eyebrow">{item.status === "active" ? "Confirmed" : "Suggestion"}</span>
                            <h3>{item.title}</h3>
                          </div>
                          <strong className={item.kind === "income" ? "positive" : ""}>
                            {item.kind === "expense" ? "−" : "+"}{money(item.typicalAmount, item.currency)}
                          </strong>
                        </div>
                        <p>{item.cadence} · next around {item.nextDueOn} · based on {item.evidenceCount} records</p>
                        {item.minimumAmount !== item.maximumAmount && (
                          <p className="small-copy">Observed range: {money(item.minimumAmount, item.currency)}–{money(item.maximumAmount, item.currency)}</p>
                        )}
                        {item.status === "suggested" && (
                          <div className="inbox-actions">
                            <button className="primary" disabled={busy} onClick={() => mutate("recurring", { id: item.id, action: "confirm" }, "PATCH")}>Use in forecast</button>
                            <button className="quiet" disabled={busy} onClick={() => mutate("recurring", { id: item.id, action: "dismiss" }, "PATCH")}>Not recurring</button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty">Check your confirmed history to find weekly and monthly patterns. Nothing affects the forecast until you approve it.</div>
                )}
              </section>
              <div className="plan-grid">
              <div className="plan-stack">
                <section>
                  <div className="section-head">
                    <h2>Everyday spending</h2>
                    <button className="text-btn" onClick={() => open("budget")}>
                      Set a budget ↗
                    </button>
                  </div>
                  {budgets.length ? (
                    budgets.map((b) => (
                      <div className="budget" key={b.id}>
                        <div className="budget-title">
                          <strong>{b.category}</strong>
                          <span>
                            {money(b.spent)} / {money(b.limit)}
                          </span>
                        </div>
                        <progress
                          max={100}
                          value={percent(b.spent, b.limit)}
                          aria-label={`${b.category} budget used`}
                        />
                        <div className="toolbar">
                          <span className="small-copy">
                            {BigInt(b.spent) > BigInt(b.limit)
                              ? `${money(BigInt(b.spent) - BigInt(b.limit))} over plan`
                              : `${money(BigInt(b.limit) - BigInt(b.spent))} remaining`}
                          </span>
                          <button
                            className="text-btn"
                            disabled={busy}
                            onClick={() =>
                              mutate(
                                "budgets",
                                { id: b.id },
                                "DELETE",
                                "Remove this budget limit? Transactions are kept.",
                              )
                            }
                          >
                            {t("Remove")}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty">
                      Set category limits for {data.month}. Your recorded
                      expenses update progress automatically.
                    </div>
                  )}
                  <p className="small-copy">
                    Budgets guide monthly spending. They are not deducted again
                    from your available-to-spend estimate.
                  </p>
                </section>
                <section>
                  <div className="section-head">
                    <h2>Your goals</h2>
                    {accountCount > 0 && (
                      <button className="text-btn" onClick={() => open("goal")}>
                        Create a goal ↗
                      </button>
                    )}
                  </div>
                  {goals.length ? (
                    goalCards()
                  ) : (
                    <div className="empty">
                      {accountCount
                        ? "Choose a goal and reserve part of an account balance."
                        : "Add an account before reserving money for a goal."}
                    </div>
                  )}
                </section>
              </div>
              <section>
                <div className="section-head">
                  <h2>Upcoming commitments</h2>
                  {accountCount > 0 && (
                    <button className="text-btn" onClick={() => open("bill")}>
                      Plan a bill ↗
                    </button>
                  )}
                </div>
                {bills.length ? (
                  <div className="timeline">{billRows()}</div>
                ) : (
                  <div className="empty">No unpaid bills in {unit}.</div>
                )}
                <p className="small-copy">
                  Mark a bill paid only after paying it yourself. This records
                  an expense; it does not make a bank payment.
                </p>
                {data.bills.some((b) => b.currency === unit && b.paid) && (
                  <details className="details">
                    <summary>Paid bills</summary>
                    {data.bills
                      .filter((b) => b.currency === unit && b.paid)
                      .map((b) => (
                        <div className="calculation" key={b.id}>
                          <span>{b.title}</span>
                          <span>{money(b.amount)}</span>
                        </div>
                      ))}
                  </details>
                )}
              </section>
              </div>
            </>
          )}
          {section === "settings" && (
            <>
              <SettingsPanel data={data} saved={saved} />
              <button
                className="secondary"
                style={{ marginTop: 25 }}
                onClick={signout}
                disabled={busy}
              >
                {t("Sign out")}
              </button>
            </>
          )}
          <footer className="footer">
            <span>Designed for a little more peace of mind.</span>
            <div className="toolbar">
              <span>{unit} · Your recorded balances</span>
              <button
                className="refresh"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await refresh();
                    setError("");
                  } catch {
                    setError(
                      "Unable to refresh. Your saved data is unchanged.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <RefreshCw size={11} /> Refresh
              </button>
            </div>
          </footer>
        </main>
      </div>
      {dialog && (
        <EntryDialog
          kind={dialog}
          data={data}
          currency={unit}
          goal={editGoal}
          accountToEdit={editAccount}
          movementToCorrect={correctMovement}
          close={() => setDialog(null)}
          saved={saved}
        />
      )}
    </>
  );
}
