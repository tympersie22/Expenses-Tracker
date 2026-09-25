import { currencies, currencyDigits } from "./locale-data";
export { currencies } from "./locale-data";
export function precision(currency: string) {
  if (!currencies.includes(currency))
    throw new Error("Choose a supported currency.");
  return currencyDigits[currency];
}
export function parseMoney(
  input: string,
  currency: string,
  allowNegative = false,
): bigint {
  const digits = precision(currency);
  const value = input.trim();
  if (
    !new RegExp(
      `^${allowNegative ? "-?" : ""}\\d{1,12}(?:\\.\\d{1,${Math.max(digits, 1)}})?$`,
    ).test(value)
  )
    throw new Error("Enter a valid amount without commas.");
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace("-", "").split(".");
  if (fraction.length > digits)
    throw new Error(`${currency} supports ${digits} decimal places.`);
  const amount =
    BigInt(whole) * 10n ** BigInt(digits) +
    BigInt(fraction.padEnd(digits, "0") || "0");
  if (amount > 100_000_000_000_000n)
    throw new Error("This amount exceeds the supported limit.");
  return negative ? -amount : amount;
}
export function formatMoney(
  minor: string | bigint,
  currency: string,
  locale = "en",
) {
  const value = BigInt(minor);
  const digits = precision(currency);
  const scale = 10n ** BigInt(digits);
  const abs = value < 0n ? -value : value;
  // Intl accepts BigInt; only the fractional digits are formatted manually.
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: digits,
  }).formatToParts(value < 0n ? -(abs / scale) : abs / scale);
  let result = formatted
    .map((p) =>
      p.type === "fraction"
        ? (abs % scale).toString().padStart(digits, "0")
        : p.value,
    )
    .join("");
  if (value < 0n && abs < scale) result = "−" + result;
  return result;
}
export function decimalMoney(minor: string | bigint, currency: string) {
  const n = BigInt(minor),
    digits = precision(currency),
    scale = 10n ** BigInt(digits),
    abs = n < 0n ? -n : n;
  return `${n < 0n ? "-" : ""}${abs / scale}${digits ? "." + (abs % scale).toString().padStart(digits, "0") : ""}`;
}
export const categories = [
  "Food & groceries",
  "Transport",
  "Housing",
  "Utilities",
  "Shopping",
  "Health",
  "Entertainment",
  "Education",
  "Travel",
  "Income",
  "Other",
] as const;
export function dateOnly(input: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input))
    throw new Error("Use a date in YYYY-MM-DD format.");
  const date = new Date(`${input}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input ||
    input < "1900-01-01" ||
    input > "2200-12-31"
  )
    throw new Error("Enter a valid date between 1900 and 2200.");
  return date;
}
export function today(timeZone = "UTC", now = new Date()) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return `${p.find((x) => x.type === "year")!.value}-${p.find((x) => x.type === "month")!.value}-${p.find((x) => x.type === "day")!.value}`;
}
export function available(balance: bigint, reserved: bigint, bills: bigint) {
  return balance - reserved - bills;
}
