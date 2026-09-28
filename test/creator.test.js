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
