export class CapitalPolicy {
  constructor({ minBalanceRatio = 0.5, maxInvestmentRatio = 0.2, minExpectedNet = 0.5 } = {}) {
    this.minBalanceRatio = minBalanceRatio;
    this.maxInvestmentRatio = maxInvestmentRatio;
    this.minExpectedNet = minExpectedNet;
  }

  reserveBatch(balance, opportunities = []) {
    const protectedCapital = Number((balance * this.minBalanceRatio).toFixed(2));
    const maxInvestment = Number((balance * this.maxInvestmentRatio).toFixed(2));
    const selected = [];
    let reserved = 0;

    for (const opportunity of opportunities) {
      const cost = Number(opportunity?.estimatedCost ?? 0);
      const revenue = Number(opportunity?.estimatedRevenue ?? 0);
      const expectedNet = Number((revenue - cost).toFixed(2));
      if (cost <= 0 || expectedNet < this.minExpectedNet) continue;
      if (reserved + cost > maxInvestment) continue;
      if (balance - reserved - cost < protectedCapital) continue;
      selected.push(opportunity);
      reserved = Number((reserved + cost).toFixed(2));
    }

    return {
      allowed: selected.length > 0,
      selected,
      reserved,
      availableAfterReserve: Number((balance - reserved).toFixed(2)),
      protectedCapital,
      maxInvestment,
      reason: selected.length ? "BATCH_RESERVED" : "HOLD_CAPITAL"
    };
  }

  decide(balance, opportunity) {
    const cost = Number(opportunity?.estimatedCost ?? 0);
    const revenue = Number(opportunity?.estimatedRevenue ?? 0);
    const expectedNet = Number((revenue - cost).toFixed(2));
    const maxInvestment = Number((balance * this.maxInvestmentRatio).toFixed(2));
    const protectedCapital = Number((balance * this.minBalanceRatio).toFixed(2));

    const allowed =
      cost > 0 &&
      cost <= maxInvestment &&
      balance - cost >= protectedCapital &&
      expectedNet >= this.minExpectedNet;

    return {
      allowed,
      cost,
      expectedNet,
      maxInvestment,
      protectedCapital,
      projectedBalance: Number((balance - cost).toFixed(2)),
      reason: allowed ? "INVEST" : "HOLD_CAPITAL"
    };
  }
}
