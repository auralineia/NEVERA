import test from "node:test";
import assert from "node:assert/strict";
import { CircuitBreaker } from "../src/circuit-breaker.js";

test("circuit breaker enters cooldown", () => {
  const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownCycles: 1 });
  breaker.record(false);
  breaker.record(false);
  assert.equal(breaker.beforeAction().allowed, false);
});
