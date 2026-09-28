import test from "node:test";
import assert from "node:assert/strict";
import { simulateEconomicOutcome } from "../src/economic-simulator.js";

test("economic simulator calculates net", () => {
  const result = simulateEconomicOutcome({ estimatedRevenue: 5, estimatedCost: 1, risk: 0 }, () => 0);
  assert.equal(result.net, 4);
});
