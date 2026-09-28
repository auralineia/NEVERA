import test from "node:test";
import assert from "node:assert/strict";
import { Nevera } from "../src/nevera.js";
import { Brain } from "../src/brain.js";
import { NeveraLoop } from "../src/loop.js";

test("cérebro propõe uma ação para um objetivo ativo", () => {
  const nevera = new Nevera({ initialBalance: 10 });
  const brain = new Brain();
  const loop = new NeveraLoop(nevera, brain);

  nevera.boot();
  brain.setObjective("Gerar a primeira receita");

  const decision = loop.runOnce();

  assert.equal(decision.type, "PROPOSE");
  assert.equal(decision.objective, "Gerar a primeira receita");
});

test("cérebro manda parar quando NEVERA está morta", () => {
  const nevera = new Nevera({ initialBalance: 10 });
  const brain = new Brain();
  const loop = new NeveraLoop(nevera, brain);

  nevera.boot();
  nevera.spend(10, "teste");
  brain.setObjective("Gerar receita");

  const decision = loop.runOnce();

  assert.equal(decision.type, "STOP");
});
