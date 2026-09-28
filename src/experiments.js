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

    const prior = this.experiments.filter(
      (item) => item.status === "COMPLETED" &&
        item.strategy === experiment.strategy &&
        item.id !== experiment.id
    );
    const priorNet = prior.length
      ? prior.reduce((sum, item) => sum + (item.outcome?.net ?? 0), 0) / prior.length
      : null;

    experiment.status = "COMPLETED";
    experiment.completedAt = new Date().toISOString();
    experiment.outcome = {
      status: outcome.status,
      net: outcome.net,
      revenue: outcome.revenue,
      cost: outcome.cost,
      baselineAverageNet: priorNet === null ? 0 : Number(priorNet.toFixed(2)),
      deltaVsBaseline: priorNet === null
        ? null
        : Number(((outcome.net ?? 0) - priorNet).toFixed(2))
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

  evaluate(id) {
    const experiment = this.experiments.find((item) => item.id === id);
    if (!experiment?.outcome) return null;

    const delta = experiment.outcome.deltaVsBaseline;
    return {
      id: experiment.id,
      strategy: experiment.strategy,
      status: experiment.status,
      net: experiment.outcome.net ?? 0,
      deltaVsBaseline: delta,
      verdict: delta === null
        ? "NO_BASELINE"
        : delta > 0 ? "POSITIVE_SIGNAL" : delta < 0 ? "NEGATIVE_SIGNAL" : "NEUTRAL_SIGNAL"
    };
  }

  export() {
    return [...this.experiments];
  }
}
