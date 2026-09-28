import { runBacktestBatch } from "../src/backtest.js";

const result = await runBacktestBatch({
  runs: 20,
  cycles: 1000,
  initialBalance: 10,
  seed: 20260928
});

console.log(JSON.stringify(result, null, 2));
