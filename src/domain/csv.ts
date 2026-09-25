export type ImportRow = {
  date: string;
  description: string;
  amount: string;
  type: "income" | "expense";
  category: string;
};
const categoryAliases: Record<string, string> = {
  food: "Food & groceries", groceries: "Food & groceries", grocery: "Food & groceries",
  restaurant: "Food & groceries", dining: "Food & groceries",
  transportation: "Transport", fuel: "Transport", taxi: "Transport", ride: "Transport", transit: "Transport",
  rent: "Housing", mortgage: "Housing", home: "Housing",
  bills: "Utilities", electricity: "Utilities", water: "Utilities", internet: "Utilities", airtime: "Utilities", phone: "Utilities",
  medical: "Health", pharmacy: "Health", healthcare: "Health",
  salary: "Income", payroll: "Income", wages: "Income", interest: "Income",
};
const supportedCategories = new Map([
  "Food & groceries", "Transport", "Housing", "Utilities", "Shopping", "Health",
  "Entertainment", "Education", "Travel", "Income", "Other",
].map((value) => [value.toLowerCase(), value]));
function normalizeCategory(value: string) {
  const key = value.trim().toLowerCase();
  return supportedCategories.get(key) ?? categoryAliases[key] ?? "Other";
}
function normalizeType(value: string) {
  const key = value.trim().toLowerCase();
  if (["income", "credit", "deposit", "inflow", "cr"].includes(key)) return "income" as const;
  if (["expense", "debit", "withdrawal", "payment", "outflow", "dr"].includes(key)) return "expense" as const;
  return null;
}
export function parseCsv(text: string): ImportRow[] {
  if (text.length > 500_000)
    throw new Error("CSV must be smaller than 500 KB.");
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = (rows.shift() ?? []).map((x) =>
    x.replace(/^\uFEFF/, "").toLowerCase(),
  );
  for (const h of ["date", "description", "amount", "type"])
    if (!headers.includes(h)) throw new Error(`CSV needs a ${h} column.`);
  if (!rows.length || rows.length > 500)
    throw new Error("Import between 1 and 500 rows at a time.");
  return rows.map((r, i) => {
    const read = (key: string) => r[headers.indexOf(key)] ?? "";
    const type = normalizeType(read("type"));
    if (!type)
      throw new Error(`Row ${i + 2}: type can be income, expense, credit, debit, deposit, or withdrawal.`);
    return {
      date: read("date"),
      description: read("description"),
      amount: read("amount").replaceAll(",", ""),
      type,
      category: normalizeCategory(read("category")),
    };
  });
}
