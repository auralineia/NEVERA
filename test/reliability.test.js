import test from "node:test";
import assert from "node:assert/strict";
import { ProductionQueue } from "../src/production-queue.js";
import { ResourceManager } from "../src/resource-manager.js";
import { ThroughputController } from "../src/throughput.js";

test("fila faz retry limitado e reduz prioridade", () => {
  const queue = new ProductionQueue(null, { maxRetries: 2 });
  const item = {
    opportunity: { name: "falha", category: "SERVICE", status: "OPEN" },
    choice: { score: 5 },
    priorityScore: 5
  };

  queue.enqueue([item]);
  const first = queue.next(1);
  const retry1 = queue.requeue(first);
  assert.equal(retry1[0].retryCount, 1);
  assert.equal(queue.stats().requeued, 1);

  const second = queue.next(1);
  const retry2 = queue.requeue(second);
  assert.equal(retry2[0].retryCount, 2);

  const third = queue.next(1);
  assert.equal(queue.requeue(third).length, 0);
  assert.equal(queue.stats().requeued, 2);
});

test("resource manager restaura capacidade após rollback", () => {
  const resources = new ResourceManager({ simulated_automation_engine: 1 });
  resources.beginCycle();
  assert.equal(resources.reserve(["simulated_automation_engine"]), true);
  assert.equal(resources.available("simulated_automation_engine"), false);
  resources.release(["simulated_automation_engine"]);
  assert.equal(resources.available("simulated_automation_engine"), true);
});

test("throughput identifica backlog usando a decisão efetivamente tomada", () => {
  const throughput = new ThroughputController({ min: 1, max: 6, initial: 2 });
  const decision = throughput.decide({
    outcomes: [{ status: "SUCCESS" }, { status: "SUCCESS" }],
    balance: 12,
    initialBalance: 10,
    queueSize: 3
  });

  assert.equal(decision.maxActions, 3);
  assert.equal(decision.reason, "QUEUE_BACKLOG");
});
