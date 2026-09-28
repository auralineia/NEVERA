import test from "node:test";
import assert from "node:assert/strict";
import { ExecutionEngine } from "../src/execution-engine.js";

test("engine planeja uma tarefa suportada", () => {
  const engine = new ExecutionEngine();
  const plan = engine.plan({
    name: "Pesquisa comercial",
    category: "RESEARCH",
    estimatedCost: 1
  });

  assert.equal(plan.supported, true);
  assert.ok(plan.steps.length > 0);
  assert.ok(plan.requiredResources.length > 0);
});

test("engine executa e produz um entregável simulado", async () => {
  const engine = new ExecutionEngine();
  const result = await engine.execute({
    name: "Automação para cliente",
    category: "SERVICE",
    estimatedCost: 2
  });

  assert.equal(result.status, "SUCCESS");
  assert.equal(result.actualCost, 2);
  assert.equal(result.deliverable.type, "SERVICE_RESULT");
  assert.ok(result.output.includes("Automação para cliente"));
});

test("engine rejeita capacidade não suportada", async () => {
  const engine = new ExecutionEngine();
  const result = await engine.execute({
    name: "Tarefa externa",
    category: "UNSUPPORTED",
    estimatedCost: 1
  });

  assert.equal(result.status, "REJECTED");
  assert.equal(result.reason, "UNSUPPORTED_CAPABILITY");
  assert.equal(result.actualCost, 0);
});

test("engine respeita limite de etapas", () => {
  const engine = new ExecutionEngine({ maxSteps: 2 });
  const plan = engine.plan({
    name: "Serviço",
    category: "SERVICE",
    estimatedCost: 2
  });

  assert.equal(plan.steps.length, 2);
});

test("engine rejeita execução quando o recurso acabou", async () => {
  const engine = new ExecutionEngine({
    resources: {
      simulated_automation_engine: 1,
      simulated_research_engine: 0,
      simulated_product_builder: 0,
      simulated_general_executor: 0
    }
  });

  const first = await engine.execute({
    name: "Automação 1",
    category: "SERVICE",
    estimatedCost: 1
  });
  const second = await engine.execute({
    name: "Automação 2",
    category: "SERVICE",
    estimatedCost: 1
  });

  assert.equal(first.status, "SUCCESS");
  assert.equal(second.status, "REJECTED");
  assert.equal(second.reason, "RESOURCE_UNAVAILABLE");
});
