export class Learning {
  constructor(initialResults = []) {
    this.results = initialResults;
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

  categoryStats(category = null) {
    const results = category
      ? this.results.filter((item) => item.category === category)
      : this.results;

    const attempts = results.length;
    const successes = results.filter((item) => item.status === "SUCCESS").length;
    const net = Number(
      results.reduce((sum, item) => sum + (item.net ?? 0), 0).toFixed(2)
    );

    return {
      category,
      attempts,
      successes,
      failures: attempts - successes,
      successRate: attempts ? Number((successes / attempts).toFixed(4)) : 0,
      net,
      averageNet: attempts ? Number((net / attempts).toFixed(2)) : 0
    };
  }

  categories() {
    return [...new Set(this.results.map((item) => item.category))].map((category) =>
      this.categoryStats(category)
    );
  }

  export() {
    return [...this.results];
  }
}
