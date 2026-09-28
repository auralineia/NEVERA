import test from "node:test";
import assert from "node:assert/strict";
import { defaultMarket } from "../src/market.js";
import { chooseOpportunity } from "../src/strategy.js";

test("NEVERA escolhe uma oportunidade compatível com o saldo", () => {
  const market = defaultMarket();
  const choice = chooseOpportunity(market.available(), 10);

  assert.ok(choice);
  assert.ok(choice.opportunity.estimatedCost <= 10);
});

test("oportunidade que custa mais que o saldo não pode ser escolhida", () => {
  const opportunities = [
    {
      name: "Cara demais",
      estimatedRevenue: 100,
      estimatedCost: 20,
      risk: 0,
      effort: 1
    },
    {
      name: "Barata",
      estimatedRevenue: 2,
      estimatedCost: 0.5,
      risk: 0,
      effort: 1
    }
  ];

  const choice = chooseOpportunity(opportunities, 10);

  assert.equal(choice.opportunity.name, "Barata");
});
