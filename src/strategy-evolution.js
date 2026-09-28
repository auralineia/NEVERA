import { EconomicSandbox } from "./economic-sandbox.js";
import { createSeededRandom } from "./simulator.js";
import { evaluateStrategy } from "./strategy-evaluator.js";

export function testStrategy(strategy, opportunities = [], { cycles = 10, seed = 42, regime = "STABLE" } = {}) {
  const sandbox = new EconomicSandbox({ regime, seed });
  const random = createSeededRandom(seed * 97 + 11);
  const results = [];

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    const opportunity = opportunities[cycle % Math.max(1, opportunities.length)];
    if (!opportunity) break;
    const transformed = {
      ...opportunity,
      estimatedCost: Number((opportunity.estimatedCost * (strategy.riskMultiplier ?? 1)).toFixed(2)),
      estimatedRevenue: Number((opportunity.estimatedRevenue * (strategy.revenueMultiplier ?? 1)).toFixed(2)),
      risk: Math.min(0.95, Number((opportunity.risk * (strategy.riskMultiplier ?? 1)).toFixed(4)))
    };
    results.push(sandbox.step(transformed, random));
  }

  return {
    strategy: strategy.name,
    regime,
    ...evaluateStrategy(results),
    results
  };
}

export function compareStrategyMutations(strategies = [], opportunities = [], options = {}) {
  return strategies.map((strategy) => testStrategy(strategy, opportunities, options))
    .sort((a, b) => b.score - a.score);
}
