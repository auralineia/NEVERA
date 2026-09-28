export function adaptPolicy({ successRate = 0, failures = 0, averageNet = 0 } = {}) {
  if (failures >= 3 || successRate < 0.3) {
    return { mode: "DEFENSIVE", maxRisk: 0.2, reason: "HIGH_FAILURE_RATE" };
  }
  if (successRate >= 0.7 && averageNet > 0) {
    return { mode: "GROWTH", maxRisk: 0.6, reason: "POSITIVE_EVIDENCE" };
  }
  return { mode: "BALANCED", maxRisk: 0.4, reason: "INSUFFICIENT_SIGNAL" };
}
