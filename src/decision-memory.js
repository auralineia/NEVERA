export class DecisionMemory {
  constructor(entries = []) {
    this.entries = Array.isArray(entries) ? entries : [];
  }

  record({ cycle, objective, strategy, opportunity, score, outcome }) {
    this.entries.push({
      cycle,
      objective,
      strategy,
      opportunity,
      score,
      outcome,
      timestamp: new Date().toISOString()
    });
  }

  recent(limit = 10) {
    return this.entries.slice(-limit);
  }

  export() {
    return this.entries.slice();
  }
}
