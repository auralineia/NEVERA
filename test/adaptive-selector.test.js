import test from "node:test";
import assert from "node:assert/strict";
import { selectAdaptive } from "../src/adaptive-selector.js";
test("adaptive selector returns bounded candidates", () => {
  const r = selectAdaptive([{name:"a",category:"SERVICE",estimatedRevenue:5,estimatedCost:1,risk:.1}], {balance:10,max:1});
  assert.equal(r.length, 1);
});
