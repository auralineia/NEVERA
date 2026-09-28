import test from "node:test";
import assert from "node:assert/strict";
import { evaluateOpportunity } from "../src/evaluator.js";

test("avaliador aprova oportunidade saudável", () => {
  const result = evaluateOpportunity({
    estimatedRevenue: 10,
    estimatedCost: 2,
    risk: 0.1,
    effort: 2
  }, 10);

  assert.equal(result.viable, true);
});

test("avaliador rejeita oportunidade que não cabe no caixa", () => {
  const result = evaluateOpportunity({
    estimatedRevenue: 20,
    estimatedCost: 15,
    risk: 0.1,
    effort: 2
  }, 10);

  assert.equal(result.viable, false);
  assert.equal(result.affordable, false);
});
