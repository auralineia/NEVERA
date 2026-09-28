export class CycleController {
  constructor({ minActions = 1, maxActions = 3 } = {}) {
    this.minActions = minActions;
    this.maxActions = maxActions;
    this.lastDecision = null;
  }

  decide({ balance = 0, drawdown = 0, failures = 0, confidence = 0 } = {}) {
    if (balance <= 0) {
      this.lastDecision = { actions: 0, mode: "STOP" };
    } else if (drawdown >= 0.5 || failures >= 3) {
      this.lastDecision = { actions: this.minActions, mode: "DEFENSIVE" };
    } else if (confidence >= 0.75 && drawdown < 0.2) {
      this.lastDecision = { actions: this.maxActions, mode: "EXPANSION" };
    } else {
      this.lastDecision = { actions: this.minActions, mode: "BALANCED" };
    }
    return this.lastDecision;
  }

  snapshot() { return this.lastDecision; }
}
