import test from "node:test";
import assert from "node:assert/strict";
import { ProductionQueue } from "../src/production-queue.js";

test("fila prioriza maior score", () => {
  const queue = new ProductionQueue();
  queue.enqueue([
    { opportunity: { name: "baixo", category: "SERVICE" }, choice: { score: 2 } },
    { opportunity: { name: "alto", category: "RESEARCH" }, choice: { score: 9 } },
    { opportunity: { name: "medio", category: "PRODUCT" }, choice: { score: 5 } }
  ]);

  assert.deepEqual(queue.next(2).map((item) => item.opportunity.name), ["alto", "medio"]);
  assert.equal(queue.size(), 1);
});

test("fila permite devolver itens não executados", () => {
  const queue = new ProductionQueue();
  const item = { opportunity: { name: "requeue" }, choice: { score: 4 } };
  queue.enqueue([item]);
  queue.next(1);
  queue.requeue([item]);
  assert.equal(queue.size(), 1);
});
