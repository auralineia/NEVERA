export class DecisionFilter {
  constructor(limit = 10) {
    this.limit = limit;
    this.rejections = [];
  }

  reject(opportunity, reason) {
    this.rejections.push({
      opportunity: opportunity?.name ?? "UNKNOWN",
      reason,
      timestamp: new Date().toISOString()
    });
    if (this.rejections.length > this.limit) this.rejections.shift();
  }

  repeatedFailure(opportunity, failureMemory) {
    const category = opportunity?.category;
    const penalty = failureMemory?.penalty?.(category) ?? 0;
    return penalty >= 0.2;
  }

  recent() { return this.rejections.slice(); }
}
