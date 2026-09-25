import { isIP } from "node:net";

function publicHTTPS(value: string | undefined, originOnly = false) {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^\[|\]$/g, "");
    return url.protocol === "https:" && !url.username && !url.password
      && host.includes(".") && !isIP(host)
      && !/(^localhost$|\.(invalid|test|example|local|localhost)$)/.test(host)
      && !/(^|\.)example\.(com|org|net)$/.test(host)
      && (!originOnly || ((url.pathname === "/" || url.pathname === "") && !url.search && !url.hash));
  } catch { return false; }
}

export function productionConfigIssues() {
  if (process.env.REQUIRE_PRODUCTION_CONFIG !== "true") return [];
  const issues: string[] = [];
  if (!publicHTTPS(process.env.APP_ORIGIN, true)) issues.push("APP_ORIGIN_HTTPS");
  if (Buffer.from(process.env.APP_ENCRYPTION_KEY ?? "", "base64").length !== 32) issues.push("APP_ENCRYPTION_KEY");
  if ((process.env.RATE_LIMIT_SALT ?? "").length < 32) issues.push("RATE_LIMIT_SALT");
  if (process.env.REQUIRE_EMAIL_VERIFICATION !== "true") issues.push("EMAIL_VERIFICATION");
  if (process.env.EMAIL_DELIVERY_MODE !== "resend" || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) issues.push("EMAIL_DELIVERY");
  if (!process.env.NEXT_PUBLIC_SUPPORT_EMAIL) issues.push("SUPPORT_EMAIL");
  if (!publicHTTPS(process.env.MONITORING_WEBHOOK_URL)) issues.push("MONITORING");
  return issues;
}
