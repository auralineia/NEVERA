import { Persistence } from "../src/persistence.js";
import { Nevera } from "../src/nevera.js";
import { Guardrails } from "../src/guardrails.js";
import { health } from "../src/health.js";

const persistence = new Persistence();
const saved = await persistence.load();
const nevera = new Nevera({ initialBalance: saved?.balance ?? saved?.initialBalance ?? 10 });
nevera.boot();
const guardrails = new Guardrails({
  killSwitch: process.env.NEVERA_KILL_SWITCH === "1"
});
console.log(JSON.stringify(health({ nevera, guardrails }), null, 2));
