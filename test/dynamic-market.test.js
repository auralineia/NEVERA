import test from "node:test";
import assert from "node:assert/strict";
import { DynamicMarket } from "../src/dynamic-market.js";

test("mercado dinâmico altera condições das oportunidades", () => {
  const market = new DynamicMarket(10);
  const base = [{
    title: "Serviço",
    category: "SERVICE",
    estimatedRevenue: 10,
    estimatedCost: 2
  }];

  const first = market.evolve(base);
  const second = market.evolve(base);

  assert.equal(first[0].marketTick, 1);
  assert.equal(second[0].marketTick, 2);
  assert.ok(first[0].demand >= 0);
  assert.ok(first[0].competition >= 0.7);
  assert.notEqual(first[0].estimatedRevenue, undefined);
});

test("demanda é finita e pode ser consumida", () => {
  const market = new DynamicMarket(10);
  const opportunity = { name: "Serviço", category: "SERVICE", estimatedRevenue: 10, estimatedCost: 2 };

  assert.equal(market.hasDemand(opportunity), true);
  assert.equal(market.consume(opportunity), true);
  assert.equal(market.consume(opportunity), true);
  assert.equal(market.consume(opportunity), true);
  assert.equal(market.consume(opportunity), false);
});

test("demanda se recupera gradualmente", () => {
  const market = new DynamicMarket(10);
  const opportunity = { name: "Serviço", category: "SERVICE", estimatedRevenue: 10, estimatedCost: 2 };

  market.consume(opportunity);
  market.consume(opportunity);
  market.consume(opportunity);

  for (let i = 0; i < 5; i += 1) market.evolve([opportunity]);

  assert.equal(market.hasDemand(opportunity), true);
  assert.ok(market.state().demandPool.SERVICE >= 1);
});

test("reserva de demanda pode ser liberada após falha", () => {
  const market = new DynamicMarket(10);
  const opportunity = { name: "Serviço", category: "SERVICE", estimatedRevenue: 10, estimatedCost: 2 };

  const before = market.state().demandPool.SERVICE;
  assert.equal(market.reserve(opportunity), true);
  assert.equal(market.state().demandPool.SERVICE, before - 1);

  assert.equal(market.release(opportunity), true);
  assert.equal(market.state().demandPool.SERVICE, before);
});
