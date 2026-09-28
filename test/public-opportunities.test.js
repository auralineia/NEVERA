import test from "node:test";
import assert from "node:assert/strict";
import { translatePublicSignals } from "../src/public-opportunities.js";

test("public signals become non-monetary research opportunities", () => {
  const result = translatePublicSignals([{ source: "test", status: "AVAILABLE", signal: "PUBLIC_DATA" }]);
  assert.equal(result[0].category, "RESEARCH");
  assert.equal(result[0].estimatedRevenue, 0);
});
