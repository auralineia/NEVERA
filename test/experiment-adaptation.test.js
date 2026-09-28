import test from "node:test";
import assert from "node:assert/strict";
import { ExperimentManager } from "../src/experiments.js";

test("experimento compara resultado com baseline da mesma estratégia", () => {
  const manager = new ExperimentManager();
  const a = manager.start({ cycle: 1, hypothesis: "h1", strategy: "BALANCED" });
  manager.complete(a.id, { status: "SUCCESS", net: 4, revenue: 5, cost: 1 });

  const b = manager.start({ cycle: 2, hypothesis: "h2", strategy: "BALANCED" });
  manager.complete(b.id, { status: "SUCCESS", net: 7, revenue: 8, cost: 1 });

  const evaluation = manager.evaluate(b.id);
  assert.equal(evaluation.deltaVsBaseline, 3);
  assert.equal(evaluation.verdict, "POSITIVE_SIGNAL");
});
