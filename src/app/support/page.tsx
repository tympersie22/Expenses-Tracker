import Link from "next/link";
export const metadata = { title: "Support — Expenses Tracker" };
export default function Page() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return <main className="legal"><Link className="brand" href="/"><span className="mark" />Expenses Tracker</Link><h1>Support</h1><p>For account access, privacy, deletion, export, or security questions, contact the Expenses Tracker support team.</p>{email ? <p><a className="primary" href={`mailto:${email}`}>Email {email}</a></p> : <div className="error" role="alert">The production support address has not been configured.</div>}<h2>Protect your account</h2><p>Never send your password, authenticator secret, complete financial export, or session token. Support will never ask for them.</p><h2>Security reports</h2><p>Include the affected feature, steps to reproduce, and impact. Do not include another user’s financial information.</p><p><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></p></main>;
}
