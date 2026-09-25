"use client";
import { useState } from "react";
import Link from "next/link";

export function AccountLinkForm({ mode, token, initialEmail = "" }: { mode: "forgot" | "reset" | "verify"; token?: string; initialEmail?: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const action = mode === "forgot" ? "forgot-password" : mode === "reset" ? "reset-password" : token ? "verify-email" : "resend-verification";
    const payload = token ? { ...form, token } : form;
    try {
      const response = await fetch(`/api/auth/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (mode === "reset" || (mode === "verify" && token)) {
        setMessage(mode === "reset" ? "Your password was reset. Sign in with your new password and authenticator if enabled." : "Your email is verified. You can now sign in.");
      }
      else setMessage(result.message ?? "Check your email for the secure link.");
    } catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="auth-layout"><section className="auth-story"><Link href="/" className="brand"><span className="mark" />Expenses Tracker</Link><h1>Your account,<br />back in your hands.</h1><p>Recovery links are short-lived and can be used only once.</p></section><section className="auth-content"><div className="auth-form"><p className="eyebrow">Account security</p><h2>{mode === "forgot" ? "Recover access." : mode === "reset" ? "Choose a new password." : token ? "Verify your email." : "Check your inbox."}</h2>{error && <div className="error" role="alert">{error}</div>}{message && <div className="success" role="status">{message}</div>}<form onSubmit={submit}>
    {(mode === "forgot" || (mode === "verify" && !token)) && <div className="form-field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" defaultValue={initialEmail} required autoComplete="email" /></div>}
    {mode === "reset" && <div className="form-field"><label htmlFor="password">New password</label><input id="password" name="password" type="password" minLength={12} maxLength={72} required autoComplete="new-password" /><small>At least 12 characters.</small></div>}
    <button className="primary" disabled={busy}>{busy ? "One moment…" : mode === "forgot" ? "Send recovery link" : mode === "reset" ? "Reset password" : token ? "Verify email" : "Send another link"}</button>
  </form><p className="switch"><Link href="/login">Return to sign in</Link></p></div></section></div>;
}
