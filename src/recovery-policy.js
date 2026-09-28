export function recoveryPolicy({ balance, initialBalance, failures = 0 } = {}) {
  const drawdown = initialBalance > 0 ? 1 - balance / initialBalance : 1;
  if (balance <= 0) return { mode: "STOP", drawdown: 1 };
  if (drawdown >= 0.5 || failures >= 3) return { mode: "PRESERVE", drawdown };
  if (drawdown >= 0.2) return { mode: "CAUTIOUS", drawdown };
  return { mode: "NORMAL", drawdown };
}
