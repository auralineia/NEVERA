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

  scan(learning, marketContexts = []) {
    return marketContexts.map((context) =>
      this.discover(learning, context)
    );
  }

  discover(learning, marketContext = {}) {
    this.counter += 1;

    const stats = learning.stats();
    const demand = marketContext.demand ?? 1;
    const competition = marketContext.competition ?? 1;
    const successRate = stats.attempts > 0 ? stats.successRate : 0.5;

    let category = "RESEARCH";
    let name = "Pesquisa de demanda emergente";
    let revenue = 7;
    let cost = 1;
    let risk = 0.15;
    let effort = 1;

    if (demand > 1.1 && competition < 1) {
      category = "SERVICE";
      name = "Serviço sob demanda de alta procura";
      revenue = 11;
      cost = 2;
      risk = 0.14;
      effort = 2;
    } else if (competition > 1.15) {
      category = "RESEARCH";
      name = "Inteligência comercial para mercado saturado";
      revenue = 8;
      cost = 1;
      risk = 0.12;
      effort = 1;
    } else if (successRate < 0.5) {
      category = "PRODUCT";
      name = "Microproduto de baixo custo para nova demanda";
      revenue = 9;
      cost = 1.5;
      risk = 0.2;
      effort = 2;
    }

    return {
      name: `${name} #${this.counter}`,
      category,
      estimatedRevenue: revenue,
      estimatedCost: cost,
      risk,
      effort,
      source: "NEVERA_DISCOVERY",
      marketContext: {
        demand,
        competition
      }
    };
  }
}
