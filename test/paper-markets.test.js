import test from "node:test";
import assert from "node:assert/strict";
import { createPaperPortfolio, markPaperPortfolio, miningEstimate, stockPaperResult } from "../src/paper-markets.js";

test("mining estimate separates gross, electricity, fees, and net", () => {
  const result = miningEstimate({
    hashRateTH: 10,
    powerWatts: 3000,
    electricityPricePerKwh: 0.8,
    grossRevenuePerTHDay: 2,
    poolFeePercent: 2,
    days: 2
  });
  assert.equal(result.mode, "SIMULATION_ONLY");
  assert.equal(result.grossRevenue, 40);
  assert.equal(result.electricityKwh, 144);
  assert.equal(result.electricityCost, 115.2);
  assert.equal(result.poolFees, 0.8);
  assert.equal(result.net, -76);
  assert.equal(result.profitable, false);
});

test("stock paper result reports marked value and fees without executing a trade", () => {
  const result = stockPaperResult({ symbol: "TEST3", quantity: 4, entryPrice: 10, currentPrice: 12, feesPercent: 1 });
  assert.equal(result.mode, "SIMULATION_ONLY");
  assert.equal(result.invested, 40);
  assert.equal(result.marketValue, 48);
  assert.equal(result.fees, 0.88);
  assert.equal(result.pnl, 7.12);
  assert.equal(result.returnPercent, 17.8);
});

test("paper portfolio marks prices and preserves cash/history", () => {
  const initial = createPaperPortfolio({
    startingCash: 500,
    positions: [{ symbol: "TEST3", quantity: 2, entryPrice: 10, currentPrice: 10 }]
  });
  const marked = markPaperPortfolio(initial, { TEST3: 13 }, "2026-10-01T00:00:00.000Z");
  assert.equal(marked.cash, 500);
  assert.equal(marked.marketValue, 26);
  assert.equal(marked.unrealizedPnl, 6);
  assert.equal(marked.equity, 526);
  assert.equal(marked.history.length, 1);
  assert.equal(marked.history[0].timestamp, "2026-10-01T00:00:00.000Z");
});
