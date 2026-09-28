export function opportunityMetrics(items = []) {
  const total = items.length;
  const viable = items.filter((item) => item?.evaluation?.viable).length;
  const averageScore = total
    ? Number((items.reduce((sum, item) => sum + (item.evaluation?.viabilityScore ?? 0), 0) / total).toFixed(4))
    : 0;

  return {
    total,
    viable,
    rejected: total - viable,
    viabilityRate: total ? Number((viable / total).toFixed(4)) : 0,
    averageScore
  };
}
