import test from "node:test";
import assert from "node:assert/strict";
import { OpportunityCreator } from "../src/creator.js";

test("NEVERA consegue criar uma oportunidade inicial", () => {
  const creator = new OpportunityCreator();
  const opportunity = creator.createFromMemory({
    stats: () => ({ attempts: 0, successRate: 0 })
  });

  assert.equal(opportunity.source, "NEVERA");
  assert.ok(opportunity.estimatedRevenue > opportunity.estimatedCost);
});

test("NEVERA adapta a oportunidade com base no histórico", () => {
  const creator = new OpportunityCreator();
  const opportunity = creator.createFromMemory({
    stats: () => ({ attempts: 3, successRate: 0.66 })
  });

  assert.equal(opportunity.category, "SERVICE");
});


test("NEVERA descobre oportunidade a partir do contexto de mercado", () => {
  const creator = new OpportunityCreator();
  const opportunity = creator.discover({
    stats: () => ({ attempts: 4, successRate: 0.75 })
  }, {
    demand: 1.2,
    competition: 0.8
  });

  assert.equal(opportunity.source, "NEVERA_DISCOVERY");
  assert.equal(opportunity.category, "SERVICE");
  assert.ok(opportunity.estimatedRevenue > opportunity.estimatedCost);
});


test("NEVERA consegue escanear múltiplas oportunidades", () => {
  const creator = new OpportunityCreator();
  const opportunities = creator.scan({
    stats: () => ({ attempts: 0, successRate: 0 })
  }, [
    { demand: 1.2, competition: 0.8 },
    { demand: 0.8, competition: 1.2 },
    { demand: 1, competition: 1 }
  ]);

  assert.equal(opportunities.length, 3);
  assert.ok(opportunities.every((item) => item.source === "NEVERA_DISCOVERY"));
});
