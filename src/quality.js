export function validateExecution({ opportunity, execution, outcome }) {
  const checks = {
    executionSucceeded: execution?.status === "SUCCESS",
    hasDeliverable: Boolean(execution?.deliverable?.content),
    categoryMatches: execution?.category === opportunity?.category,
    costMatches: Number(execution?.actualCost ?? 0) === Number(opportunity?.estimatedCost ?? 0),
    outcomeValid: outcome?.status === "SUCCESS" || outcome?.status === "FAILURE",
    outcomeCostMatches: Number(outcome?.cost ?? 0) === Number(execution?.actualCost ?? 0),
    nonNegativeCost: Number(execution?.actualCost ?? 0) >= 0
  };

  const passed = Object.values(checks).every(Boolean);

  return {
    passed,
    checks,
    qualityScore: Number(
      (Object.values(checks).filter(Boolean).length / Object.values(checks).length).toFixed(3)
    ),
    issues: Object.entries(checks)
      .filter(([, ok]) => !ok)
      .map(([name]) => name)
  };
}
