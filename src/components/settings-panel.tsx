"use client";
import { timeZones } from "@/domain/locale-data";
import { useEffect, useState } from "react";
import type { Snapshot } from "@/server/snapshot";
import { currencies } from "@/domain/money";
import { translate } from "@/domain/language";
import Link from "next/link";
export function SettingsPanel({
  data,
  saved,
}: {
  data: Snapshot;
  saved: (message: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [sessions, setSessions] = useState<Array<{ id: string; current: boolean; userAgent?: string; createdAt: string; lastSeenAt: string }>>([]),
    [mfaSecret, setMfaSecret] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const t = (value: string) => translate(data.user.language, value);
  useEffect(() => {
    fetch("/api/auth/sessions", { cache: "no-store" }).then(async (response) => {
      if (response.ok) setSessions((await response.json()).sessions);
    }).catch(() => {});
  }, []);
  async function authAction(action: string, payload: Record<string, unknown>) {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/auth/${action}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return result;
    } catch (cause) {
      setError((cause as Error).message);
      throw cause;
    } finally { setBusy(false); }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>, password = false) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        password ? "/api/auth/password" : "/api/finance/settings",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (password) form.reset();
      await saved(
        password
          ? "Password changed. Other sessions have been signed out."
          : t("Preferences saved."),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {notice && <div className="success" role="status">{notice}</div>}
      <div className="settings-grid">
        <section className="goal">
          <h2>{t("Your preferences")}</h2>
          <p>{data.user.email}</p>
          <form onSubmit={(e) => submit(e)}>
            <div className="form-field">
              <label htmlFor="settings-name">{t("Name")}</label>
              <input
                id="settings-name"
                name="name"
                defaultValue={data.user.firstName ?? ""}
                required
                maxLength={80}
              />
            </div>
            <div className="form-field">
              <label htmlFor="settings-currency">{t("Preferred currency")}</label>
              <select
                id="settings-currency"
                name="currency"
                defaultValue={data.user.baseCurrency}
              >
                {currencies.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="settings-language">{t("Language")}</label>
              <select id="settings-language" name="language" defaultValue={data.user.language}>
                <option value="en">English</option>
                <option value="sw">Kiswahili</option>
              </select>
              <small>{t("English is the default. Your choice follows your account.")}</small>
            </div>
            <div className="form-field">
              <label htmlFor="settings-zone">{t("Time zone")}</label>
              <select
                id="settings-zone"
                name="timeZone"
                defaultValue={data.user.timeZone}
              >
                {Array.from(
                  new Set(["UTC", data.user.timeZone, ...timeZones]),
                ).map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
              <small>{t("Used for your current day and monthly budgets.")}</small>
            </div>
            <button className="primary" disabled={busy}>
              {t("Save preferences")}
            </button>
          </form>
        </section>
        <section className="goal">
          <h2>{t("Account security")}</h2>
          <p>{t("Changing your password signs out your other sessions.")}</p>
          <form onSubmit={(e) => submit(e, true)}>
            <div className="form-field">
              <label htmlFor="current-password">{t("Current password")}</label>
              <input
                id="current-password"
                name="current"
                type="password"
                required
                autoComplete="current-password"
                maxLength={72}
              />
            </div>
            <div className="form-field">
              <label htmlFor="new-password">{t("New password")}</label>
              <input
                id="new-password"
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
              />
              <small>{t("At least 12 characters.")}</small>
            </div>
            <button className="primary" disabled={busy}>
              {t("Change password")}
            </button>
          </form>
          <p>
            Your financial records are private to your account. You can export
            recorded transactions from Activity.
          </p>
        </section>
      </div>
      <section className="goal" style={{ marginTop: 24 }}>
        <h2>{t("Connections & imports")}</h2>
        <p>{t("Bank and card feeds require an approved provider and your consent. Tanzania mobile-money business payment APIs do not provide personal wallet history.")}</p>
        <div className="settings-grid">
          <div>
            <h3>{t("Banks & cards")}</h3>
            <p>{t("Live connection unavailable. You can add an account and import its statement CSV from Activity.")}</p>
          </div>
          <div>
            <h3>{t("Tanzania mobile money")}</h3>
            <p>{t("Live wallet history unavailable. Record transactions manually or import a statement CSV.")}</p>
          </div>
        </div>
      </section>
      <div className="settings-grid" style={{ marginTop: 24 }}>
        <section className="goal">
          <h2>Email & sign-in</h2>
          <p>{data.user.emailVerified ? "Email verified." : "Your email is not verified yet."}</p>
          {!data.user.emailVerified && <button className="secondary" disabled={busy} onClick={async () => {
            try { const result = await authAction("resend-verification", { email: data.user.email }); setNotice(result.message); } catch {}
          }}>Send verification email</button>}
          <h3 style={{ marginTop: 24 }}>Two-factor authentication</h3>
          {!data.user.twoFactorEnabled && !mfaSecret && <form onSubmit={async (event) => {
            event.preventDefault();
            try { const result = await authAction("mfa-setup", Object.fromEntries(new FormData(event.currentTarget))); setMfaSecret(result.secret); } catch {}
          }}>
            <div className="form-field"><label htmlFor="mfa-password">Current password</label><input id="mfa-password" name="password" type="password" required autoComplete="current-password" /></div>
            <button className="secondary" disabled={busy}>Set up authenticator</button>
          </form>}
          {!data.user.twoFactorEnabled && mfaSecret && <form onSubmit={async (event) => {
            event.preventDefault();
            try { const result = await authAction("mfa-enable", Object.fromEntries(new FormData(event.currentTarget))); setRecoveryCodes(result.recoveryCodes ?? []); setMfaSecret(""); setNotice("Two-factor authentication is enabled."); await saved("Security settings updated."); } catch {}
          }}>
            <p>Add this secret to your authenticator app, then enter its six-digit code.</p>
            <code className="secret-code">{mfaSecret}</code>
            <div className="form-field"><label htmlFor="mfa-code">Authentication code</label><input id="mfa-code" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" /></div>
            <button className="primary" disabled={busy}>Enable two-factor authentication</button>
          </form>}
          {recoveryCodes.length > 0 && <div className="success" role="status"><strong>Save these one-time recovery codes now.</strong><p>They will not be shown again.</p><code className="secret-code">{recoveryCodes.join("\n")}</code></div>}
          {data.user.twoFactorEnabled && <form onSubmit={async (event) => {
            event.preventDefault();
            try { await authAction("mfa-disable", Object.fromEntries(new FormData(event.currentTarget))); setNotice("Two-factor authentication is disabled."); await saved("Security settings updated."); } catch {}
          }}>
            <p>Two-factor authentication is enabled.</p>
            <div className="form-field"><label htmlFor="mfa-disable-password">Current password</label><input id="mfa-disable-password" name="password" type="password" required /></div>
            <div className="form-field"><label htmlFor="mfa-disable-code">Authentication or recovery code</label><input id="mfa-disable-code" name="code" maxLength={17} required autoCapitalize="none" /></div>
            <button className="secondary" disabled={busy}>Disable two-factor authentication</button>
          </form>}
        </section>
        <section className="goal">
          <h2>Active sessions</h2>
          {sessions.length ? sessions.map((session) => <div className="session-row" key={session.id}>
            <div><strong>{session.current ? "This session" : "Signed-in device"}</strong><p className="small-copy">Last used {new Date(session.lastSeenAt).toLocaleString()}<br />{session.userAgent?.slice(0, 90) ?? "Device details unavailable"}</p></div>
            {!session.current && <button className="text-btn" disabled={busy} onClick={async () => {
              try { await authAction("revoke-session", { id: session.id }); setSessions((all) => all.filter((item) => item.id !== session.id)); setNotice("Session revoked."); } catch {}
            }}>Revoke</button>}
          </div>) : <p>No active sessions were returned.</p>}
        </section>
      </div>
      <section className="goal danger-zone" style={{ marginTop: 24 }}>
        <h2>Your data</h2>
        <p>Download a complete JSON archive containing your profile, accounts, plans, statements, transactions, recurring decisions, and audit history.</p>
        <a className="secondary" href="/api/finance/full-export" download="expenses-tracker-full-export.json">Download full archive</a>
        <h3 style={{ marginTop: 28 }}>Delete account</h3>
        <p>Deletion permanently removes your profile and financial records. Download your archive first if you need a copy.</p>
        <form onSubmit={async (event) => {
          event.preventDefault();
          if (!window.confirm("Permanently delete your Expenses Tracker account and all financial records?")) return;
          try { await authAction("delete-account", Object.fromEntries(new FormData(event.currentTarget))); window.location.assign("/login?deleted=1"); } catch {}
        }}>
          <div className="form-field"><label htmlFor="delete-password">Current password</label><input id="delete-password" name="password" type="password" required autoComplete="current-password" /></div>
          <div className="form-field"><label htmlFor="delete-confirmation">Type DELETE MY ACCOUNT</label><input id="delete-confirmation" name="confirmation" required pattern="DELETE MY ACCOUNT" autoComplete="off" /></div>
          <button className="danger" disabled={busy}>Delete my account permanently</button>
        </form>
      </section>
      <p className="small-copy" style={{ marginTop: 20 }}><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/support">Support</Link></p>
    </>
  );
}
