import test from "node:test";
import assert from "node:assert/strict";
import { ActionBudget } from "../src/action-budget.js";

test("action budget limits spending", () => {
  const budget = new ActionBudget({ maxActions: 3, maxCost: 1 });
  const result = budget.allocate(10, [{ estimatedCost: 0.75 }, { estimatedCost: 0.75 }]);
  assert.equal(result.selected.length, 1);
});
