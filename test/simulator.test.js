import test from "node:test";
import assert from "node:assert/strict";
import { createSeededRandom, simulateOutcome } from "../src/simulator.js";

test("simulação probabilística é reproduzível com seed", () => {
  const randomA = createSeededRandom(123);
  const randomB = createSeededRandom(123);

  const opportunity = {
    estimatedRevenue: 8,
    estimatedCost: 1,
    risk: 0.15
  };

  assert.deepEqual(
    simulateOutcome(opportunity, randomA),
    simulateOutcome(opportunity, randomB)
  );
});

test("probabilidade de sucesso respeita o risco", () => {
  const success = simulateOutcome(
    { estimatedRevenue: 8, estimatedCost: 1, risk: 0.15 },
    () => 0.10
  );
  const failure = simulateOutcome(
    { estimatedRevenue: 8, estimatedCost: 1, risk: 0.15 },
    () => 0.90
  );

  assert.equal(success.status, "SUCCESS");
  assert.equal(failure.status, "FAILURE");
  assert.equal(failure.net, -1);
});

test("falha consome o custo mesmo sem receita", () => {
  const outcome = simulateOutcome(
    { estimatedRevenue: 15, estimatedCost: 3, risk: 0.8 },
    () => 0.99
  );

  assert.equal(outcome.status, "FAILURE");
  assert.equal(outcome.net, -3);
});
