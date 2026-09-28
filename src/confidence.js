export function strategyConfidence(results, strategyName) {
  const history = results.filter((item) => item.strategy === strategyName);
  const attempts = history.length;

  if (attempts === 0) {
    return {
      strategy: strategyName,
      attempts: 0,
      successRate: 0,
      averageNet: 0,
      confidence: 0
    };
  }

  const successes = history.filter((item) => item.status === "SUCCESS").length;
  const successRate = successes / attempts;
  const averageNet =
    history.reduce((sum, item) => sum + (item.net ?? 0), 0) / attempts;

  // A confiança cresce com evidência, mas nunca chega a 100% por poucas amostras.
  const sampleConfidence = Math.min(1, attempts / 10);
  const successConfidence = successRate;
  const netConfidence = Math.max(0, Math.min(1, (averageNet + 2) / 12));

  const confidence =
    sampleConfidence * 0.55 +
    successConfidence * 0.25 +
    netConfidence * 0.20;

  return {
    strategy: strategyName,
    attempts,
    successRate,
    averageNet: Number(averageNet.toFixed(2)),
    confidence: Number(confidence.toFixed(3))
  };
}

export function rankStrategies(results, strategyNames) {
  return strategyNames
    .map((name) => strategyConfidence(results, name))
    .sort((a, b) => b.confidence - a.confidence);
}
