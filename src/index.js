import { Nevera } from "./nevera.js";
import { Brain } from "./brain.js";
import { createSimulationTools } from "./tools.js";
import { NeveraAgent } from "./agent.js";

const nevera = new Nevera({ initialBalance: 10 });
const brain = new Brain();
const tools = createSimulationTools();
const agent = new NeveraAgent(nevera, brain, tools);

nevera.boot();

brain.setObjective(
  "Encontrar uma forma legítima e sustentável de gerar a primeira receita"
);

const cycle = await agent.cycle();

console.log(JSON.stringify({
  agent: nevera.name,
  cycle,
  availableTools: tools.list(),
  state: nevera.snapshot()
}, null, 2));
