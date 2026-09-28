import test from "node:test";
import assert from "node:assert/strict";
import { ResourceManager } from "../src/resource-manager.js";

test("recursos são finitos dentro de um ciclo", () => {
  const manager = new ResourceManager({ engine: 2 });
  assert.equal(manager.available("engine"), true);
  assert.equal(manager.reserve(["engine"]), true);
  assert.equal(manager.reserve(["engine"]), true);
  assert.equal(manager.reserve(["engine"]), false);
});

test("recursos podem ser repostos sem ultrapassar a capacidade", () => {
  const manager = new ResourceManager({ engine: 1 });
  manager.reserve(["engine"]);
  manager.replenish("engine", 5);
  assert.equal(manager.available("engine"), true);
  assert.deepEqual(manager.snapshot(), { engine: 1 });
});

test("novo ciclo restaura a capacidade operacional", () => {
  const manager = new ResourceManager({ engine: 2 });
  manager.reserve(["engine"]);
  manager.reserve(["engine"]);
  assert.equal(manager.available("engine"), false);

  const snapshot = manager.beginCycle();

  assert.deepEqual(snapshot, { engine: 2 });
  assert.equal(manager.available("engine"), true);
});

test("reserva falha atomicamente quando falta recurso", () => {
  const manager = new ResourceManager({ a: 1, b: 0 });
  assert.equal(manager.reserve(["a", "b"]), false);
  assert.deepEqual(manager.snapshot(), { a: 1, b: 0 });
});
