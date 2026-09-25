import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeIOSDiagnostic } from "../src/server/diagnostics";
test("diagnostic reports discard arbitrary sensitive strings and raw crash content", () => {
  const result = sanitizeIOSDiagnostic({ crashDiagnostics: [{ exceptionReason: "secret-user-data", callStackTree: { path: "/private/user" } }], email: "private@example.test", cpuMetrics: { secret: "transaction-data" } });
  assert.equal(result.crashes, 1);
  assert.deepEqual(result.metricCategories, ["cpuMetrics"]);
  assert.doesNotMatch(JSON.stringify(result), /secret|private|transaction/);
  assert.throws(() => sanitizeIOSDiagnostic({ crashDiagnostics: "invalid" }));
});
