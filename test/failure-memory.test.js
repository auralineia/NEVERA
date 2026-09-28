import test from "node:test";
import assert from "node:assert/strict";
import { FailureMemory } from "../src/failure-memory.js";

test("failure memory penalizes repeated failures", () => {
  const memory = new FailureMemory();
  memory.record({ name: "x", category: "PRODUCT" }, { status: "FAILURE", net: -1 });
  assert.equal(memory.penalty("PRODUCT"), 0.05);
});
