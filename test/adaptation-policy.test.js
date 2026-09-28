import test from "node:test";
import assert from "node:assert/strict";
import { adaptPolicy } from "../src/adaptation-policy.js";
test("adaptation becomes defensive after repeated failures", () => {
  assert.equal(adaptPolicy({successRate:.2, failures:4}).mode, "DEFENSIVE");
});
