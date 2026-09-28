import test from "node:test";
import assert from "node:assert/strict";
import { confidenceScore } from "../src/confidence-score.js";

test("confidence rises with evidence", () => {
  assert.ok(confidenceScore({ attempts: 10, successRate: 1, sampleQuality: 1 }) > 0.9);
});
