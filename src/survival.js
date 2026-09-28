export class SurvivalManager {
  constructor({ reserveRatio = 0.3, maxSpendRatio = 0.25 } = {}) {
    this.reserveRatio = reserveRatio;
    this.maxSpendRatio = maxSpendRatio;
  }

  assess(balance, opportunity) {
    const reserve = Number((balance * this.reserveRatio).toFixed(2));
    const maxSpend = Number((balance * this.maxSpendRatio).toFixed(2));
    const cost = opportunity.estimatedCost;

    const allowed =
      cost <= maxSpend &&
      balance - cost >= reserve;

    return {
      allowed,
      reserve,
      maxSpend,
      projectedBalance: Number((balance - cost).toFixed(2)),
      reason: allowed
        ? "WITHIN_SURVIVAL_LIMITS"
        : "PROTECT_CAPITAL"
    };
  }
}
