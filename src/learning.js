function bucket(value) {
  if (value < 0.85) return "LOW";
  if (value > 1.15) return "HIGH";
  return "NORMAL";
}

function patternKey({ category, demand = 1, competition = 1 } = {}) {
  return [
    category ?? "UNKNOWN",
    bucket(demand),
    bucket(competition)
  ].join(":");
}

export class Learning {
  constructor(initialResults = []) {
    this.results = initialResults;
  }

  record(opportunity, outcome) {
    this.results.push({
      opportunity: opportunity.name,
      category: opportunity.category,
      demand: opportunity.demand ?? opportunity.marketContext?.demand ?? 1,
      competition: opportunity.competition ?? opportunity.marketContext?.competition ?? 1,
      status: outcome.status,
      net: outcome.net,
      timestamp: new Date().toISOString()
    });
  }

  stats() {
    const total = this.results.length;
    const successes = this.results.filter((item) => item.status === "SUCCESS").length;
    const net = Number(
      this.results.reduce((sum, item) => sum + (item.net ?? 0), 0).toFixed(2)
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

  patternStats({ category, demand = null, competition = null } = {}) {
    const results = this.results.filter((item) => {
      if (category && item.category !== category) return false;
      if (demand !== null && bucket(item.demand ?? 1) !== bucket(demand)) return false;
      if (competition !== null && bucket(item.competition ?? 1) !== bucket(competition)) return false;
      return true;
    });

    const attempts = results.length;
    const successes = results.filter((item) => item.status === "SUCCESS").length;
    const net = Number(results.reduce((sum, item) => sum + (item.net ?? 0), 0).toFixed(2));

    return {
      key: patternKey({ category, demand: demand ?? 1, competition: competition ?? 1 }),
      category,
      demand: demand === null ? null : bucket(demand),
      competition: competition === null ? null : bucket(competition),
      attempts,
      successes,
      failures: attempts - successes,
      successRate: attempts ? Number((successes / attempts).toFixed(4)) : 0,
      averageNet: attempts ? Number((net / attempts).toFixed(2)) : 0,
      net
    };
  }

  patterns(minAttempts = 1) {
    const keys = new Set(
      this.results.map((item) =>
        patternKey({
          category: item.category,
          demand: item.demand ?? 1,
          competition: item.competition ?? 1
        })
      )
    );

    return [...keys]
      .map((key) => {
        const [category, demand, competition] = key.split(":");
        return this.patternStats({
          category,
          demand: demand === "LOW" ? 0.8 : demand === "HIGH" ? 1.2 : 1,
          competition: competition === "LOW" ? 0.8 : competition === "HIGH" ? 1.2 : 1
        });
      })
      .filter((item) => item.attempts >= minAttempts);
  }


  regime(category = null, { recentWindow = 5, historicalWindow = 20 } = {}) {
    const relevant = category
      ? this.results.filter((item) => item.category === category)
      : this.results;

    const recent = relevant.slice(-recentWindow);
    const historical = relevant.slice(
      Math.max(0, relevant.length - historicalWindow),
      Math.max(0, relevant.length - recentWindow)
    );

    const summarize = (items) => {
      const attempts = items.length;
      const successes = items.filter((item) => item.status === "SUCCESS").length;
      const net = items.reduce((sum, item) => sum + (item.net ?? 0), 0);
      return {
        attempts,
        successRate: attempts ? successes / attempts : 0,
        averageNet: attempts ? net / attempts : 0
      };
    };

    const recentStats = summarize(recent);
    const historicalStats = summarize(historical);

    if (recentStats.attempts < 3 || historicalStats.attempts < 3) {
      return {
        category,
        regime: "INSUFFICIENT_DATA",
        shift: 0,
        recent: recentStats,
        historical: historicalStats
      };
    }

    const shift = Number((
      Math.abs(recentStats.successRate - historicalStats.successRate) +
      Math.min(1, Math.abs(recentStats.averageNet - historicalStats.averageNet) / 10)
    ).toFixed(4));

    return {
      category,
      regime: shift >= 0.6 ? "SHIFTED" : shift >= 0.3 ? "TRANSITION" : "STABLE",
      shift,
      recent: recentStats,
      historical: historicalStats
    };
  }

  regimes(options = {}) {
    return this.categories().map((item) =>
      this.regime(item.category, options)
    );
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
