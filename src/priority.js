function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function calculateProductionPriority(item, learning = null) {
  const opportunity = item?.opportunity ?? item;
  const baseScore = item?.choice?.score ?? 0;
  if (!opportunity) return -Infinity;

  const revenue = Math.max(0, opportunity.estimatedRevenue ?? 0);
  const cost = Math.max(0, opportunity.estimatedCost ?? 0);
  const net = revenue - cost;
  const margin = revenue > 0 ? net / revenue : 0;
  const successProbability = clamp(1 - (opportunity.risk ?? 1), 0, 1);
  const demand = opportunity.demand ?? opportunity.marketContext?.demand ?? 1;
  const demandSignal = clamp(demand - 1, -1, 1);

  const history = learning?.categoryStats?.(opportunity.category);
  const historySignal = history?.attempts
    ? clamp(history.successRate - 0.5, -0.5, 0.5) +
      clamp(history.averageNet / 10, -0.5, 0.5)
    : 0;

  return Number((
    baseScore +
    margin * 2 +
    successProbability * 2 +
    demandSignal * 1.5 +
    historySignal
  ).toFixed(4));
}

export function prioritizeProduction(items = [], learning = null) {
  return items
    .map((item) => ({
      ...item,
      priorityScore: calculateProductionPriority(item, learning)
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
