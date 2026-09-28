import { Nevera } from "./nevera.js";
import { Brain } from "./brain.js";
import { createSimulationTools } from "./tools.js";
import { NeveraAgent } from "./agent.js";
import { defaultMarket } from "./market.js";
import { chooseOpportunity } from "./strategy.js";
import { simulateOutcome } from "./simulator.js";
import { Learning } from "./learning.js";
import { OpportunityCreator } from "./creator.js";

const nevera = new Nevera({ initialBalance: 10 });
const brain = new Brain();
const tools = createSimulationTools();
const market = defaultMarket();
const learning = new Learning();
const creator = new OpportunityCreator();

const agent = new NeveraAgent(
  nevera,
  brain,
  tools,
  chooseOpportunity,
  market,
  simulateOutcome,
  learning,
  creator
);

nevera.boot();
brain.setObjective("Encontrar uma forma legítima e sustentável de gerar a primeira receita");

for (let cycle = 1; cycle <= 5 && !nevera.isDead(); cycle += 1) {
  const result = await agent.cycle();
  console.log(JSON.stringify({
    cycle,
    balance: nevera.snapshot().economy.balance,
    result
  }, null, 2));
}

console.log(JSON.stringify({
  agent: nevera.snapshot(),
  learning: learning.stats()
}, null, 2));
