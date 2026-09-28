export class MarketEventEngine {
  constructor(seed = 99) {
    this.seed = seed;
    this.tick = 0;
    this.history = [];
  }

  #random() {
    const value = Math.sin(this.seed + this.tick * 78.233) * 43758.5453;
    return value - Math.floor(value);
  }

  next(opportunities = []) {
    this.tick += 1;
    const roll = this.#random();

    let type = "STABLE_MARKET";
    let effect = "NONE";

    if (roll < 0.18) {
      type = "DEMAND_SPIKE";
      effect = "INCREASE_DEMAND";
    } else if (roll < 0.36) {
      type = "MARKET_SATURATION";
      effect = "INCREASE_COMPETITION";
    } else if (roll < 0.48) {
      type = "OPPORTUNITY_EXPIRES";
      effect = "CLOSE_LOW_DEMAND";
    } else if (roll < 0.62) {
      type = "NEW_DEMAND";
      effect = "CREATE_OPPORTUNITY";
    }

    const event = {
      tick: this.tick,
      type,
      effect,
      timestamp: new Date().toISOString()
    };

    this.history.push(event);
    this.#apply(event, opportunities);
    return event;
  }

  #apply(event, opportunities) {
    if (event.type === "DEMAND_SPIKE") {
      for (const opportunity of opportunities) {
        opportunity.demand = Number(Math.min(1.5, (opportunity.demand ?? 1) * 1.2).toFixed(3));
      }
    }

    if (event.type === "MARKET_SATURATION") {
      for (const opportunity of opportunities) {
        opportunity.competition = Number(Math.min(1.6, (opportunity.competition ?? 1) * 1.2).toFixed(3));
        opportunity.risk = Number(Math.min(0.95, (opportunity.risk ?? 0) + 0.05).toFixed(4));
      }
    }

    if (event.type === "OPPORTUNITY_EXPIRES" && opportunities.length > 0) {
      const candidate = [...opportunities]
        .sort((a, b) => (a.demand ?? 1) - (b.demand ?? 1))[0];
      candidate.status = "CLOSED";
    }

    if (event.type === "NEW_DEMAND") {
      opportunities.push({
        name: `Demanda emergente #${this.tick}`,
        category: "EMERGING",
        estimatedRevenue: 7,
        estimatedCost: 1,
        risk: 0.18,
        effort: 2,
        status: "OPEN",
        demand: 1.15,
        competition: 0.85,
        marketTick: this.tick,
        source: "SIMULATED_MARKET_EVENT"
      });
    }
  }

  recent(limit = 5) {
    return this.history.slice(-limit);
  }

  export() {
    return {
      seed: this.seed,
      tick: this.tick,
      history: [...this.history]
    };
  }
}
