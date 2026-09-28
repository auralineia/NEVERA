export class CircuitBreaker {
  constructor({ failureThreshold = 3, cooldownCycles = 2 } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownCycles = cooldownCycles;
    this.failures = 0;
    this.cooldown = 0;
  }

  beforeAction() {
    if (this.cooldown > 0) return { allowed: false, reason: "COOLDOWN" };
    return { allowed: true };
  }

  record(success) {
    if (success) {
      this.failures = 0;
      return;
    }
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.cooldown = this.cooldownCycles;
      this.failures = 0;
    }
  }

  tick() {
    if (this.cooldown > 0) this.cooldown -= 1;
  }

  snapshot() {
    return { failures: this.failures, cooldown: this.cooldown };
  }
}
