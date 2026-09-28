export class OpportunityEngine {
  constructor({ evaluator, maxQueue = 10 } = {}) {
    this.evaluator = evaluator;
    this.maxQueue = maxQueue;
    this.queue = [];
  }

  discover(opportunities = [], balance = 0) {
    const ranked = opportunities
      .map((opportunity) => ({
        opportunity,
        evaluation: this.evaluator(opportunity, balance)
      }))
      .filter((item) => item.evaluation.viable)
      .sort((a, b) => {
        const av = a.evaluation.viabilityScore ?? 0;
        const bv = b.evaluation.viabilityScore ?? 0;
        return bv - av;
      });

    this.queue = ranked.slice(0, this.maxQueue);
    return this.queue;
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
