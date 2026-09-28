import { runBacktestBatch } from "../src/backtest.js";

const result = await runBacktestBatch({
  runs: Number(process.env.NEVERA_PAPER_RUNS ?? 20),
  cycles: Number(process.env.NEVERA_PAPER_CYCLES ?? 10000),
  initialBalance: Number(process.env.NEVERA_PAPER_BALANCE ?? 1000),
  seed: Number(process.env.NEVERA_PAPER_SEED ?? 20260928)
});

console.log(JSON.stringify({
  mode: "PAPER_ECONOMY",
  ...result,
  totalCycles: result.runs * result.cycles
}, null, 2));
