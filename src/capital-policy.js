export class CapitalPolicy {
  constructor({ minBalanceRatio = 0.5, maxInvestmentRatio = 0.2, minExpectedNet = 0.5 } = {}) {
    this.minBalanceRatio = minBalanceRatio;
    this.maxInvestmentRatio = maxInvestmentRatio;
    this.minExpectedNet = minExpectedNet;
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
