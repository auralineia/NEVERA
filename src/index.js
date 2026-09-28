import { Nevera } from "./nevera.js";
import { Brain } from "./brain.js";
import { NeveraLoop } from "./loop.js";

const nevera = new Nevera({ initialBalance: 10 });
const brain = new Brain();
const loop = new NeveraLoop(nevera, brain);

nevera.boot();

brain.setObjective(
  "Encontrar uma forma legítima e sustentável de gerar a primeira receita"
);

const decision = loop.runOnce();

console.log(JSON.stringify({
  agent: nevera.name,
  decision,
  state: nevera.snapshot()
}, null, 2));
