import test from "node:test";
import assert from "node:assert/strict";
import { RiskMemory } from "../src/risk-memory.js";
test("risk memory aggregates evidence", () => {
  const memory = new RiskMemory();
  memory.record({ name:"x", category:"SERVICE" }, { score:.2 }, { status:"SUCCESS" });
  assert.equal(memory.stats("SERVICE").attempts, 1);
});
