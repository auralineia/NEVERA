import test from "node:test";
import assert from "node:assert/strict";
import { metaLearn } from "../src/meta-learning.js";
test("meta learning identifies preferred strategy", () => {
  const r = metaLearn({ strategies: { A:{successRate:.8,averageNet:2,attempts:5}, B:{successRate:.2,averageNet:-1,attempts:5} }});
  assert.equal(r.preferred, "A");
});
