import test from "node:test";
import assert from "node:assert/strict";
import { ResourceManager } from "../src/resource-manager.js";

test("recursos são finitos", () => {
  const manager = new ResourceManager({ engine: 2 });
  assert.equal(manager.available("engine"), true);
  assert.equal(manager.reserve(["engine"]), true);
  assert.equal(manager.reserve(["engine"]), true);
  assert.equal(manager.reserve(["engine"]), false);
});

test("recursos podem ser repostos", () => {
  const manager = new ResourceManager({ engine: 1 });
  manager.reserve(["engine"]);
  manager.replenish("engine");
  assert.equal(manager.available("engine"), true);
});

test("reserva falha atomicamente quando falta recurso", () => {
  const manager = new ResourceManager({ a: 1, b: 0 });
  assert.equal(manager.reserve(["a", "b"]), false);
  assert.deepEqual(manager.snapshot(), { a: 1, b: 0 });
});
