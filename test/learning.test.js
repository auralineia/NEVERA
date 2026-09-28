import test from "node:test";
import assert from "node:assert/strict";
import { Learning } from "../src/learning.js";

test("NEVERA calcula desempenho por categoria", () => {
  const learning = new Learning([
    { category: "SERVICE", status: "SUCCESS", net: 8 },
    { category: "SERVICE", status: "SUCCESS", net: 6 },
    { category: "PRODUCT", status: "FAILURE", net: -2 }
  ]);

  const service = learning.categoryStats("SERVICE");
  assert.equal(service.attempts, 2);
  assert.equal(service.successRate, 1);
  assert.equal(service.averageNet, 7);

  const categories = learning.categories();
  assert.equal(categories.length, 2);
});
