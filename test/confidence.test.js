import test from "node:test";
import assert from "node:assert/strict";
import {
  strategyConfidence,
  rankStrategies
} from "../src/confidence.js";

test("estratégia com pouca evidência não recebe confiança máxima", () => {
  const result = strategyConfidence(
    [{ strategy: "BALANCED", status: "SUCCESS", net: 8 }],
    "BALANCED"
  );

  assert.equal(result.attempts, 1);
  assert.ok(result.confidence < 0.5);
});

test("mais evidência melhora a confiança de resultados consistentes", () => {
  const history = Array.from({ length: 10 }, () => ({
    strategy: "BALANCED",
    status: "SUCCESS",
    net: 5
  }));

  const result = strategyConfidence(history, "BALANCED");
  assert.ok(result.confidence > 0.8);
});

test("ranking usa confiança, não apenas uma vitória isolada", () => {
  const results = [
    { strategy: "EXPLORATORY", status: "SUCCESS", net: 20 },
    ...Array.from({ length: 10 }, () => ({
      strategy: "BALANCED",
      status: "SUCCESS",
      net: 4
    }))
  ];

  const ranked = rankStrategies(
    results,
    ["BALANCED", "EXPLORATORY"]
  );

  assert.equal(ranked[0].strategy, "BALANCED");
});
