"use client";

import type { Snapshot } from "@/server/snapshot";

export function CashFlowForecast({
  forecast,
  money,
  hidden,
}: {
  forecast: Snapshot["forecast"][number] | undefined;
  money: (amount: string | bigint, currency?: string) => string;
  hidden: boolean;
}) {
  if (!forecast) return null;
  const values = forecast.points.map((point) => BigInt(point.balance));
  const minimum = values.reduce((a, b) => a < b ? a : b);
  const maximum = values.reduce((a, b) => a > b ? a : b);
  const range = maximum - minimum || 1n;
  const polyline = hidden ? "0,55 100,55" : forecast.points.map((point, index) => {
    const x = Math.round(index * 1000 / Math.max(1, forecast.points.length - 1)) / 10;
    const normalized = Number((BigInt(point.balance) - minimum) * 700n / range) / 10;
    return `${x},${85 - normalized}`;
  }).join(" ");
  const events = forecast.points.filter((point) => point.events.length > 0);
  return (
    <section className="forecast-card">
      <div className="forecast-copy">
        <p className="eyebrow">30-day outlook · {forecast.currency}</p>
        <h2>{money(forecast.endBalance, forecast.currency)}</h2>
        <p>Projected balance after confirmed recurring money and planned bills.</p>
        <div className="forecast-stats">
          <span>Lowest point <strong>{money(forecast.lowestBalance, forecast.currency)}</strong></span>
          <span>On <strong>{forecast.lowestOn}</strong></span>
        </div>
      </div>
      <div className="forecast-chart" aria-label="Projected balance over 30 days">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
          <path d="M0 85 H100" className="forecast-baseline" />
          <polyline points={polyline} className="forecast-line" />
        </svg>
        <div className="forecast-dates"><span>Today</span><span>30 days</span></div>
      </div>
      <div className="forecast-events">
        {events.length ? events.slice(0, 4).map((point) => (
          <div key={point.date}>
            <span>{point.date}</span>
            <strong>{point.events.join(", ")}</strong>
            <span>{money(point.change, forecast.currency)}</span>
          </div>
        )) : <p>No confirmed changes in the next 30 days.</p>}
      </div>
    </section>
  );
}
