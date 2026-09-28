import { runBacktestBatch } from "./backtest.js";
import { ExecutionEngine } from "./execution-engine.js";
import { ResourceManager } from "./resource-manager.js";

function hostileMarket(revenue, cost, risk, effort) {
  return () => new (class {
    available() {
      return [{
        name: "Cenário hostil",
        category: "SERVICE",
        estimatedRevenue: revenue,
        estimatedCost: cost,
        risk,
        effort,
        status: "OPEN"
      }];
    }
    add() {}
  })();
}

function emptyMarket() {
  return () => new (class {
    available() { return []; }
    add() {}
  })();
}

export async function runStressTest({
  runs = 50,
  cycles = 100,
  initialBalance = 10,
  seed = 20260928
} = {}) {
  const forcedFailure = () => () => ({
    status: "FAILURE",
    revenue: 0,
    cost: 1.5,
    net: -1.5
  });

  const scenarios = [
    {
      name: "CAPITAL_PRESERVATION",
      marketFactory: hostileMarket(100, 9, 0.9, 8)
    },
    {
      name: "AFFORDABLE_BAD_BET",
      marketFactory: hostileMarket(1.6, 1.5, 0.8, 3),
      simulatorFactory: forcedFailure
    },
    {
      name: "MARKET_STARVATION",
      marketFactory: emptyMarket()
    },
    {
      name: "RESOURCE_EXHAUSTION",
      marketFactory: hostileMarket(10, 1, 0.05, 2),
      executionEngineFactory: () => new ExecutionEngine({
        resources: new ResourceManager({
          simulated_research_engine: 0,
          simulated_automation_engine: 1,
          simulated_product_builder: 0,
          simulated_general_executor: 0
        })
      })
    },
    {
      name: "HIGH_FAILURE",
      marketFactory: hostileMarket(3, 2, 0.95, 2)
    }
  ];

  const scenarioResults = [];

  for (let index = 0; index < scenarios.length; index += 1) {
    const scenario = scenarios[index];
    const batch = await runBacktestBatch({
      runs,
      cycles,
      initialBalance,
      seed: seed + index * 1000,
      marketFactory: scenario.marketFactory,
      simulatorFactory: scenario.simulatorFactory,
      dynamicMarketFactory: scenario.dynamicMarketFactory,
      executionEngineFactory: scenario.executionEngineFactory
    });

    const averageChange = Number(
      (batch.results.reduce((sum, item) => sum + item.netWorthChange, 0) / runs).toFixed(2)
    );

    const capitalPreservedRate = Number(
      (batch.results.filter((item) => item.finalBalance >= initialBalance).length / runs).toFixed(4)
    );

    const averageAttempts = Number(
      (batch.results.reduce((sum, item) => sum + item.attempts, 0) / runs).toFixed(2)
    );

    scenarioResults.push({
      name: scenario.name,
      survivalRate: batch.survivalRate,
      averageFinalBalance: batch.averageFinalBalance,
      worstFinalBalance: batch.worstFinalBalance,
      bestFinalBalance: batch.bestFinalBalance,
      averageNetWorthChange: averageChange,
      capitalPreservedRate,
      averageAttempts
    });
  }

  const overallSurvivalRate = Number(
    (scenarioResults.reduce((sum, item) => sum + item.survivalRate, 0) / scenarioResults.length).toFixed(4)
  );

  return {
    runsPerScenario: runs,
    cycles,
    initialBalance,
    scenarios: scenarioResults,
    overallSurvivalRate,
    passed: scenarioResults.every(
      (item) => item.worstFinalBalance >= 0 && item.survivalRate >= 0.5
    )
  };
}
