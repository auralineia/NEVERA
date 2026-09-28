import test from "node:test";
import assert from "node:assert/strict";
import { createSimulationTools } from "../src/tools.js";

test("registro de ferramentas funciona", () => {
  const tools = createSimulationTools();
  const names = tools.list().map((tool) => tool.name);

  assert.ok(names.includes("research_opportunity"));
  assert.ok(names.includes("create_task"));
});

test("pesquisa de oportunidade permanece em simulação", async () => {
  const tools = createSimulationTools();

  const result = await tools.execute("research_opportunity", {
    idea: "Criar uma automação para pequenos negócios"
  });

  assert.equal(result.mode, "SIMULATION");
  assert.equal(result.estimatedRevenue, 0);
  assert.equal(result.estimatedCost, 0);
});
