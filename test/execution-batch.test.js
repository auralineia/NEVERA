import test from "node:test";
import assert from "node:assert/strict";
import { ExecutionEngine } from "../src/execution-engine.js";
import { ResourceManager } from "../src/resource-manager.js";

test("execution engine processa operações independentes em paralelo", async () => {
  const engine = new ExecutionEngine({
    resources: new ResourceManager({
      simulated_research_engine: 2,
      simulated_automation_engine: 2,
      simulated_product_builder: 0,
      simulated_general_executor: 0
    })
  });

  engine.beginCycle();

  const results = await engine.executeBatch([
    {
      name: "Pesquisa A",
      category: "RESEARCH",
      estimatedRevenue: 5,
      estimatedCost: 1
    },
    {
      name: "Serviço B",
      category: "SERVICE",
      estimatedRevenue: 6,
      estimatedCost: 1
    }
  ]);

  assert.equal(results.length, 2);
  assert.equal(results.every((item) => item.status === "SUCCESS"), true);
});
