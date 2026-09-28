export function evaluateOpportunity(opportunity, balance) {
  const affordable = opportunity.estimatedCost <= balance;
  const grossMargin = opportunity.estimatedRevenue > 0
    ? (opportunity.estimatedRevenue - opportunity.estimatedCost) / opportunity.estimatedRevenue
    : 0;

  const riskScore = 1 - opportunity.risk;
  const effortScore = 1 / Math.max(1, opportunity.effort);
  const viabilityScore = Number(
    (grossMargin * 0.45 + riskScore * 0.35 + effortScore * 0.20).toFixed(4)
  );

  const viable = affordable && grossMargin > 0 && viabilityScore >= 0.5;

  return {
    viable,
    affordable,
    grossMargin: Number(grossMargin.toFixed(4)),
    riskScore: Number(riskScore.toFixed(4)),
    effortScore: Number(effortScore.toFixed(4)),
    viabilityScore
  };
}
