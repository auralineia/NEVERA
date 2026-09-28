import test from "node:test";
import assert from "node:assert/strict";
import { opportunityMetrics } from "../src/opportunity-metrics.js";

test("opportunity metrics summarize viability", () => {
  const result = opportunityMetrics([
    { evaluation: { viable: true, viabilityScore: 0.8 } },
    { evaluation: { viable: false, viabilityScore: 0.2 } }
  ]);
  assert.equal(result.viable, 1);
  assert.equal(result.rejected, 1);
});
