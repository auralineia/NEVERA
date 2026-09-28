import test from "node:test";
import assert from "node:assert/strict";
import { simulateOutcome } from "../src/simulator.js";

test("oportunidade de baixo risco pode gerar receita simulada", () => {
  const outcome = simulateOutcome({
    estimatedRevenue: 8,
    estimatedCost: 1,
    risk: 0.15
  });

  assert.equal(outcome.status, "SUCCESS");
  assert.equal(outcome.net, 7);
});

test("oportunidade de alto risco pode falhar na simulação", () => {
  const outcome = simulateOutcome({
    estimatedRevenue: 15,
    estimatedCost: 3,
    risk: 0.8
  });

  assert.equal(outcome.status, "FAILURE");
  assert.equal(outcome.net, -3);
});
