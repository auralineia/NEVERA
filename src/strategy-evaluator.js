export function evaluateStrategy(results = []) {
  if (!results.length) return { score: 0, successRate: 0, net: 0, volatility: 0, verdict: "INSUFFICIENT_DATA" };
  const nets = results.map((x) => Number(x?.net ?? 0));
  const successes = results.filter((x) => x?.status === "SUCCESS").length;
  const net = nets.reduce((sum, value) => sum + value, 0);
  const successRate = successes / results.length;
  const mean = net / results.length;
  const variance = nets.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / results.length;
  const volatility = Number(Math.sqrt(variance).toFixed(4));
  const score = Number((successRate * 0.6 + Math.max(-1, Math.min(1, mean / 10)) * 0.4).toFixed(4));
  return {
    score,
    successRate: Number(successRate.toFixed(4)),
    net: Number(net.toFixed(2)),
    volatility,
    verdict: results.length < 3 ? "INSUFFICIENT_DATA" : score >= 0.5 ? "PROMOTE" : score <= 0.1 ? "REJECT" : "CONTINUE"
  };
}
