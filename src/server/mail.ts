import { AppError } from "./errors";

export async function sendAccountEmail(
  kind: "verify" | "reset",
  email: string,
  token: string,
) {
  const origin = process.env.APP_ORIGIN;
  if (!origin) throw new AppError("Application origin is not configured.", 503);
  const path = kind === "verify" ? "/verify-email" : "/reset-password";
  const url = `${origin}${path}?token=${encodeURIComponent(token)}`;
  const subject = kind === "verify" ? "Verify your Expenses Tracker email" : "Reset your Expenses Tracker password";
  const purpose = kind === "verify" ? "verify your email" : "reset your password";
  if (process.env.EMAIL_DELIVERY_MODE !== "resend") {
    if (process.env.NODE_ENV === "production")
      throw new AppError("Email delivery is not configured.", 503);
    console.info(JSON.stringify({ level: "info", type: "development-email", kind, email, url }));
    return;
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new AppError("Email delivery is not configured.", 503);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      text: `Use this secure link to ${purpose}: ${url}\n\nThis link expires soon. If you did not request it, you can ignore this email.`,
    }),
  });
  if (!response.ok) throw new AppError("We could not send the email. Please try again.", 503);
}
