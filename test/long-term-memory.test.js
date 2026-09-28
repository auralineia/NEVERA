import test from "node:test";
import assert from "node:assert/strict";
import { LongTermMemory } from "../src/long-term-memory.js";
test("long term memory recalls events", () => {
  const m = new LongTermMemory();
  m.remember("DECISION", {score:2});
  assert.equal(m.recall("DECISION").length, 1);
});
