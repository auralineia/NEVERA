export class DynamicMarket {
  constructor(seed = 42) {
    this.tick = 0;
    this.seed = seed;
  }

  #random() {
    const value = Math.sin(this.seed + this.tick * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  evolve(opportunities) {
    this.tick += 1;

    return opportunities.map((opportunity) => {
      const demand = Number((0.75 + this.#random() * 0.5).toFixed(3));
      const competition = Number((0.7 + this.#random() * 0.6).toFixed(3));
      const priceFactor = Number(
        Math.max(0.65, Math.min(1.35, demand / competition)).toFixed(3)
      );

      return {
        ...opportunity,
        demand,
        competition,
        estimatedRevenue: Number(
          (opportunity.estimatedRevenue * priceFactor).toFixed(2)
        ),
        marketTick: this.tick
      };
    });
  }
}
