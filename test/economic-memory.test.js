import test from "node:test";
import assert from "node:assert/strict";
import { EconomicMemory } from "../src/economic-memory.js";

test("economic memory aggregates performance", () => {
  const memory = new EconomicMemory();
  memory.record({ name: "x", category: "SERVICE" }, { status: "SUCCESS", revenue: 5, cost: 1, net: 4 });
  assert.equal(memory.stats("SERVICE").averageNet, 4);
});
