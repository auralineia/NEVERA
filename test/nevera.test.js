import test from "node:test";
import assert from "node:assert/strict";
import { Nevera } from "../src/nevera.js";

test("NEVERA inicia viva com R$10 virtuais", () => {
  const nevera = new Nevera({ initialBalance: 10 });
  nevera.boot();

  assert.equal(nevera.status, "ALIVE");
  assert.equal(nevera.economy.balance, 10);
});

test("NEVERA registra receita", () => {
  const nevera = new Nevera({ initialBalance: 10 });
  nevera.boot();
  nevera.earn(5, "teste");

  assert.equal(nevera.economy.balance, 15);
  assert.equal(nevera.economy.revenue, 5);
});

test("NEVERA morre quando o saldo chega a zero", () => {
  const nevera = new Nevera({ initialBalance: 10 });
  nevera.boot();
  nevera.spend(10, "teste");

  assert.equal(nevera.status, "DEAD");
  assert.equal(nevera.economy.balance, 0);
});

test("não permite gastar mais que o saldo", () => {
  const nevera = new Nevera({ initialBalance: 10 });
  nevera.boot();

  assert.throws(() => nevera.spend(10.01, "teste"), /Insufficient balance/);
});
