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


test("backtest hostil protege capital quando oportunidades são caras", async () => {
  const hostileMarket = () => new (class {
    available() {
      return [{
        name: "Oportunidade hostil",
        category: "SERVICE",
        estimatedRevenue: 100,
        estimatedCost: 9,
        risk: 0.9,
        effort: 8,
        status: "OPEN"
      }];
    }

    add() {}
  })();

  const result = await runBacktest({
    initialBalance: 10,
    cycles: 20,
    seed: 99,
    marketFactory: hostileMarket
  });

  assert.equal(result.finalBalance, 10);
  assert.equal(result.net, 0);
  assert.equal(result.alive, true);
});

test("backtest nunca produz saldo negativo mesmo em cenário adverso", async () => {
  const hostileMarket = () => new (class {
    available() {
      return [{
        name: "Operação arriscada",
        category: "SERVICE",
        estimatedRevenue: 3,
        estimatedCost: 2,
        risk: 0.95,
        effort: 2,
        status: "OPEN"
      }];
    }

    add() {}
  })();

  const result = await runBacktest({
    initialBalance: 10,
    cycles: 50,
    seed: 123,
    marketFactory: hostileMarket
  });

  assert.ok(result.finalBalance >= 0);
  assert.ok(result.alive || result.status === "DEAD");
});
