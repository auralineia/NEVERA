export class EconomicMemory {
  constructor(entries = []) {
    this.entries = Array.isArray(entries) ? entries : [];
  }

  record(opportunity, outcome) {
    this.entries.push({
      opportunity: opportunity.name,
      category: opportunity.category,
      status: outcome.status,
      revenue: outcome.revenue,
      cost: outcome.cost,
      net: outcome.net,
      timestamp: new Date().toISOString()
    });
  }

  stats(category = null) {
    const items = category ? this.entries.filter((e) => e.category === category) : this.entries;
    if (!items.length) return { attempts: 0, successRate: 0, averageNet: 0, totalNet: 0 };
    const successes = items.filter((e) => e.status === "SUCCESS").length;
    return {
      attempts: items.length,
      successRate: Number((successes / items.length).toFixed(4)),
      averageNet: Number((items.reduce((s, e) => s + e.net, 0) / items.length).toFixed(2)),
      totalNet: Number(items.reduce((s, e) => s + e.net, 0).toFixed(2))
    };
  }

  export() {
    return this.entries.slice();
  }
}
