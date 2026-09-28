import test from "node:test";
import assert from "node:assert/strict";
import { DynamicMarket } from "../src/dynamic-market.js";

test("mercado dinâmico altera condições das oportunidades", () => {
  const market = new DynamicMarket(10);

  const base = [{
    title: "Serviço",
    estimatedRevenue: 10,
    estimatedCost: 2
  }];

  const first = market.evolve(base);
  const second = market.evolve(base);

  assert.equal(first[0].marketTick, 1);
  assert.equal(second[0].marketTick, 2);
  assert.ok(first[0].demand >= 0.75);
  assert.ok(first[0].competition >= 0.7);
  assert.notEqual(first[0].estimatedRevenue, undefined);
});
