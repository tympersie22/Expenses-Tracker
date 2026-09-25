import test from "node:test";
import assert from "node:assert/strict";
import {
  parseMoney,
  formatMoney,
  decimalMoney,
  available,
  dateOnly,
  today,
} from "../src/domain/money";
import { parseCsv } from "../src/domain/csv";
import { base32, decrypt, encrypt, verifyTotp } from "../src/server/secure-data";
test("money stays exact across two-, zero-, and three-decimal currencies", () => {
  assert.equal(parseMoney("0.10", "USD") + parseMoney("0.20", "USD"), 30n);
  assert.equal(parseMoney("100", "JPY"), 100n);
  assert.equal(parseMoney("1.001", "KWD"), 1001n);
  assert.throws(() => parseMoney("1.1", "JPY"));
  assert.throws(() => parseMoney("1.001", "USD"));
  assert.throws(() => parseMoney("-1", "USD"));
  assert.throws(() => parseMoney("Infinity", "USD"));
  assert.throws(() => parseMoney("1e4", "USD"));
  assert.throws(() => parseMoney("1,000", "USD"));
  assert.equal(decimalMoney(-1n, "USD"), "-0.01");
  assert.match(formatMoney(-1n, "USD"), /0.01/);
  assert.equal(
    decimalMoney(parseMoney("999999999.99", "USD"), "USD"),
    "999999999.99",
  );
});
test("available funds subtract reservations and bills without clamping debt", () => {
  assert.equal(available(100000n, 20000n, 30000n), 50000n);
  assert.equal(available(100n, 200n, 50n), -150n);
});
test("dates validate actual calendar dates and use the user time zone", () => {
  assert.throws(() => dateOnly("2026-02-30"));
  assert.throws(() => dateOnly("invalid"));
  assert.equal(
    today("Pacific/Honolulu", new Date("2026-09-18T05:00:00Z")),
    "2026-09-17",
  );
});
test("CSV handles quoted commas, escaped quotes, BOM, and strict types", () => {
  const rows = parseCsv(
    '\uFEFFdate,description,amount,type\r\n2026-09-01,"Coffee, "+"""large"""+"",5.25,expense'.replaceAll(
      '"+"',
      "",
    ),
  );
  assert.equal(rows[0].amount, "5.25");
  assert.equal(rows[0].category, "Other");
  const bankRows = parseCsv(
    'date,description,amount,type,category\n2026-09-02,Supermarket,"1,250.50",debit,Groceries\n2026-09-03,Pay,800,credit,Payroll',
  );
  assert.deepEqual(
    bankRows.map(({ amount, type, category }) => ({ amount, type, category })),
    [
      { amount: "1250.50", type: "expense", category: "Food & groceries" },
      { amount: "800", type: "income", category: "Income" },
    ],
  );
  assert.throws(() => parseCsv("date,amount\n2026-01-01,10"));
  assert.throws(() =>
    parseCsv("date,description,amount,type\n2026-01-01,a,10,transfer"),
  );
  assert.throws(() =>
    parseCsv('date,description,amount,type\n2026-01-01,"oops,10,expense'),
  );
});
test("sensitive values encrypt authentically and TOTP allows only the time window", () => {
  process.env.APP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  const encrypted = encrypt("private-value");
  assert.notEqual(encrypted, "private-value");
  assert.equal(decrypt(encrypted), "private-value");
  assert.equal(base32(Buffer.from("12345678901234567890")), "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  assert.equal(verifyTotp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", "287082", 59_000), true);
  assert.equal(verifyTotp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", "287082", 180_000), false);
});
