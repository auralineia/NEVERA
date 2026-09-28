import { runBacktestBatch } from "../src/backtest.js";

const result = await runBacktestBatch({
  runs: Number(process.env.NEVERA_BACKTEST_RUNS ?? 20),
  cycles: Number(process.env.NEVERA_BACKTEST_CYCLES ?? 1000),
  initialBalance: Number(process.env.NEVERA_BACKTEST_BALANCE ?? 10),
  seed: Number(process.env.NEVERA_BACKTEST_SEED ?? 20260928)
});

console.log(JSON.stringify(result, null, 2));
