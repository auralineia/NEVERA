export class Learning {
  constructor() {
    this.results = [];
  }

  record(opportunity, outcome) {
    this.results.push({
      opportunity: opportunity.name,
      category: opportunity.category,
      status: outcome.status,
      net: outcome.net,
      timestamp: new Date().toISOString()
    });
  }

  stats() {
    const total = this.results.length;
    const successes = this.results.filter((item) => item.status === "SUCCESS").length;
    const net = Number(
      this.results.reduce((sum, item) => sum + item.net, 0).toFixed(2)
    );

    return {
      attempts: total,
      successes,
      failures: total - successes,
      successRate: total ? Number((successes / total).toFixed(4)) : 0,
      net
    };
  }
}
