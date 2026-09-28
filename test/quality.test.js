import test from "node:test";
import assert from "node:assert/strict";
import { validateExecution } from "../src/quality.js";

test("quality gate aceita execução válida", () => {
  const result = validateExecution({
    opportunity: { category: "SERVICE", estimatedCost: 2 },
    execution: {
      status: "SUCCESS",
      category: "SERVICE",
      actualCost: 2,
      deliverable: { content: "resultado" }
    },
    outcome: { status: "SUCCESS" }
  });
  assert.equal(result.passed, true);
  assert.equal(result.qualityScore, 1);
});

test("quality gate rejeita execução inconsistente", () => {
  const result = validateExecution({
    opportunity: { category: "SERVICE", estimatedCost: 2 },
    execution: {
      status: "SUCCESS",
      category: "RESEARCH",
      actualCost: 3,
      deliverable: { content: "" }
    },
    outcome: { status: "SUCCESS" }
  });
  assert.equal(result.passed, false);
  assert.ok(result.issues.includes("categoryMatches"));
  assert.ok(result.issues.includes("costMatches"));
  assert.ok(result.issues.includes("hasDeliverable"));
});
