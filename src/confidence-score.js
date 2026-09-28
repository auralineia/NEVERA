export function confidenceScore({ attempts = 0, successRate = 0, sampleQuality = 0 } = {}) {
  const sample = Math.min(1, attempts / 10);
  return Number((Math.max(0, Math.min(1, successRate)) * 0.6 + sample * 0.25 + Math.max(0, Math.min(1, sampleQuality)) * 0.15).toFixed(4));
}
