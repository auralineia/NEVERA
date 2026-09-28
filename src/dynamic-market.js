import { MarketEventEngine } from "./market-events.js";

export class DynamicMarket {
  constructor(seed = 42, eventState = null) {
    this.tick = eventState?.tick ?? 0;
    this.seed = seed;
    this.events = new MarketEventEngine(eventState?.eventSeed ?? seed + 57);
    this.events.tick = eventState?.eventTick ?? 0;
    this.events.history = eventState?.history ?? [];
    this.lastEvent = null;
    this.refreshInterval = 5;
    this.demandPool = {
      SERVICE: eventState?.demandPool?.SERVICE ?? 3,
      RESEARCH: eventState?.demandPool?.RESEARCH ?? 3,
      PRODUCT: eventState?.demandPool?.PRODUCT ?? 2,
      EMERGING: eventState?.demandPool?.EMERGING ?? 2
    };
  }

  #random() {
    const value = Math.sin(this.seed + this.tick * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  #category(opportunity) {
    return opportunity.category ?? "RESEARCH";
  }

  #refreshDemand() {
    if (this.tick % this.refreshInterval !== 0) return;
    for (const category of Object.keys(this.demandPool)) {
      this.demandPool[category] += 1;
    }
  }

  #applyEventDemand(event) {
    if (event.type === "DEMAND_SPIKE") {
      for (const category of Object.keys(this.demandPool)) this.demandPool[category] += 2;
    }
    if (event.type === "MARKET_SATURATION") {
      for (const category of Object.keys(this.demandPool)) {
        this.demandPool[category] = Math.max(0, this.demandPool[category] - 1);
      }
    }
    if (event.type === "NEW_DEMAND") this.demandPool.EMERGING += 3;
  }

  evolve(opportunities) {
    this.tick += 1;
    this.#refreshDemand();
    this.lastEvent = this.events.next(opportunities);
    this.#applyEventDemand(this.lastEvent);

    const eventOpportunity =
      this.lastEvent?.type === "NEW_DEMAND"
        ? {
            name: `Demanda emergente #${this.tick}`,
            category: "EMERGING",
            estimatedRevenue: 7,
            estimatedCost: 1,
            risk: 0.18,
            effort: 2,
            status: "OPEN",
            source: "SIMULATED_MARKET_EVENT"
          }
        : null;

    const marketInput = eventOpportunity
      ? [...opportunities, eventOpportunity]
      : opportunities;

    return marketInput
      .filter((opportunity) => opportunity.status !== "CLOSED")
      .map((opportunity) => {
        const category = this.#category(opportunity);
        const availableDemand = this.demandPool[category] ?? 0;
        const demand = Number(
          Math.max(0, Math.min(1.5, 0.75 + availableDemand / 10 + this.#random() * 0.25)).toFixed(3)
        );
        const competition = Number((0.7 + this.#random() * 0.6).toFixed(3));
        const priceFactor = Number(
          Math.max(0.65, Math.min(1.35, demand / Math.max(0.5, competition))).toFixed(3)
        );

        return {
          ...opportunity,
          demand,
          competition,
          demandUnits: availableDemand,
          estimatedRevenue: Number((opportunity.estimatedRevenue * priceFactor).toFixed(2)),
          marketTick: this.tick
        };
      });
  }

  hasDemand(opportunity) {
    return (this.demandPool[this.#category(opportunity)] ?? 0) > 0;
  }

  consume(opportunity) {
    const category = this.#category(opportunity);
    if (!this.hasDemand(opportunity)) return false;
    this.demandPool[category] -= 1;
    return true;
  }

  state() {
    return {
      seed: this.seed,
      tick: this.tick,
      eventSeed: this.events.seed,
      eventTick: this.events.tick,
      demandPool: { ...this.demandPool },
      history: this.events.history
    };
  }
}