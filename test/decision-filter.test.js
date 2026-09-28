import test from "node:test";
import assert from "node:assert/strict";
import { DecisionFilter } from "../src/decision-filter.js";
test("decision filter detects repeated category failures", () => {
  const f = new DecisionFilter();
  assert.equal(f.repeatedFailure({category:"X"}, {penalty:()=>.2}), true);
});
