import test from "node:test";
import assert from "node:assert/strict";
import { runBacktest, runBacktestBatch } from "../src/backtest.js";

test("backtest executa ciclos simulados sem dinheiro real", async () => {
  const result = await runBacktest({ initialBalance: 10, cycles: 20, seed: 1 });
  assert.equal(result.initialBalance, 10);
  assert.equal(result.cyclesRequested, 20);
  assert.ok(result.finalBalance >= 0);
  assert.ok(result.attempts >= 0);
});

test("batch de backtests agrega sobrevivência", async () => {
  const result = await runBacktestBatch({ runs: 3, cycles: 10, initialBalance: 10 });
  assert.equal(result.runs, 3);
  assert.equal(result.cycles, 10);
  assert.equal(result.survivors + result.deaths, 3);
  assert.ok(result.survivalRate >= 0 && result.survivalRate <= 1);
});
