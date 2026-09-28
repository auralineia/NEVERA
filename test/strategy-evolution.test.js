import test from "node:test";
import assert from "node:assert/strict";
import { testStrategy } from "../src/strategy-evolution.js";
test("strategy evolution tests mutations without changing agent capital", () => {
  const result = testStrategy(
    { name:"X", riskMultiplier:1, revenueMultiplier:1 },
    [{ name:"A", category:"SERVICE", estimatedRevenue:5, estimatedCost:1, risk:.1 }],
    { cycles:3, seed:7 }
  );
  assert.equal(result.strategy, "X");
  assert.equal(result.results.length, 3);
});
