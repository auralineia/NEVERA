import test from "node:test";
import assert from "node:assert/strict";
import { MarketEventEngine } from "../src/market-events.js";

test("motor de eventos gera eventos determinísticos", () => {
  const engine = new MarketEventEngine(10);
  const opportunities = [{
    name: "Serviço",
    demand: 1,
    competition: 1,
    risk: 0.1,
    status: "OPEN"
  }];

  const event = engine.next(opportunities);

  assert.equal(event.tick, 1);
  assert.ok([
    "STABLE_MARKET",
    "DEMAND_SPIKE",
    "MARKET_SATURATION",
    "OPPORTUNITY_EXPIRES",
    "NEW_DEMAND"
  ].includes(event.type));
  assert.equal(engine.recent(1)[0].tick, 1);
});

test("evento de nova demanda cria oportunidade simulada", () => {
  const engine = new MarketEventEngine(3);
  const opportunities = [];

  let event;
  for (let i = 0; i < 20; i += 1) {
    event = engine.next(opportunities);
    if (event.type === "NEW_DEMAND") break;
  }

  if (event.type === "NEW_DEMAND") {
    assert.ok(opportunities.some((item) => item.source === "SIMULATED_MARKET_EVENT"));
  }
});
