import test from "node:test";
import assert from "node:assert/strict";
import { DecisionMemory } from "../src/decision-memory.js";

test("decision memory stores decisions", () => {
  const memory = new DecisionMemory();
  memory.record({ cycle: 1, objective: "test", strategy: "BALANCED", opportunity: "x", score: 1, outcome: "SUCCESS" });
  assert.equal(memory.recent(1)[0].cycle, 1);
});
