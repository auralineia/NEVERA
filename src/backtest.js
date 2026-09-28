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
  cycles = 1000,
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
  let currentBalance = initialBalance;
  let peakBalance = initialBalance;
  let maxDrawdownValue = 0;

  for (let cycle = 1; cycle <= cycles && nevera.snapshot().status !== "DEAD"; cycle += 1) {
    cyclesExecuted += 1;
    portfolio.explorationInterval = explorationInterval;
    const strategy = portfolio.choose(cycle);
    const result = await agent.cycle(strategy);
    currentBalance = nevera.snapshot().economy.balance;
    peakBalance = Math.max(peakBalance, currentBalance);
    const drawdown = peakBalance > 0 ? (peakBalance - currentBalance) / peakBalance : 0;
    maxDrawdownValue = Math.max(maxDrawdownValue, drawdown);

    const actualOutcomes = (result.actions ?? []).map((item) => item.action?.outcome).filter(Boolean);
    if (actualOutcomes.length) {
      cyclesWithOutcome += 1;
      for (const outcome of actualOutcomes) portfolio.record(strategy, outcome);
    }

    const next = adaptation.adapt({
      strategyStats: portfolio.stats(),
      experimentStats: { successRate: learning.stats().successRate },
      currentExplorationInterval: explorationInterval
    });
    explorationInterval = next.explorationInterval;
  }

  const finalBalance = currentBalance;
  const stats = learning.stats();
  const maxDrawdown = Number(maxDrawdownValue.toFixed(4));
  const nets = learning.results.map((item) => Number(item.net ?? 0));
  const meanNet = nets.length ? nets.reduce((a, b) => a + b, 0) / nets.length : 0;
  const variance = nets.length ? nets.reduce((sum, value) => sum + (value - meanNet) ** 2, 0) / nets.length : 0;

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
    categories: learning.categories(),
    strategies: portfolio.stats(),
    failureRate: stats.attempts ? Number((stats.failures / stats.attempts).toFixed(4)) : 0,
    maxDrawdown,
    volatility: Number(Math.sqrt(variance).toFixed(4))
  };
}

export async function runBacktestBatch({
  runs = 20,
  cycles = 1000,
  initialBalance = 10,
  seed = 42,
  marketFactory = defaultMarket,
  simulatorFactory = null,
  dynamicMarketFactory = null,
  executionEngineFactory = null,
  concurrency = 4
} = {}) {
  const results = [];
  const width = Math.max(1, Math.min(runs, Math.floor(Number(concurrency) || 1)));
  const canUseWorkers = !simulatorFactory && !dynamicMarketFactory && !executionEngineFactory && !marketFactory;

  if (canUseWorkers) {
    const { Worker } = await import("node:worker_threads");
    const runWorker = (runSeed) => new Promise((resolve, reject) => {
      const worker = new Worker(new URL("../scripts/backtest-worker.js", import.meta.url), {
        workerData: { initialBalance, cycles, seed: runSeed }
      });
      worker.once("message", (message) => {
        worker.terminate();
        if (message?.ok) resolve(message.result);
        else reject(new Error(message?.error ?? "BACKTEST_WORKER_FAILED"));
      });
      worker.once("error", (error) => {
        worker.terminate();
        reject(error);
      });
    });

    for (let start = 0; start < runs; start += width) {
      const batch = Array.from(
        { length: Math.min(width, runs - start) },
        (_, offset) => runWorker(seed + start + offset)
      );
      results.push(...await Promise.all(batch));
    }
  } else {
    for (let start = 0; start < runs; start += width) {
      const batch = Array.from(
        { length: Math.min(width, runs - start) },
        (_, offset) => runBacktest({
          initialBalance,
          cycles,
          seed: seed + start + offset,
          marketFactory,
          simulatorFactory,
          dynamicMarketFactory,
          executionEngineFactory
        })
      );
      results.push(...await Promise.all(batch));
    }
  }

  const finalBalances = results.map((item) => item.finalBalance);
  const returns = results.map((item) => item.netWorthChange);
  const meanReturn = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const returnVariance = returns.length ? returns.reduce((sum, value) => sum + (value - meanReturn) ** 2, 0) / returns.length : 0;
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
    averageNetReturn: Number(meanReturn.toFixed(2)),
    returnVolatility: Number(Math.sqrt(returnVariance).toFixed(4)),
    averageMaxDrawdown: Number((results.reduce((sum, item) => sum + item.maxDrawdown, 0) / Math.max(1, results.length)).toFixed(4)),
    averageFailureRate: Number((results.reduce((sum, item) => sum + item.failureRate, 0) / Math.max(1, results.length)).toFixed(4)),
    results
  };
}
