export function health({ nevera, guardrails, sandbox, telemetry }) {
  const snapshot = nevera.snapshot();
  return {
    status: snapshot.status === "DEAD" ? "DOWN" : "OK",
    agent: snapshot.status,
    balance: snapshot.economy.balance,
    killSwitch: guardrails?.killSwitch ?? false,
    sandboxActions: sandbox?.snapshot?.().actions?.length ?? 0,
    telemetryEvents: telemetry?.snapshot?.().events?.length ?? 0,
    timestamp: new Date().toISOString()
  };
}
