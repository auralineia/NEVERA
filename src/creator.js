export class OpportunityCreator {
  constructor() {
    this.counter = 0;
  }

  createFromMemory(learning) {
    this.counter += 1;

    const stats = learning.stats();
    const hasData = stats.attempts > 0;

    if (!hasData) {
      return {
        name: `Pesquisa comercial automatizada #${this.counter}`,
        category: "RESEARCH",
        estimatedRevenue: 6,
        estimatedCost: 1,
        risk: 0.1,
        effort: 1,
        source: "NEVERA"
      };
    }

    if (stats.successRate >= 0.5) {
      return {
        name: `Serviço de automação otimizado #${this.counter}`,
        category: "SERVICE",
        estimatedRevenue: 10,
        estimatedCost: 2,
        risk: 0.12,
        effort: 2,
        source: "NEVERA"
      };
    }

    return {
      name: `Microproduto experimental #${this.counter}`,
      category: "PRODUCT",
      estimatedRevenue: 12,
      estimatedCost: 2,
      risk: 0.25,
      effort: 3,
      source: "NEVERA"
    };
  }
}
