"use client";
import { useState } from "react";
import Link from "next/link";
import { currencies } from "@/domain/money";
export function AuthForm({ signup = false }: { signup?: boolean }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [mfaRequired, setMfaRequired] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const payload = {
        email: form.get("email"),
        password: form.get("password"),
        ...(mfaRequired ? { code: form.get("code") } : {}),
        ...(signup
          ? {
              name: form.get("name"),
              currency: form.get("currency"),
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              acceptTerms: form.get("acceptTerms") === "on",
            }
          : {}),
      };
      const r = await fetch(`/api/auth/${signup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.mfaRequired) setMfaRequired(true);
        throw new Error(data.error);
      }
      window.location.assign(data.verificationRequired ? `/verify-email?sent=1&email=${encodeURIComponent(String(form.get("email")))}` : "/home");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to connect. Try again.",
      );
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Link href="/" className="brand">
          <span className="mark" />
          Expenses Tracker
        </Link>
        <h1>
          Know what you can spend.
          <br />Plan what comes next.
        </h1>
        <p>
          Accounts, expenses, bills, and goals in one clear view—across the
          currencies you actually use.
        </p>
        <span className="eyebrow">Clear money. Better decisions.</span>
      </section>
      <section className="auth-content">
        <div className="auth-form">
          <p className="eyebrow">
            {signup ? "Create your account" : "Welcome back"}
          </p>
          <h2>
            {signup ? "Start tracking clearly." : "Sign in to Expenses Tracker."}
          </h2>
          <p>
            {signup
              ? "Add your first account after signup. You stay in control of every record."
              : "Your accounts, activity, and plans are ready."}
          </p>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={submit}>
            {signup && (
              <div className="form-field">
                <label htmlFor="name">Your name</label>
                <input
                  id="name"
                  name="name"
                  autoComplete="given-name"
                  required
                  maxLength={80}
                />
              </div>
            )}
            {signup && <label className="consent"><input type="checkbox" name="acceptTerms" required /> <span>I agree to the <Link href="/terms" target="_blank">Terms</Link> and acknowledge the <Link href="/privacy" target="_blank">Privacy Policy</Link>.</span></label>}
            <div className="form-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </div>
            {mfaRequired && (
              <div className="form-field">
                <label htmlFor="code">Authenticator or recovery code</label>
                <input id="code" name="code" maxLength={17} required autoComplete="one-time-code" autoCapitalize="none" autoFocus />
              </div>
            )}
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                required
                minLength={signup ? 12 : 1}
                maxLength={72}
              />
              {signup && (
                <small>
                  At least 12 characters. A memorable passphrase works well.
                </small>
              )}
            </div>
            {signup && (
              <div className="form-field">
                <label htmlFor="currency">Preferred currency</label>
                <select id="currency" name="currency" defaultValue="USD">
                  {currencies.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <small>You can keep accounts in other currencies too.</small>
              </div>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "One moment…" : signup ? "Create account" : "Sign in"}
            </button>
          </form>
          {!signup && <p className="switch"><Link href="/forgot-password">Forgot your password?</Link></p>}
          <p className="switch">
            {signup ? "Already have an account?" : "New here?"}{" "}
            <Link href={signup ? "/login" : "/signup"}>
              {signup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
