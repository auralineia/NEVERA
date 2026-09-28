import test from "node:test";
import assert from "node:assert/strict";
import { Learning } from "../src/learning.js";

test("learning atribui resultado por categoria e estratégia", () => {
  const learning = new Learning([
    { category: "SERVICE", strategy: "BALANCED", status: "SUCCESS", net: 8 },
    { category: "SERVICE", strategy: "BALANCED", status: "SUCCESS", net: 6 },
    { category: "SERVICE", strategy: "EXPLORATORY", status: "FAILURE", net: -2 }
  ]);

  const balanced = learning.attribution({ category: "SERVICE", strategy: "BALANCED" });
  assert.equal(balanced.attempts, 2);
  assert.equal(balanced.successRate, 1);
  assert.equal(balanced.averageNet, 7);

  const strategies = learning.compareStrategies(["BALANCED", "EXPLORATORY"]);
  assert.equal(strategies.length, 2);
  assert.equal(strategies[1].net, -2);
});
