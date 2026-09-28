export class Brain {
  constructor(objectiveManager = null) {
    this.objectives = [];
    this.memory = [];
    this.objectiveManager = objectiveManager;
  }

  updateObjective(context) {
    if (!this.objectiveManager) return null;
    const objective = this.objectiveManager.update(context);
    this.setObjective(objective);
    return objective;
  }

  setObjective(objective) {
    if (!objective || typeof objective !== "string") {
      throw new Error("Objective must be a non-empty string");
    }

    this.objectives.push({
      id: this.objectives.length + 1,
      objective,
      createdAt: new Date().toISOString(),
      status: "ACTIVE"
    });
  }

  remember(event, outcome) {
    this.memory.push({
      timestamp: new Date().toISOString(),
      event,
      outcome
    });
  }

  think(state) {
    const objective = this.objectives.find((item) => item.status === "ACTIVE");

    if (!objective) {
      return {
        type: "WAIT",
        reason: "No active objective"
      };
    }

    if (state.status === "DEAD") {
      return {
        type: "STOP",
        reason: "NEVERA is DEAD"
      };
    }

    if (state.economy.balance <= 0) {
      return {
        type: "STOP",
        reason: "Balance is zero"
      };
    }

    return {
      type: "PROPOSE",
      objective: objective.objective,
      constraints: [
        "No real-money actions",
        "No external transfers",
        "No credential access",
        "No replication"
      ]
    };
  }
}
