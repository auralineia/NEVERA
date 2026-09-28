import test from "node:test";
import assert from "node:assert/strict";
import { calculateProductionPriority } from "../src/priority.js";

test("prioridade dinâmica considera margem, risco e demanda", () => {
  const high = {
    opportunity: {
      name: "high",
      category: "SERVICE",
      estimatedRevenue: 10,
      estimatedCost: 2,
      risk: 0.1,
      demand: 1.3
    },
    choice: { score: 5 }
  };

  const low = {
    opportunity: {
      name: "low",
      category: "PRODUCT",
      estimatedRevenue: 10,
      estimatedCost: 7,
      risk: 0.4,
      demand: 0.8
    },
    choice: { score: 5 }
  };

  assert.ok(calculateProductionPriority(high) > calculateProductionPriority(low));
});

test("histórico positivo da categoria aumenta prioridade", () => {
  const item = {
    opportunity: {
      name: "service",
      category: "SERVICE",
      estimatedRevenue: 10,
      estimatedCost: 2,
      risk: 0.1,
      demand: 1
    },
    choice: { score: 5 }
  };

  const learning = {
    categoryStats(category) {
      assert.equal(category, "SERVICE");
      return { attempts: 10, successRate: 0.9, averageNet: 5 };
    }
  };

  assert.ok(
    calculateProductionPriority(item, learning) >
    calculateProductionPriority(item, null)
  );
});


test("pesos de prioridade aprendem apenas com histórico suficiente", async () => {
  const { learnPriorityWeights, defaultPriorityWeights } = await import("../src/priority.js");

  const weights = defaultPriorityWeights();
  const insufficient = {
    categories() {
      return [{ category: "SERVICE", attempts: 2, successRate: 1, averageNet: 10 }];
    }
  };

  assert.deepEqual(learnPriorityWeights(insufficient, weights), weights);

  const experienced = {
    categories() {
      return [{ category: "SERVICE", attempts: 10, successRate: 0.9, averageNet: 5 }];
    }
  };

  const learned = learnPriorityWeights(experienced, weights);
  assert.notDeepEqual(learned, weights);
  assert.ok(learned.margin > weights.margin);
  assert.ok(learned.successProbability > weights.successProbability);
});
