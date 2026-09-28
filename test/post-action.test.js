import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAction } from "../src/post-action.js";
test("post action compares expected and actual", () => {
  const r = evaluateAction({ opportunity:{ estimatedRevenue:5, estimatedCost:1 }, outcome:{net:3}, balanceBefore:10, balanceAfter:13 });
  assert.equal(r.variance, -1);
  assert.equal(r.profitable, true);
});
