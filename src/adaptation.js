export class AdaptationEngine {
  adapt({ strategyStats = [], experimentStats = {}, experimentEvidence = [], currentExplorationInterval = 3 }) {
    const averageConfidence = strategyStats.length
      ? strategyStats.reduce((sum, item) => sum + item.confidence, 0) / strategyStats.length
      : 0;

    const successRate = experimentStats.successRate ?? 0;
    const completedEvidence = experimentEvidence.filter((item) => item?.status === "COMPLETED");
    const positiveSignals = completedEvidence.filter((item) => item?.verdict === "POSITIVE_SIGNAL").length;
    const negativeSignals = completedEvidence.filter((item) => item?.verdict === "NEGATIVE_SIGNAL").length;
    const signalBalance = positiveSignals - negativeSignals;

    let explorationInterval = currentExplorationInterval;

    if (completedEvidence.length >= 3 && (signalBalance <= -2 || successRate < 0.4 || averageConfidence < 0.4)) {
      explorationInterval = Math.max(2, currentExplorationInterval - 1);
    } else if (completedEvidence.length >= 3 && signalBalance >= 2 && successRate >= 0.75 && averageConfidence >= 0.7) {
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
