export class SimulatedMarket {
  constructor(opportunities = []) {
    this.opportunities = opportunities;
  }

  add(opportunity) {
    this.opportunities.push({
      id: this.opportunities.length + 1,
      ...opportunity
    });
  }

  available() {
    return this.opportunities.filter((item) => item.status !== "CLOSED");
  }
}

export function defaultMarket() {
  return new SimulatedMarket([
    {
      name: "Automação simples para pequeno negócio",
      category: "SERVICE",
      estimatedRevenue: 8,
      estimatedCost: 1,
      risk: 0.15,
      effort: 2,
      status: "OPEN"
    },
    {
      name: "Pesquisa e relatório comercial",
      category: "RESEARCH",
      estimatedRevenue: 5,
      estimatedCost: 0.5,
      risk: 0.08,
      effort: 1,
      status: "OPEN"
    },
    {
      name: "Produto digital experimental",
      category: "PRODUCT",
      estimatedRevenue: 15,
      estimatedCost: 3,
      risk: 0.45,
      effort: 5,
      status: "OPEN"
    }
  ]);
}
