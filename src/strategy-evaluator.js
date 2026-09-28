export function evaluateStrategy(results = []) {
  if (!results.length) return { score: 0, verdict: "INSUFFICIENT_DATA" };
  const successes = results.filter((x) => x?.status === "SUCCESS").length;
  const net = results.reduce((sum, x) => sum + Number(x?.net ?? 0), 0);
  const successRate = successes / results.length;
  const score = Number((successRate * 0.6 + Math.max(-1, Math.min(1, net / 10)) * 0.4).toFixed(4));
  return {
    score,
    successRate,
    net: Number(net.toFixed(2)),
    verdict: score >= 0.5 ? "PROMOTE" : score <= 0.1 ? "REJECT" : "CONTINUE"
  };
}
