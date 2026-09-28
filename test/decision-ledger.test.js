import test from "node:test";
import assert from "node:assert/strict";
import { DecisionLedger } from "../src/decision-ledger.js";

test("ledger registra decisões e calcula estatísticas", () => {
  const ledger = new DecisionLedger();

  ledger.record({
    cycle: 1,
    decision: "EXECUTE",
    strategy: "BALANCED",
    opportunity: {
      title: "Pesquisa",
      category: "RESEARCH",
      estimatedRevenue: 6,
      estimatedCost: 1,
      risk: 0.1,
      effort: 1
    },
    score: 4.5,
    survival: { allowed: true },
    outcome: { status: "SUCCESS", net: 5 }
  });

  ledger.record({
    cycle: 2,
    decision: "EXECUTE",
    strategy: "EXPLORATORY",
    opportunity: {
      title: "Produto",
      category: "PRODUCT",
      estimatedRevenue: 12,
      estimatedCost: 2,
      risk: 0.25,
      effort: 3
    },
    score: 6,
    survival: { allowed: true },
    outcome: { status: "FAILURE", net: -2 }
  });

  assert.equal(ledger.stats().totalDecisions, 2);
  assert.equal(ledger.stats().executedDecisions, 2);
  assert.equal(ledger.stats().successfulDecisions, 1);
  assert.equal(ledger.stats().successRate, 0.5);
  assert.equal(ledger.stats().net, 3);
  assert.equal(ledger.recent(1)[0].cycle, 2);
});
