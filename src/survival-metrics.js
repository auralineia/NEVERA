export function survivalMetrics({ initialBalance = 0, currentBalance = 0, failures = 0, cycles = 0 } = {}) {
  const capitalRetention = initialBalance > 0
    ? Number((currentBalance / initialBalance).toFixed(4))
    : 0;

  return {
    initialBalance,
    currentBalance,
    capitalRetention,
    failures,
    cycles,
    alive: currentBalance > 0
  };
}
