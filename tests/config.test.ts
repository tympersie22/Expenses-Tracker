import test from "node:test";
import assert from "node:assert/strict";
import { productionConfigIssues } from "../src/server/config";

test("production configuration rejects placeholder, credential-bearing and non-origin URLs", () => {
  const saved = { ...process.env };
  try {
    process.env.REQUIRE_PRODUCTION_CONFIG = "true";
    for (const origin of ["https://staging.example.invalid", "https://example.com", "https://127.0.0.1", "https://[::1]", "https://user@expensestracker.com", "https://expensestracker.com/path", "http://expensestracker.com"]) {
      process.env.APP_ORIGIN = origin;
      assert.ok(productionConfigIssues().includes("APP_ORIGIN_HTTPS"), origin);
    }
    process.env.APP_ORIGIN = "https://expensestracker.com";
    process.env.MONITORING_WEBHOOK_URL = "https://monitor.expensestracker.com/events";
    assert.ok(!productionConfigIssues().includes("APP_ORIGIN_HTTPS"));
    assert.ok(!productionConfigIssues().includes("MONITORING"));
    process.env.MONITORING_WEBHOOK_URL = "http://monitor.expensestracker.com/events";
    assert.ok(productionConfigIssues().includes("MONITORING"));
  } finally { process.env = saved; }
});
