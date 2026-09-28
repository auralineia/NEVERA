import test from "node:test";
import assert from "node:assert/strict";
import { AdaptationEngine } from "../src/adaptation.js";

test("baixa evidência aumenta exploração", () => {
  const engine = new AdaptationEngine();

  const result = engine.adapt({
    strategyStats: [
      { confidence: 0.2 },
      { confidence: 0.3 }
    ],
    experimentStats: { successRate: 0.3 },
    currentExplorationInterval: 3
  });

  assert.equal(result.explorationInterval, 2);
  assert.equal(result.reason, "INCREASE_EXPLORATION");
});

test("alto desempenho permite mais estabilidade", () => {
  const engine = new AdaptationEngine();

  const result = engine.adapt({
    strategyStats: [
      { confidence: 0.8 },
      { confidence: 0.75 }
    ],
    experimentStats: { successRate: 0.8 },
    currentExplorationInterval: 3
  });

  assert.equal(result.explorationInterval, 4);
  assert.equal(result.reason, "INCREASE_STABILITY");
});
