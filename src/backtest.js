import { Nevera } from "./nevera.js";
import { Brain } from "./brain.js";
import { createSimulationTools } from "./tools.js";
import { NeveraAgent } from "./agent.js";
import { defaultMarket } from "./market.js";
import { chooseOpportunity } from "./strategy.js";
import { simulateOutcome } from "./simulator.js";
import { Learning } from "./learning.js";
import { OpportunityCreator } from "./creator.js";
import { evaluateOpportunity } from "./evaluator.js";
import { SurvivalManager } from "./survival.js";
import { StrategyPortfolio } from "./strategies.js";
import { AdaptationEngine } from "./adaptation.js";
import { DynamicMarket } from "./dynamic-market.js";

export async function runBacktest({
  initialBalance = 10,
  cycles = 100,
  seed = 42
} = {}) {
  const nevera = new Nevera({ initialBalance });
  const brain = new Brain();
  const tools = createSimulationTools();
  const market = defaultMarket();
  const learning = new Learning();
  const creator = new OpportunityCreator();
  const survival = new SurvivalManager();
  const portfolio = new StrategyPortfolio();
  const adaptation = new AdaptationEngine();
  const dynamicMarket = new DynamicMarket(seed);

  nevera.boot();
  brain.setObjective("Testar geração sustentável de receita em ambiente simulado");

  const agent = new NeveraAgent(
    nevera, brain, tools, chooseOpportunity, market,
    simulateOutcome, learning, creator, evaluateOpportunity,
    survival, dynamicMarket
  );

  let explorationInterval = 3;
  let executed = 0;

  for (let cycle = 1; cycle <= cycles && !nevera.isDead(); cycle += 1) {
    portfolio.explorationInterval = explorationInterval;
    const strategy = portfolio.choose(cycle);
    const result = await agent.cycle(strategy);

    if (result.action?.outcome) {
      executed += 1;
      portfolio.record(strategy, result.action.outcome);
    }

    const next = adaptation.adapt({
      strategyStats: portfolio.stats(),
      experimentStats: {
        successRate: learning.stats().successRate
      },
      currentExplorationInterval: explorationInterval
    });
    explorationInterval = next.explorationInterval;
  }

  const finalBalance = nevera.snapshot().economy.balance;
  const stats = learning.stats();

  return {
    initialBalance,
    finalBalance,
    netWorthChange: Number((finalBalance - initialBalance).toFixed(2)),
    cyclesRequested: cycles,
    cyclesExecuted: executed,
    attempts: stats.attempts,
    successRate: stats.successRate,
    net: stats.net,
    alive: nevera.snapshot().status !== "DEAD",
    status: nevera.snapshot().status,
    explorationInterval,
    categories: learning.categories()
  };
}

export async function runBacktestBatch({
  runs = 20,
  cycles = 100,
  initialBalance = 10,
  seed = 42
} = {}) {
  const results = [];
  for (let index = 0; index < runs; index += 1) {
    results.push(await runBacktest({
      initialBalance,
      cycles,
      seed: seed + index
    }));
  }

  const finalBalances = results.map((item) => item.finalBalance);
  const survivors = results.filter((item) => item.alive).length;
  const averageFinalBalance = finalBalances.length
    ? Number((finalBalances.reduce((a, b) => a + b, 0) / finalBalances.length).toFixed(2))
    : initialBalance;

  return {
    runs,
    cycles,
    initialBalance,
    survivors,
    deaths: runs - survivors,
    survivalRate: runs ? Number((survivors / runs).toFixed(4)) : 0,
    averageFinalBalance,
    bestFinalBalance: Math.max(...finalBalances, initialBalance),
    worstFinalBalance: Math.min(...finalBalances, initialBalance),
    results
  };
}
