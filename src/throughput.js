export class ThroughputController {
  constructor({ min = 1, max = 6, initial = 3 } = {}) {
    this.min = min;
    this.max = max;
    this.current = Math.min(max, Math.max(min, initial));
  }

  decide({ outcomes = [], balance = 0, initialBalance = 10, queueSize = 0 } = {}) {
    const successful = outcomes.filter((item) => item?.status === "SUCCESS").length;
    const attempted = outcomes.length;
    const successRate = attempted ? successful / attempted : 0;
    const net = outcomes.reduce((sum, item) => sum + (item?.net ?? 0), 0);
    const backlog = queueSize > this.current;

    if (backlog && successRate >= 0.6) {
      this.current = Math.min(this.max, this.current + 1);
    } else if (attempted >= 2 && successRate >= 0.8 && net > 0 && balance > initialBalance) {
      this.current = Math.min(this.max, this.current + 1);
    } else if (attempted >= 2 && (successRate < 0.5 || net < 0)) {
      this.current = Math.max(this.min, this.current - 1);
    }

    return {
      maxActions: this.current,
      successRate: Number(successRate.toFixed(4)),
      net: Number(net.toFixed(2)),
      reason:
        backlog && successRate >= 0.6 ? "QUEUE_BACKLOG" :
        attempted < 2 ? "INSUFFICIENT_EVIDENCE" :
        successRate >= 0.8 && net > 0 && balance > initialBalance ? "INCREASE_THROUGHPUT" :
        successRate < 0.5 || net < 0 ? "DECREASE_THROUGHPUT" :
        "MAINTAIN_THROUGHPUT"
    };
  }

  snapshot() {
    return { min: this.min, max: this.max, current: this.current };
  }
}
