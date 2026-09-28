import test from "node:test";
import assert from "node:assert/strict";
import { StrategyLab } from "../src/strategy-lab.js";
test("strategy lab generates experiments", () => {
  const lab = new StrategyLab();
  assert.match(lab.generate().name, /^NEVERA-EXP-/);
});
