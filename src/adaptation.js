export class AdaptationEngine {
  adapt({ strategyStats = [], experimentStats = {}, currentExplorationInterval = 3 }) {
    const averageConfidence = strategyStats.length
      ? strategyStats.reduce((sum, item) => sum + item.confidence, 0) / strategyStats.length
      : 0;

    const successRate = experimentStats.successRate ?? 0;

    let explorationInterval = currentExplorationInterval;

    if (successRate < 0.4 || averageConfidence < 0.4) {
      explorationInterval = Math.max(2, currentExplorationInterval - 1);
    } else if (successRate >= 0.75 && averageConfidence >= 0.7) {
      explorationInterval = Math.min(5, currentExplorationInterval + 1);
    }

    return {
      explorationInterval,
      reason:
        explorationInterval < currentExplorationInterval
          ? "INCREASE_EXPLORATION"
          : explorationInterval > currentExplorationInterval
            ? "INCREASE_STABILITY"
            : "MAINTAIN"
    };
  }
}
