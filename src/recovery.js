export class RecoveryManager {
  constructor({ maxConsecutiveErrors = 3 } = {}) {
    this.maxConsecutiveErrors = maxConsecutiveErrors;
    this.consecutiveErrors = 0;
    this.restarts = 0;
  }

  success() {
    this.consecutiveErrors = 0;
  }

  failure() {
    this.consecutiveErrors += 1;
    return this.consecutiveErrors >= this.maxConsecutiveErrors;
  }

  restart() {
    this.restarts += 1;
    this.consecutiveErrors = 0;
    return { restarted: true, restarts: this.restarts };
  }

  snapshot() {
    return {
      consecutiveErrors: this.consecutiveErrors,
      restarts: this.restarts,
      maxConsecutiveErrors: this.maxConsecutiveErrors
    };
  }
}
