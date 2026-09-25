export function logEvent(level: "info" | "warn" | "error", type: string, fields: Record<string, unknown> = {}) {
  const entry = { timestamp: new Date().toISOString(), level, type, release: process.env.RELEASE_SHA ?? process.env.RENDER_GIT_COMMIT ?? "development", ...fields };
  (level === "error" ? console.error : level === "warn" ? console.warn : console.info)(JSON.stringify(entry));
}

export async function reportServerError(error: unknown, requestId: string) {
  const type = error instanceof Error ? error.name : "UnknownError";
  logEvent("error", "unhandled-request-error", { requestId, errorType: type });
  const url = process.env.MONITORING_WEBHOOK_URL;
  if (!url) return;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(process.env.MONITORING_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.MONITORING_WEBHOOK_TOKEN}` } : {}) },
      body: JSON.stringify({ service: "expenses-tracker", release: process.env.RELEASE_SHA ?? process.env.RENDER_GIT_COMMIT, requestId, errorType: type, occurredAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok) throw new Error("Monitoring rejected event");
  } catch {
    logEvent("warn", "monitoring-delivery-failed", { requestId });
  }
}

export async function reportIOSDiagnostic(userId: string, diagnostic: string) {
  const summary = sanitizeIOSDiagnostic(JSON.parse(diagnostic));
  logEvent("info", "ios-diagnostic", { userId: createSafeId(userId), diagnostic: summary });
  const url = process.env.MONITORING_WEBHOOK_URL;
  if (!url) return;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(process.env.MONITORING_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.MONITORING_WEBHOOK_TOKEN}` } : {}) },
      body: JSON.stringify({ service: "expenses-tracker-ios", release: process.env.RELEASE_SHA ?? process.env.RENDER_GIT_COMMIT, user: createSafeId(userId), diagnostic: summary, occurredAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) throw new Error("Monitoring rejected event");
  } catch { logEvent("warn", "ios-diagnostic-delivery-failed", { userId: createSafeId(userId) }); }
}

function createSafeId(value: string) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `u_${(hash >>> 0).toString(16)}`;
}
import { sanitizeIOSDiagnostic } from "./diagnostics";
