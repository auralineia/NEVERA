export function simulateOutcome(opportunity) {
  const successRate = Math.max(0, Math.min(1, 1 - opportunity.risk));

  // Deterministic simulation for reproducible tests.
  const successful = successRate >= 0.5;

  if (successful) {
    return {
      status: "SUCCESS",
      revenue: opportunity.estimatedRevenue,
      cost: opportunity.estimatedCost,
      net: Number((opportunity.estimatedRevenue - opportunity.estimatedCost).toFixed(2))
    };
  }

  return {
    status: "FAILURE",
    revenue: 0,
    cost: opportunity.estimatedCost,
    net: Number((-opportunity.estimatedCost).toFixed(2))
  };
}
