import test from "node:test";
import assert from "node:assert/strict";
import { ExperimentManager } from "../src/experiments.js";

test("experimentos registram hipótese e resultado", () => {
  const manager = new ExperimentManager();

  const experiment = manager.start({
    cycle: 1,
    hypothesis: "BALANCED gera resultado positivo com risco controlado",
    strategy: "BALANCED"
  });

  manager.complete(experiment.id, {
    status: "SUCCESS",
    net: 5,
    revenue: 6,
    cost: 1
  });

  const stats = manager.stats();

  assert.equal(stats.total, 1);
  assert.equal(stats.completed, 1);
  assert.equal(stats.successful, 1);
  assert.equal(stats.net, 5);
  assert.equal(manager.recent(1)[0].status, "COMPLETED");
});
