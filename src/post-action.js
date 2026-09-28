export function evaluateAction({ opportunity, outcome, balanceBefore, balanceAfter }) {
  const expectedNet = Number((opportunity?.estimatedRevenue ?? 0) - (opportunity?.estimatedCost ?? 0));
  const actualNet = Number(outcome?.net ?? 0);
  const variance = Number((actualNet - expectedNet).toFixed(2));
  return {
    expectedNet,
    actualNet,
    variance,
    profitable: actualNet > 0,
    survived: balanceAfter > 0,
    capitalDelta: Number((balanceAfter - balanceBefore).toFixed(2))
  };
}
