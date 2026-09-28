export class StrategyLab {
  constructor() { this.strategies = []; }

  generate(base = {}) {
    const id = this.strategies.length + 1;
    const strategy = {
      name: `NEVERA-EXP-${id}`,
      riskTolerance: Math.max(0.05, Math.min(0.8, (base.riskTolerance ?? 0.3) + (id % 2 ? 0.05 : -0.05))),
      costLimit: Math.max(0.25, Number(base.costLimit ?? 1)),
      exploration: true,
      status: "EXPERIMENTAL"
    };
    this.strategies.push(strategy);
    return strategy;
  }

  promote(name) {
    const item = this.strategies.find((x) => x.name === name);
    if (item) item.status = "PROMOTED";
    return item ?? null;
  }

  demote(name) {
    const item = this.strategies.find((x) => x.name === name);
    if (item) item.status = "REJECTED";
    return item ?? null;
  }

  list() { return this.strategies.slice(); }
}
