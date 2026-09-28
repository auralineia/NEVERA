import test from "node:test";
import assert from "node:assert/strict";
import { EconomicSandbox, sandboxProfiles } from "../src/economic-sandbox.js";
test("economic sandbox supports multiple regimes", () => {
  const sandbox = new EconomicSandbox({ regime:"RECESSION" });
  const result = sandbox.step({ estimatedRevenue:5, estimatedCost:1, risk:.1 }, () => .5);
  assert.equal(result.regime, "RECESSION");
  assert.equal(sandboxProfiles().length, 4);
});
