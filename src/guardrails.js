export class Guardrails {
  constructor({ reserveRatio = 0.5, maxOperationCost = 1, dailyLossLimit = 2, killSwitch = false } = {}) {
    this.reserveRatio = Math.max(0, Math.min(0.95, reserveRatio));
    this.maxOperationCost = Math.max(0, maxOperationCost);
    this.dailyLossLimit = Math.max(0, dailyLossLimit);
    this.killSwitch = Boolean(killSwitch);
    this.losses = 0;
  }

  allow(balance, opportunity) {
    if (this.killSwitch) return { allowed: false, reason: "KILL_SWITCH" };
    const cost = Number(opportunity?.estimatedCost ?? 0);
    const reserve = balance * this.reserveRatio;
    if (cost > this.maxOperationCost) return { allowed: false, reason: "OPERATION_LIMIT" };
    if (cost > Math.max(0, balance - reserve)) return { allowed: false, reason: "SURVIVAL_RESERVE" };
    if (this.losses >= this.dailyLossLimit) return { allowed: false, reason: "LOSS_LIMIT" };
    return { allowed: true, reason: "ALLOWED" };
  }

  record(net) {
    if (net < 0) this.losses += Math.abs(net);
  }

  resetPeriod() {
    this.losses = 0;
  }

  emergencyStop() {
    this.killSwitch = true;
  }

  resume() {
    this.killSwitch = false;
  }

  snapshot() {
    return {
      reserveRatio: this.reserveRatio,
      maxOperationCost: this.maxOperationCost,
      dailyLossLimit: this.dailyLossLimit,
      losses: Number(this.losses.toFixed(2)),
      killSwitch: this.killSwitch
    };
  }
}
