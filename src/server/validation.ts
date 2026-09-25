import { z } from "zod";
import { currencies, categories, dateOnly } from "@/domain/money";
export const name = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .max(120, "Use fewer than 120 characters.");
export const currency = z
  .string()
  .refine((x) => currencies.includes(x), "Choose a supported currency.");
export const date = z.string().refine((x) => {
  try {
    dateOnly(x);
    return true;
  } catch {
    return false;
  }
}, "Enter a valid date (YYYY-MM-DD).");
export const amount = z.string().max(30);
export const category = z.enum(categories);
export const key = z.string().uuid("A valid request identifier is required.");
export const transactionInput = z
  .object({
    accountId: z.string().cuid(),
    toAccountId: z.string().cuid().optional(),
    kind: z.enum(["income", "expense", "transfer"]),
    description: name,
    category,
    amount,
    date,
    idempotencyKey: key,
  })
  .strict();
export const accountInput = z
  .object({
    name,
    kind: z.enum(["bank", "cash", "mobile-money", "savings", "wallet"]),
    currency,
    openingBalance: amount,
    openingDate: date,
    idempotencyKey: key,
  })
  .strict();
export const accountUpdateInput = z
  .object({
    name,
    kind: z.enum(["bank", "cash", "mobile-money", "savings", "wallet"]),
  })
  .strict();
export const budgetInput = z
  .object({
    category,
    currency,
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    amount,
  })
  .strict();
export const goalInput = z
  .object({
    accountId: z.string().cuid(),
    name,
    target: amount,
    reserved: amount,
  })
  .strict();
export const billInput = z
  .object({
    accountId: z.string().cuid(),
    title: name,
    category,
    amount,
    dueOn: date,
  })
  .strict();
export const importInput = z
  .object({
    accountId: z.string().cuid(),
    rows: z
      .array(
        z.object({
          date,
          description: name,
          amount,
          type: z.enum(["income", "expense"]),
          category,
        }),
      )
      .min(1)
      .max(500),
  })
  .strict();
