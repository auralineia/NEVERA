import { Nevera } from "./nevera.js";

const nevera = new Nevera({ initialBalance: 10 });

nevera.boot();
nevera.addTask("Encontrar uma oportunidade de receita legítima");

console.log(JSON.stringify(nevera.snapshot(), null, 2));
