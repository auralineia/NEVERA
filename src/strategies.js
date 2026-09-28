export class StrategyPortfolio {
  constructor(strategies = [
    { name: "CONSERVATIVE", riskMultiplier: 0.8, revenueMultiplier: 0.9 },
    { name: "BALANCED", riskMultiplier: 1, revenueMultiplier: 1 },
    { name: "EXPLORATORY", riskMultiplier: 1.2, revenueMultiplier: 1.15 }
  ]) {
    this.strategies = strategies;
    this.results = [];
  }

  choose() {
    if (this.results.length === 0) return this.strategies[1];

    const scored = this.strategies.map((strategy) => {
      const history = this.results.filter(
        (item) => item.strategy === strategy.name
      );

      const averageNet = history.length
        ? history.reduce((sum, item) => sum + item.net, 0) / history.length
        : 0;

      return { strategy, averageNet };
    });

    scored.sort((a, b) => b.averageNet - a.averageNet);
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

      return {
        strategy: strategy.name,
        attempts: history.length,
        net: Number(net.toFixed(2))
      };
    });
  }

  export() {
    return [...this.results];
  }
}
