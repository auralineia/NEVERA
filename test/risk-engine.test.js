import test from "node:test";
import assert from "node:assert/strict";
import { assessRisk } from "../src/risk-engine.js";

test("risk engine blocks excessive exposure", () => {
  const result = assessRisk({ estimatedCost: 6, risk: 0.1 }, 10);
  assert.equal(result.allowed, false);
});
