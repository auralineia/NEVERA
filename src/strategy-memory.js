export class StrategyMemory {
  constructor(entries = []) { this.entries = Array.isArray(entries) ? entries : []; }

  record(strategy, evaluation) {
    this.entries.push({
      strategy: strategy?.name ?? "UNKNOWN",
      evaluation,
      timestamp: new Date().toISOString()
    });
  }

  history(name = null) {
    return name ? this.entries.filter((x) => x.strategy === name) : this.entries.slice();
  }

  export() { return this.entries.slice(); }
}
