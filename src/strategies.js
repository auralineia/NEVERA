import { strategyConfidence } from "./confidence.js";

export class StrategyPortfolio {
  constructor(
    strategies = [
      { name: "CONSERVATIVE", riskMultiplier: 0.8, revenueMultiplier: 0.9 },
      { name: "BALANCED", riskMultiplier: 1, revenueMultiplier: 1 },
      { name: "EXPLORATORY", riskMultiplier: 1.2, revenueMultiplier: 1.15 }
    ],
    explorationInterval = 3,
    initialResults = []
  ) {
    this.strategies = strategies;
    this.results = [...initialResults];
    this.explorationInterval = explorationInterval;
  }

  choose(cycle = 1) {
    if (cycle > 0 && cycle % this.explorationInterval === 0) {
      return this.strategies[
        (cycle / this.explorationInterval - 1) % this.strategies.length
      ];
    }

    if (this.results.length === 0) return this.strategies[1];

    const scored = this.strategies.map((strategy) => ({
      strategy,
      confidence: strategyConfidence(this.results, strategy.name)
    }));

    scored.sort(
      (a, b) =>
        b.confidence.confidence - a.confidence.confidence ||
        b.confidence.averageNet - a.confidence.averageNet
    );

    return scored[0].strategy;
  }

  record(strategy, outcome) {
    this.results.push({
      strategy: strategy.name,
      net: outcome.net,
      status: outcome.status,
      timestamp: new Date().toISOString()
    });
  }

  stats() {
    return this.strategies.map((strategy) => {
      const history = this.results.filter(
        (item) => item.strategy === strategy.name
      );

      const net = history.reduce((sum, item) => sum + item.net, 0);
      const confidence = strategyConfidence(this.results, strategy.name);

      return {
        strategy: strategy.name,
        attempts: history.length,
        net: Number(net.toFixed(2)),
        successRate: Number(confidence.successRate.toFixed(3)),
        confidence: confidence.confidence
      };
    });
  }

  export() {
    return [...this.results];
  }
}
