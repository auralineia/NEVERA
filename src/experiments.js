export class ExperimentManager {
  constructor(experiments = []) {
    this.experiments = [...experiments];
  }

  start({ cycle, hypothesis, strategy }) {
    const experiment = {
      id: this.experiments.length + 1,
      cycle,
      hypothesis,
      strategy,
      status: "RUNNING",
      startedAt: new Date().toISOString(),
      outcome: null
    };

    this.experiments.push(experiment);
    return experiment;
  }

  complete(id, outcome) {
    const experiment = this.experiments.find((item) => item.id === id);
    if (!experiment) return null;

    experiment.status = "COMPLETED";
    experiment.completedAt = new Date().toISOString();
    experiment.outcome = {
      status: outcome.status,
      net: outcome.net,
      revenue: outcome.revenue,
      cost: outcome.cost
    };

    return experiment;
  }

  recent(limit = 10) {
    return this.experiments.slice(-limit);
  }

  stats() {
    const completed = this.experiments.filter(
      (item) => item.status === "COMPLETED"
    );

    const successful = completed.filter(
      (item) => item.outcome?.status === "SUCCESS"
    ).length;

    const net = completed.reduce(
      (sum, item) => sum + (item.outcome?.net ?? 0),
      0
    );

    return {
      total: this.experiments.length,
      completed: completed.length,
      successful,
      successRate: completed.length ? successful / completed.length : 0,
      net: Number(net.toFixed(2))
    };
  }

  export() {
    return [...this.experiments];
  }
}
