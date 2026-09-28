import test from "node:test";
import assert from "node:assert/strict";
import { RecoveryManager } from "../src/recovery.js";

test("recovery triggers after consecutive failures", () => {
  const recovery = new RecoveryManager({ maxConsecutiveErrors: 2 });
  assert.equal(recovery.failure(), false);
  assert.equal(recovery.failure(), true);
  recovery.restart();
  assert.equal(recovery.snapshot().restarts, 1);
});
