import { Nevera } from "./nevera.js";
import { Brain } from "./brain.js";
import { createSimulationTools } from "./tools.js";
import { NeveraAgent } from "./agent.js";
import { defaultMarket } from "./market.js";
import { chooseOpportunity } from "./strategy.js";
import { createSeededRandom, simulateOutcome } from "./simulator.js";
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
  seed = 42,
  marketFactory = defaultMarket,
  simulatorFactory = null,
  dynamicMarketFactory = null,
  executionEngineFactory = null
} = {}) {
  const nevera = new Nevera({ initialBalance });
  const brain = new Brain();
  const tools = createSimulationTools();
  const market = marketFactory();
  const learning = new Learning();
  const creator = new OpportunityCreator();
  const survival = new SurvivalManager();
  const portfolio = new StrategyPortfolio();
  const adaptation = new AdaptationEngine();
  const dynamicMarket = dynamicMarketFactory
    ? dynamicMarketFactory(seed)
    : new DynamicMarket(seed);
  const random = createSeededRandom(seed * 7919 + 17);
  const simulator = simulatorFactory
    ? simulatorFactory(random, seed)
    : (opportunity) => simulateOutcome(opportunity, random);
  const executionEngine = executionEngineFactory
    ? executionEngineFactory(seed)
    : null;

  nevera.boot();
  brain.setObjective("Testar geração sustentável de receita em ambiente simulado");

  const agent = new NeveraAgent(
    nevera, brain, tools, chooseOpportunity, market,
    simulator, learning, creator, evaluateOpportunity,
    survival, dynamicMarket, executionEngine
  );

  let explorationInterval = 3;
  let cyclesWithOutcome = 0;
  let cyclesExecuted = 0;

  for (let cycle = 1; cycle <= cycles && nevera.snapshot().status !== "DEAD"; cycle += 1) {
    cyclesExecuted += 1;
    portfolio.explorationInterval = explorationInterval;
    const strategy = portfolio.choose(cycle);
    const result = await agent.cycle(strategy);

    if (result.action?.outcome) {
      cyclesWithOutcome += 1;
      portfolio.record(strategy, result.action.outcome);
    }

    const next = adaptation.adapt({
      strategyStats: portfolio.stats(),
      experimentStats: { successRate: learning.stats().successRate },
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
    cyclesExecuted,
    cyclesWithOutcome,
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
  seed = 42,
  marketFactory = defaultMarket,
  simulatorFactory = null,
  dynamicMarketFactory = null,
  executionEngineFactory = null
} = {}) {
  const results = [];
  for (let index = 0; index < runs; index += 1) {
    results.push(await runBacktest({
      initialBalance,
      cycles,
      seed: seed + index,
      marketFactory,
      simulatorFactory,
      dynamicMarketFactory,
      executionEngineFactory
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
