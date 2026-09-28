export function assessRisk(opportunity, balance = 0) {
  const cost = Number(opportunity?.estimatedCost ?? 0);
  const risk = Number(opportunity?.risk ?? 1);
  const exposure = balance > 0 ? cost / balance : 1;
  const score = Math.min(1, risk * 0.7 + Math.min(1, exposure) * 0.3);
  return {
    score: Number(score.toFixed(4)),
    level: score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW",
    exposure: Number(exposure.toFixed(4)),
    allowed: balance > 0 && exposure <= 0.5 && score < 0.8
  };
}
