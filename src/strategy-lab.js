export class StrategyLab {
  constructor(entries = []) { this.strategies = Array.isArray(entries) ? entries : []; }

  generate(base = {}) {
    const id = this.strategies.length + 1;
    const riskMultiplier = Math.max(0.65, Math.min(1.35, Number(base.riskMultiplier ?? 1) + (id % 2 ? 0.08 : -0.08)));
    const strategy = {
      name: `NEVERA-EXP-${id}`,
      riskMultiplier: Number(riskMultiplier.toFixed(3)),
      revenueMultiplier: Number((1 + (1 - riskMultiplier) * 0.5).toFixed(3)),
      riskTolerance: Number(Math.min(0.8, Math.max(0.05, base.riskTolerance ?? 0.3)).toFixed(3)),
      costLimit: Math.max(0.25, Number(base.costLimit ?? 1)),
      exploration: true,
      status: "EXPERIMENTAL",
      generation: Number(base.generation ?? 1)
    };
    this.strategies.push(strategy);
    return strategy;
  }

  mutate(strategy, evidence = {}) {
    const source = strategy ?? {};
    const successRate = Number(evidence.successRate ?? 0.5);
    const direction = successRate >= 0.6 ? -0.05 : 0.05;
    return this.generate({
      riskMultiplier: Number(source.riskMultiplier ?? 1) + direction,
      riskTolerance: Math.max(0.05, Number(source.riskTolerance ?? 0.3) + direction),
      costLimit: source.costLimit ?? 1,
      generation: Number(source.generation ?? 1) + 1
    });
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
