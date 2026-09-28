export class SandboxRunner {
  constructor({ sandbox, guardrails }) {
    this.sandbox = sandbox;
    this.guardrails = guardrails;
  }

  async run(tasks = [], balance = 0) {
    const results = [];
    for (const task of tasks) {
      const check = this.guardrails.allow(balance, {
        estimatedCost: task.cost ?? 0
      });
      if (!check.allowed) {
        results.push({ task: task.name, status: "BLOCKED", reason: check.reason });
        continue;
      }

      try {
        const result = await this.sandbox.fetchPublic(task.url);
        results.push({ task: task.name, status: "COMPLETED", result });
      } catch (error) {
        results.push({
          task: task.name,
          status: "FAILED",
          reason: error.message
        });
      }
    }
    return results;
  }
}
