import { Economy } from "./economy.js";

export class Nevera {
  constructor({ initialBalance = 10 } = {}) {
    this.name = "NEVERA";
    this.status = "BOOTING";
    this.economy = new Economy(initialBalance);
    this.tasks = [];
    this.audit = [];
  }

  boot() {
    if (this.status !== "BOOTING") return;

    this.status = this.economy.isDead() ? "DEAD" : "ALIVE";
    this.log("BOOT", { status: this.status });
  }

  addTask(title) {
    if (this.status === "DEAD") {
      throw new Error("NEVERA is DEAD");
    }

    const task = {
      id: this.tasks.length + 1,
      title,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    this.tasks.push(task);
    this.log("TASK_CREATED", task);
    return task;
  }

  completeTask(id, result = "completed") {
    const task = this.tasks.find((item) => item.id === id);

    if (!task) throw new Error("Task not found");
    if (task.status !== "PENDING") throw new Error("Task is not pending");

    task.status = "COMPLETED";
    task.result = result;
    task.completedAt = new Date().toISOString();
    this.log("TASK_COMPLETED", task);
    return task;
  }

  spend(amount, reason) {
    this.economy.debit(amount, reason);
    this.checkLife();
  }

  earn(amount, reason) {
    this.economy.credit(amount, reason);
    this.checkLife();
  }

  checkLife() {
    if (this.economy.isDead()) {
      this.status = "DEAD";
      this.log("DEAD", { reason: "balance_reached_zero" });
    }
  }

  snapshot() {
    return {
      name: this.name,
      status: this.status,
      economy: this.economy.summary(),
      tasks: this.tasks,
      auditEntries: this.audit.length
    };
  }

  log(event, data = {}) {
    this.audit.push({
      timestamp: new Date().toISOString(),
      event,
      data
    });
  }
}
