export function createSeededRandom(seed = 42) {
  let state = Math.abs(Math.trunc(seed)) % 2147483647;
  if (state === 0) state = 1;

  return () => {
    state = (state * 48271) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function simulateOutcome(opportunity, random = Math.random) {
  const successRate = Math.max(0, Math.min(1, 1 - opportunity.risk));
  const successful = random() < successRate;

  if (successful) {
    return {
      status: "SUCCESS",
      revenue: opportunity.estimatedRevenue,
      cost: opportunity.estimatedCost,
      net: Number((opportunity.estimatedRevenue - opportunity.estimatedCost).toFixed(2))
    };
  }

  return {
    status: "FAILURE",
    revenue: 0,
    cost: opportunity.estimatedCost,
    net: Number((-opportunity.estimatedCost).toFixed(2))
  };
}
