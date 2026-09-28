export class CapitalManager {
  constructor({ reserveRatio = 0.5, maxAllocationRatio = 0.25 } = {}) {
    this.reserveRatio = reserveRatio;
    this.maxAllocationRatio = maxAllocationRatio;
  }

  plan(balance, opportunities = []) {
    const reserve = balance * this.reserveRatio;
    let available = Math.max(0, balance - reserve);
    const selected = [];

    for (const opportunity of opportunities) {
      const cost = Number(opportunity.estimatedCost ?? 0);
      const limit = balance * this.maxAllocationRatio;
      if (cost <= available && cost <= limit) {
        selected.push(opportunity);
        available = Number((available - cost).toFixed(2));
      }
    }

    return {
      reserve: Number(reserve.toFixed(2)),
      allocated: Number((balance - reserve - available).toFixed(2)),
      selected,
      remaining: Number(available.toFixed(2))
    };
  }
}
