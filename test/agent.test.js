import test from "node:test";
import assert from "node:assert/strict";
import { NeveraAgent } from "../src/agent.js";

test("agente executa múltiplas operações no mesmo ciclo", async () => {
  const nevera = {
    state: { status: "ALIVE", economy: { balance: 10 } },
    snapshot() { return structuredClone(this.state); },
    log() {},
    spend(amount) { this.state.economy.balance -= amount; },
    earn(amount) { this.state.economy.balance += amount; }
  };

  const brain = {
    think() { return { type: "PROPOSE" }; },
    remember() {}
  };

  const market = {
    counter: 0,
    add() {},
    available() {
      this.counter += 1;
      return [{
        name: `Operação ${this.counter}`,
        category: "SERVICE",
        estimatedRevenue: 5,
        estimatedCost: 1,
        risk: 0.05,
        effort: 1,
        status: "OPEN"
      }];
    }
  };

  const tools = {
    async execute() { return { status: "SUCCESS" }; }
  };

  const executionEngine = {
    beginCycle() { return { simulated_automation_engine: 3 }; },
    plan() {
      return {
        supported: true,
        category: "SERVICE",
        requiredResources: ["simulated_automation_engine"],
        steps: ["execute"],
        estimatedCost: 1
      };
    },
    async execute(opportunity) {
      return {
        status: "SUCCESS",
        category: opportunity.category,
        actualCost: opportunity.estimatedCost,
        deliverable: { type: "SERVICE_RESULT", content: "ok" },
        duration: 1,
        steps: ["execute"]
      };
    }
  };

  const agent = new NeveraAgent(
    nevera,
    brain,
    tools,
    (opportunities) => ({ opportunity: opportunities[0], score: 1 }),
    market,
    async () => ({ status: "SUCCESS", revenue: 5, cost: 1, net: 4 }),
    { stats: () => ({ attempts: 0 }), record() {} },
    {
      createFromMemory() {
        return {
          name: "Criada",
          category: "SERVICE",
          estimatedRevenue: 5,
          estimatedCost: 1,
          risk: 0.05,
          effort: 1,
          status: "OPEN"
        };
      },
      scan() { return []; }
    },
    () => ({ viable: true }),
    { assess() { return { allowed: true, reserve: 3, maxSpend: 2, projectedBalance: 9, reason: "WITHIN_SURVIVAL_LIMITS" }; } },
    null,
    executionEngine
  );

  const result = await agent.cycle({ name: "BALANCED", riskMultiplier: 1, revenueMultiplier: 1 }, { maxActions: 3 });

  assert.equal(result.production.requested, 3);
  assert.equal(result.production.executed, 3);
  assert.equal(result.actions.length, 3);
  assert.equal(result.actions.filter((item) => item.action?.outcome).length, 3);
});
