export class TaskExecutor {
  constructor({ sandbox, guardrails }) {
    this.sandbox = sandbox;
    this.guardrails = guardrails;
    this.history = [];
  }

  async execute(task, balance = 0) {
    const estimatedCost = Number(task.cost ?? 0);
    const gate = this.guardrails.allow(balance, { estimatedCost });
    if (!gate.allowed) {
      return this.#record({ task: task.name, status: "BLOCKED", reason: gate.reason });
    }

    try {
      let result;
      if (task.type === "FETCH_PUBLIC") {
        result = await this.sandbox.fetchPublic(task.url);
      } else {
        throw new Error("TASK_TYPE_NOT_ALLOWED");
      }

      return this.#record({
        task: task.name,
        status: "COMPLETED",
        result
      });
    } catch (error) {
      return this.#record({
        task: task.name,
        status: "FAILED",
        reason: error.message
      });
    }
  }

  #record(entry) {
    const value = { ...entry, timestamp: new Date().toISOString() };
    this.history.push(value);
    return value;
  }

  snapshot() {
    return [...this.history];
  }
}
