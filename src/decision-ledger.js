export class DecisionLedger {
  constructor(entries = []) {
    this.entries = [...entries];
  }

  record(decision) {
    const entry = {
      id: this.entries.length + 1,
      timestamp: new Date().toISOString(),
      cycle: decision.cycle ?? null,
      decision: decision.decision ?? "UNKNOWN",
      strategy: decision.strategy ?? null,
      opportunity: decision.opportunity
        ? {
            title: decision.opportunity.title,
            category: decision.opportunity.category,
            estimatedRevenue: decision.opportunity.estimatedRevenue,
            estimatedCost: decision.opportunity.estimatedCost,
            risk: decision.opportunity.risk,
            effort: decision.opportunity.effort
          }
        : null,
      score: decision.score ?? null,
      survival: decision.survival ?? null,
      outcome: decision.outcome ?? null
    };

    this.entries.push(entry);
    return entry;
  }

  recent(limit = 10) {
    return this.entries.slice(-limit);
  }

  stats() {
    const total = this.entries.length;
    const executed = this.entries.filter((entry) => entry.outcome);

    const successes = executed.filter(
      (entry) => entry.outcome.status === "SUCCESS"
    ).length;

    const net = executed.reduce(
      (sum, entry) => sum + (entry.outcome.net ?? 0),
      0
    );

    return {
      totalDecisions: total,
      executedDecisions: executed.length,
      successfulDecisions: successes,
      successRate: executed.length ? successes / executed.length : 0,
      net: Number(net.toFixed(2))
    };
  }

  export() {
    return [...this.entries];
  }
}
