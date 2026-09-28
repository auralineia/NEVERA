export class FailureMemory {
  constructor(entries = []) {
    this.entries = Array.isArray(entries) ? entries : [];
  }

  record(opportunity, outcome, reason = null) {
    if (outcome?.status !== "FAILURE") return;
    this.entries.push({
      opportunity: opportunity.name,
      category: opportunity.category,
      net: outcome.net,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  penalty(category) {
    const items = this.entries.filter((e) => e.category === category);
    if (!items.length) return 0;
    return Math.min(0.5, items.length * 0.05);
  }

  export() {
    return this.entries.slice();
  }
}
