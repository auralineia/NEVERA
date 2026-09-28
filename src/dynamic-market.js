import { MarketEventEngine } from "./market-events.js";

export class DynamicMarket {
  constructor(seed = 42, eventState = null) {
    this.tick = eventState?.tick ?? 0;
    this.seed = seed;
    this.events = new MarketEventEngine(eventState?.eventSeed ?? seed + 57);
    this.events.tick = eventState?.eventTick ?? 0;
    this.events.history = eventState?.history ?? [];
    this.lastEvent = null;
  }

  #random() {
    const value = Math.sin(this.seed + this.tick * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  evolve(opportunities) {
    this.tick += 1;

    this.lastEvent = this.events.next(opportunities);

    return opportunities
      .filter((opportunity) => opportunity.status !== "CLOSED")
      .map((opportunity) => {
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

  state() {
    return {
      seed: this.seed,
      tick: this.tick,
      eventSeed: this.events.seed,
      eventTick: this.events.tick,
      history: this.events.history
    };
  }
}
