import test from "node:test";
import assert from "node:assert/strict";
import { StrategyPortfolio } from "../src/strategies.js";

test("portfólio começa com estratégia balanceada", () => {
  const portfolio = new StrategyPortfolio();
  assert.equal(portfolio.choose().name, "BALANCED");
});

test("portfólio aprende com resultados", () => {
  const portfolio = new StrategyPortfolio();

  portfolio.record({ name: "CONSERVATIVE" }, { status: "SUCCESS", net: 2 });
  portfolio.record({ name: "BALANCED" }, { status: "SUCCESS", net: 1 });

  assert.equal(portfolio.choose().name, "CONSERVATIVE");
});
