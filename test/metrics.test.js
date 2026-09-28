import test from "node:test";
import assert from "node:assert/strict";
import { calculateMetrics } from "../src/metrics.js";

test("métricas calculam saúde econômica básica", () => {
  const metrics = calculateMetrics({
    initialBalance: 10,
    currentBalance: 17,
    learning: {
      results: [
        { status: "SUCCESS", net: 7 },
        { status: "FAILURE", net: -2 }
      ],
      stats: () => ({
        attempts: 2,
        successRate: 0.5,
        net: 5
      })
    },
    strategies: []
  });

  assert.equal(metrics.netWorthChange, 7);
  assert.equal(metrics.averageNet, 2.5);
  assert.equal(metrics.totalRevenue, 7);
  assert.equal(metrics.totalLoss, 2);
});
