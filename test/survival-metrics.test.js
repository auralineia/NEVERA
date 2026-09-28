import test from "node:test";
import assert from "node:assert/strict";
import { survivalMetrics } from "../src/survival-metrics.js";

test("survival metrics calculate retention", () => {
  const result = survivalMetrics({ initialBalance: 10, currentBalance: 8 });
  assert.equal(result.capitalRetention, 0.8);
  assert.equal(result.alive, true);
});
