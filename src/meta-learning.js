export function metaLearn({ strategies = {}, experiments = [], failures = 0 } = {}) {
  const entries = Object.entries(strategies);
  const ranked = entries
    .map(([name, stats]) => ({
      name,
      successRate: stats?.successRate ?? 0,
      averageNet: stats?.averageNet ?? 0,
      attempts: stats?.attempts ?? 0
    }))
    .sort((a, b) => (b.successRate + b.averageNet / 10) - (a.successRate + a.averageNet / 10));
  return {
    preferred: ranked[0]?.name ?? null,
    confidence: Math.min(1, (ranked[0]?.attempts ?? 0) / 10),
    exploration: failures >= 3 || experiments.length < 3
  };
}
