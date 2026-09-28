export function simulateEconomicOutcome(opportunity, random = Math.random) {
  const success = random() < Math.max(0, Math.min(1, 1 - (opportunity.risk ?? 0)));
  const revenue = success ? Number(opportunity.estimatedRevenue ?? 0) : 0;
  const cost = Number(opportunity.estimatedCost ?? 0);
  return {
    status: success ? "SUCCESS" : "FAILURE",
    revenue,
    cost,
    net: Number((revenue - cost).toFixed(2))
  };
}
