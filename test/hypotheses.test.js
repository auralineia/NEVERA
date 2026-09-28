import test from "node:test";
import assert from "node:assert/strict";
import { HypothesisEngine } from "../src/hypotheses.js";

test("gera hipótese de exploração quando há pouca evidência", () => {
  const engine = new HypothesisEngine();

  const hypothesis = engine.generate({
    strategy: { name: "BALANCED" },
    strategyStats: [{ strategy: "BALANCED", attempts: 1, confidence: 0.2 }],
    experimentStats: { successRate: 1 }
  });

  assert.match(hypothesis, /obter evidência suficiente/i);
});

test("reconhece necessidade de confirmação quando há evidência positiva", () => {
  const engine = new HypothesisEngine();

  const hypothesis = engine.generate({
    strategy: { name: "BALANCED" },
    strategyStats: [
      { strategy: "BALANCED", attempts: 5, successRate: 0.8, confidence: 0.75 }
    ],
    experimentStats: { successRate: 0.8 }
  });

  assert.match(hypothesis, /confirmar consistência/i);
});
