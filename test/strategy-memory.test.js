import test from "node:test";
import assert from "node:assert/strict";
import { StrategyMemory } from "../src/strategy-memory.js";
test("strategy memory records evaluation", () => {
  const m = new StrategyMemory();
  m.record({name:"X"}, {score:.8});
  assert.equal(m.history("X").length, 1);
});
