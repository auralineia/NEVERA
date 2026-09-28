import test from "node:test";
import assert from "node:assert/strict";
import { OpportunityEngine } from "../src/opportunity-engine.js";

test("engine ranks viable opportunities", () => {
  const engine = new OpportunityEngine({
    evaluator: (opportunity) => ({
      viable: true,
      viabilityScore: opportunity.score
    })
  });
  const result = engine.discover([{ name: "a", score: 1 }, { name: "b", score: 2 }], 10);
  assert.equal(result[0].opportunity.name, "b");
});
