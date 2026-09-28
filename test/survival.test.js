import test from "node:test";
import assert from "node:assert/strict";
import { SurvivalManager } from "../src/survival.js";

test("sobrevivência permite gasto pequeno", () => {
  const survival = new SurvivalManager();
  const result = survival.assess(10, { estimatedCost: 1 });

  assert.equal(result.allowed, true);
  assert.equal(result.reserve, 3);
});

test("sobrevivência bloqueia gasto grande", () => {
  const survival = new SurvivalManager();
  const result = survival.assess(10, { estimatedCost: 4 });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "PROTECT_CAPITAL");
});
