import test from "node:test";
import assert from "node:assert/strict";
import { runStressTest } from "../src/stress-test.js";

test("stress test executa cenários adversariais", async () => {
  const result = await runStressTest({
    runs: 3,
    cycles: 10,
    initialBalance: 10,
    seed: 77
  });

  assert.equal(result.scenarios.length, 5);
  assert.ok(result.overallSurvivalRate >= 0);
  assert.ok(result.overallSurvivalRate <= 1);

  for (const scenario of result.scenarios) {
    assert.ok(scenario.worstFinalBalance >= 0);
    assert.ok(scenario.survivalRate >= 0);
    assert.ok(scenario.survivalRate <= 1);
  }
});
