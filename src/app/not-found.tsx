import Link from "next/link";
export default function NotFound() {
  return (
    <main className="loading">
      <h1>This page has moved.</h1>
      <p>Let’s get you back to your money.</p>
      <Link className="primary" href="/home">
        Go home
      </Link>
    </main>
  );
}
