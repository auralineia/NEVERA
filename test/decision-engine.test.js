import test from "node:test";
import assert from "node:assert/strict";
import { scoreDecision, chooseDecisions } from "../src/decision-engine.js";

test("decisão favorece margem, segurança de capital e menor risco", () => {
  const safe = {
    name: "SAFE",
    category: "SERVICE",
    estimatedRevenue: 8,
    estimatedCost: 1,
    risk: 0.1,
    demand: 1.1,
    competition: 0.9
  };
  const risky = {
    name: "RISKY",
    category: "PRODUCT",
    estimatedRevenue: 12,
    estimatedCost: 5,
    risk: 0.7,
    demand: 1,
    competition: 1
  };

  assert.ok(scoreDecision({ opportunity: safe, balance: 10 }) >
    scoreDecision({ opportunity: risky, balance: 10 }));
});

test("motor retorna decisões ordenadas", () => {
  const result = chooseDecisions([
    { name: "A", estimatedRevenue: 8, estimatedCost: 1, risk: 0.1 },
    { name: "B", estimatedRevenue: 5, estimatedCost: 1, risk: 0.2 }
  ], { balance: 10 }, 2);

  assert.equal(result.length, 2);
  assert.equal(result[0].opportunity.name, "A");
});
