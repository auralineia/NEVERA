export class RiskMemory {
  constructor(entries = []) { this.entries = Array.isArray(entries) ? entries : []; }

  record(opportunity, risk, outcome = null) {
    this.entries.push({
      opportunity: opportunity?.name ?? "UNKNOWN",
      category: opportunity?.category ?? "UNKNOWN",
      risk,
      outcome,
      timestamp: new Date().toISOString()
    });
  }

  stats(category = null) {
    const items = category ? this.entries.filter((x) => x.category === category) : this.entries;
    if (!items.length) return { attempts: 0, averageRisk: 0, failures: 0 };
    const failures = items.filter((x) => x.outcome?.status === "FAILURE").length;
    return {
      attempts: items.length,
      averageRisk: Number((items.reduce((s, x) => s + (x.risk?.score ?? 0), 0) / items.length).toFixed(4)),
      failures
    };
  }

  export() { return this.entries.slice(); }
}
