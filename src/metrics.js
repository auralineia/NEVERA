export function calculateMetrics({ initialBalance, currentBalance, learning, strategies }) {
  const stats = learning.stats();
  const attempts = stats.attempts;

  const totalRevenue = learning.results.reduce(
    (sum, item) => sum + Math.max(0, item.net),
    0
  );

  const totalLoss = learning.results.reduce(
    (sum, item) => sum + Math.max(0, -item.net),
    0
  );

  const averageNet = attempts
    ? Number((stats.net / attempts).toFixed(2))
    : 0;

  return {
    initialBalance,
    currentBalance,
    netWorthChange: Number((currentBalance - initialBalance).toFixed(2)),
    attempts,
    successRate: stats.successRate,
    averageNet,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalLoss: Number(totalLoss.toFixed(2)),
    strategies
  };
}
