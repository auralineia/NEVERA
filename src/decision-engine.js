function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function signal(value, center = 0) {
  return clamp(value - center, -1, 1);
}

export function scoreDecision({
  opportunity,
  balance = 0,
  learning = null,
  strategyProfile = null,
  experimentEvidence = [],
  regime = null
}) {
  if (!opportunity || opportunity.estimatedCost > balance) return -Infinity;

  const revenue = Math.max(0, opportunity.estimatedRevenue ?? 0);
  const cost = Math.max(0, opportunity.estimatedCost ?? 0);
  const margin = revenue > 0 ? (revenue - cost) / revenue : -1;
  const successProbability = clamp(1 - (opportunity.risk ?? 1), 0, 1);
  const demand = opportunity.demand ?? opportunity.marketContext?.demand ?? 1;
  const competition = opportunity.competition ?? opportunity.marketContext?.competition ?? 1;

  const history = learning?.categoryStats?.(opportunity.category);
  const historySignal = history?.attempts
    ? clamp((history.successRate - 0.5) + (history.averageNet ?? 0) / 10, -1, 1)
    : 0;

  const pattern = learning?.patternStats?.({
    category: opportunity.category,
    demand,
    competition
  });
  const patternSignal = pattern?.attempts >= 3
    ? clamp((pattern.successRate - 0.5) + (pattern.averageNet ?? 0) / 10, -1, 1)
    : 0;

  const strategy = strategyProfile?.name;
  const attribution = strategy
    ? learning?.attribution?.({ category: opportunity.category, strategy })
    : null;
  const strategySignal = attribution?.attempts >= 3
    ? clamp((attribution.successRate - 0.5) + (attribution.averageNet ?? 0) / 10, -1, 1)
    : 0;

  const recent = experimentEvidence.slice(-5);
  const positive = recent.filter((item) =>
    item?.strategy === strategy && item?.verdict === "POSITIVE_SIGNAL"
  ).length;
  const negative = recent.filter((item) =>
    item?.strategy === strategy && item?.verdict === "NEGATIVE_SIGNAL"
  ).length;
  const experimentSignal = strategy && (positive + negative) >= 2
    ? clamp((positive - negative) / 3, -1, 1)
    : 0;

  const regimePenalty = regime?.regime === "SHIFTED"
    ? -0.5
    : regime?.regime === "TRANSITION"
      ? -0.2
      : 0;

  const capitalSafety = balance > 0
    ? clamp(1 - cost / balance, 0, 1)
    : 0;

  return Number((
    margin * 2.4 +
    successProbability * 2.2 +
    signal(demand, 1) * 1.4 -
    signal(competition, 1) * 1.0 +
    historySignal * 1.2 +
    patternSignal * 1.0 +
    strategySignal * 1.0 +
    experimentSignal * 0.8 +
    capitalSafety * 1.4 +
    regimePenalty
  ).toFixed(4));
}

export function rankDecisions(opportunities = [], context = {}) {
  return opportunities
    .map((opportunity) => ({
      opportunity,
      decisionScore: scoreDecision({ opportunity, ...context })
    }))
    .filter((item) => Number.isFinite(item.decisionScore))
    .sort((a, b) => b.decisionScore - a.decisionScore);
}

export function chooseDecisions(opportunities = [], context = {}, limit = 3) {
  return rankDecisions(opportunities, context).slice(0, Math.max(0, limit));
}
