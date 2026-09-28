import test from "node:test";
import assert from "node:assert/strict";
import { ObjectiveManager } from "../src/objectives.js";

test("objective manager adapts to losses", () => {
  const manager = new ObjectiveManager();
  assert.match(manager.update({ balance: 5, initialBalance: 10, failures: 3 }), /Recuperar/);
});
