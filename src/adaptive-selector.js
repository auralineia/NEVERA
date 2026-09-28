import { assessRisk } from "./risk-engine.js";
import { confidenceScore } from "./confidence-score.js";

export function selectAdaptive(opportunities = [], { balance = 0, learning = null, max = 3 } = {}) {
  return opportunities
    .map((opportunity) => {
      const risk = assessRisk(opportunity, balance);
      const stats = learning?.categoryStats?.(opportunity.category) ?? {};
      const confidence = confidenceScore({
        attempts: stats.attempts ?? 0,
        successRate: stats.successRate ?? 0,
        sampleQuality: stats.attempts ? 1 : 0
      });
      const margin = Number(opportunity.estimatedRevenue ?? 0) - Number(opportunity.estimatedCost ?? 0);
      const score = margin * (1 - risk.score) * (0.5 + confidence / 2);
      return { opportunity, risk, confidence, score: Number(score.toFixed(4)) };
    })
    .filter((item) => item.risk.allowed)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}
