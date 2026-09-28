import { assessRisk } from "./risk-engine.js";

export class OpportunityEngine {
  constructor({ evaluator, maxQueue = 10, economicMemory = null, failureMemory = null, riskMemory = null } = {}) {
    this.evaluator = evaluator;
    this.maxQueue = maxQueue;
    this.economicMemory = economicMemory;
    this.failureMemory = failureMemory;
    this.riskMemory = riskMemory;
    this.queue = [];
  }

  discover(opportunities = [], balance = 0) {
    const ranked = opportunities
      .map((opportunity) => ({
        opportunity,
        evaluation: this.evaluator(opportunity, balance),
        risk: assessRisk(opportunity, balance)
      }))
      .filter((item) => item.evaluation.viable && item.risk.allowed)
      .sort((a, b) => {
        const av = this.adjustedScore(a);
        const bv = this.adjustedScore(b);
        return bv - av;
      });

    this.queue = ranked.slice(0, this.maxQueue);
    return this.queue;
  }

  adjustedScore(item) {
    const base = item.evaluation.viabilityScore ?? 0;
    const stats = this.economicMemory?.stats(item.opportunity.category);
    if (!stats?.attempts) return base;
    const failurePenalty = this.failureMemory?.penalty(item.opportunity.category) ?? 0;
    const riskStats = this.riskMemory?.stats(item.opportunity.category);
    const riskPenalty = riskStats?.attempts ? Math.min(0.25, riskStats.averageRisk / 4) : 0;
    return base + Math.max(-0.25, Math.min(0.25, stats.averageNet / 20)) - failurePenalty - riskPenalty;
  }

  next() {
    return this.queue.shift() ?? null;
  }

  snapshot() {
    return {
      queued: this.queue.length,
      opportunities: this.queue.map((item) => item.opportunity)
    };
  }
}
