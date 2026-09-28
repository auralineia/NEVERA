export function betaGate({
  mode = "SIMULATION",
  balance = 0,
  killSwitch = false,
  realMoney = false,
  preflight = true,
  health = "OK"
} = {}) {
  const normalized = String(mode).toUpperCase();
  const checks = {
    preflight: Boolean(preflight),
    health: health === "OK",
    killSwitch: !killSwitch,
    balance: Number.isFinite(Number(balance)) && Number(balance) >= 0,
    realMoneyDisabled: realMoney === false,
    supportedMode: ["SIMULATION", "PAPER", "BETA"].includes(normalized)
  };

  return {
    mode: normalized,
    allowed: Object.values(checks).every(Boolean),
    checks,
    restrictions: {
      realMoney: "DISABLED",
      externalTransfers: "DISABLED",
      credentials: "DISABLED"
    }
  };
}
