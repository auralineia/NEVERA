export class ActionBudget {
  constructor({ maxActions = 3, maxCost = 1 } = {}) {
    this.maxActions = maxActions;
    this.maxCost = maxCost;
  }

  allocate(balance, opportunities = []) {
    let remaining = Math.min(this.maxCost, Math.max(0, balance));
    const selected = [];
    for (const opportunity of opportunities) {
      if (selected.length >= this.maxActions) break;
      const cost = Number(opportunity.estimatedCost ?? 0);
      if (cost <= remaining) {
        selected.push(opportunity);
        remaining = Number((remaining - cost).toFixed(2));
      }
    }
    return { selected, spent: Number((Math.min(this.maxCost, Math.max(0, balance)) - remaining).toFixed(2)), remaining };
  }
}
