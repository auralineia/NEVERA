import test from "node:test";
import assert from "node:assert/strict";
import { CapitalManager } from "../src/capital-manager.js";

test("capital manager preserves reserve", () => {
  const manager = new CapitalManager();
  const plan = manager.plan(10, [{ estimatedCost: 1 }]);
  assert.equal(plan.reserve, 5);
});
