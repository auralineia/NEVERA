export function scoreOpportunity(opportunity, balance) {
  if (opportunity.estimatedCost > balance) {
    return Number.NEGATIVE_INFINITY;
  }

  const expectedNet =
    opportunity.estimatedRevenue - opportunity.estimatedCost;

  const riskPenalty = expectedNet * opportunity.risk;
  const effortPenalty = opportunity.effort * 0.25;

  return Number((expectedNet - riskPenalty - effortPenalty).toFixed(4));
}

export function chooseOpportunity(opportunities, balance) {
  const ranked = opportunities
    .map((opportunity) => ({
      opportunity,
      score: scoreOpportunity(opportunity, balance)
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0] ?? null;
}
