const DEFAULT_WEIGHTS = Object.freeze({
  base: 1,
  margin: 2,
  successProbability: 2,
  demand: 1.5,
  history: 1
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizedCategoryHistory(learning, category) {
  const history = learning?.categoryStats?.(category);
  if (!history?.attempts) return 0;

  const successSignal = clamp(history.successRate - 0.5, -0.5, 0.5);
  const netSignal = clamp(history.averageNet / 10, -0.5, 0.5);
  return successSignal + netSignal;
}

export function calculateProductionPriority(item, learning = null, weights = DEFAULT_WEIGHTS) {
  const opportunity = item?.opportunity ?? item;
  const baseScore = item?.choice?.score ?? 0;
  if (!opportunity) return -Infinity;

  const revenue = Math.max(0, opportunity.estimatedRevenue ?? 0);
  const cost = Math.max(0, opportunity.estimatedCost ?? 0);
  const margin = revenue > 0 ? (revenue - cost) / revenue : 0;
  const successProbability = clamp(1 - (opportunity.risk ?? 1), 0, 1);
  const demand = opportunity.demand ?? opportunity.marketContext?.demand ?? 1;
  const demandSignal = clamp(demand - 1, -1, 1);
  const historySignal = normalizedCategoryHistory(learning, opportunity.category);
  const attribution = learning?.attribution?.({ category: opportunity.category });
  const attributionSignal = attribution?.attempts >= 3
    ? clamp((attribution.successRate - 0.5) + attribution.averageNet / 10, -1, 1)
    : 0;
  const pattern = learning?.patternStats?.({
    category: opportunity.category,
    demand,
    competition: opportunity.competition ?? opportunity.marketContext?.competition ?? 1
  });
  const patternSignal = pattern?.attempts >= 3
    ? clamp((pattern.successRate - 0.5) + pattern.averageNet / 10, -1, 1)
    : 0;
  const regime = learning?.regime?.(opportunity.category);
  const regimePenalty = regime?.regime === "SHIFTED"
    ? -0.75
    : regime?.regime === "TRANSITION"
      ? -0.35
      : 0;

  return Number((
    baseScore * weights.base +
    margin * weights.margin +
    successProbability * weights.successProbability +
    demandSignal * weights.demand +
    historySignal * weights.history +
    patternSignal * weights.history +
    attributionSignal * weights.history * 0.5 +
    regimePenalty * weights.history
  ).toFixed(4));
}

export function learnPriorityWeights(
  learning,
  currentWeights = DEFAULT_WEIGHTS,
  { minAttempts = 5, learningRate = 0.1 } = {}
) {
  const categories = learning?.categories?.() ?? [];
  const experienced = categories.filter((item) => item.attempts >= minAttempts);
  if (!experienced.length) return { ...currentWeights };

  const successRates = experienced.map((item) => item.successRate);
  const averageNets = experienced.map((item) => item.averageNet);
  const meanSuccess = successRates.reduce((sum, value) => sum + value, 0) / successRates.length;
  const meanNet = averageNets.reduce((sum, value) => sum + value, 0) / averageNets.length;

  const outcomeSignal = clamp(
    (meanSuccess - 0.5) * 2 + clamp(meanNet / 10, -1, 1),
    -1,
    1
  );

  const next = {
    ...currentWeights,
    margin: clamp(currentWeights.margin * (1 + learningRate * outcomeSignal), 0.5, 4),
    successProbability: clamp(
      currentWeights.successProbability * (1 + learningRate * outcomeSignal),
      0.5,
      4
    ),
    demand: clamp(currentWeights.demand * (1 + learningRate * (meanSuccess - 0.5)), 0.5, 3),
    history: clamp(currentWeights.history * (1 + learningRate), 0.5, 3)
  };

  return Object.fromEntries(
    Object.entries(next).map(([key, value]) => [key, Number(value.toFixed(4))])
  );
}

export function prioritizeProduction(items = [], learning = null, weights = DEFAULT_WEIGHTS) {
  return items
    .map((item) => ({
      ...item,
      priorityScore: calculateProductionPriority(item, learning, weights)
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function defaultPriorityWeights() {
  return { ...DEFAULT_WEIGHTS };
}
