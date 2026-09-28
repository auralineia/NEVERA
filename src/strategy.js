function historicalAdjustment(opportunity, learning) {
  if (!learning || learning.attempts === 0) return 0;

  const matching = learning.results.filter(
    (item) => item.opportunity === opportunity.name
  );

  if (matching.length === 0) return 0;

  const successes = matching.filter((item) => item.status === "SUCCESS").length;
  const successRate = successes / matching.length;

  return (successRate - 0.5) * 2;
}

export function scoreOpportunity(opportunity, balance, learning = null) {
  if (opportunity.estimatedCost > balance) return -Infinity;

  const expectedNet = opportunity.estimatedRevenue - opportunity.estimatedCost;
  const riskPenalty = expectedNet * opportunity.risk;
  const effortPenalty = opportunity.effort * 0.25;
  const learningBonus = historicalAdjustment(opportunity, learning);

  return expectedNet - riskPenalty - effortPenalty + learningBonus;
}

export function chooseOpportunity(opportunities, balance, learning = null) {
  return opportunities
    .map((opportunity) => ({
      opportunity,
      score: scoreOpportunity(opportunity, balance, learning)
    }))
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score)[0] ?? null;
}
