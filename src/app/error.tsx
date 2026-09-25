"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="loading">
      <h1>We couldn’t load your picture.</h1>
      <p>Your saved records have not been changed. Please try again.</p>
      <button className="primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
