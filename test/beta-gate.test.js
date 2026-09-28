import test from "node:test";
import assert from "node:assert/strict";
import { betaGate } from "../src/beta-gate.js";

test("beta gate allows safe simulation mode", () => {
  const result = betaGate({ mode: "BETA", balance: 10 });
  assert.equal(result.allowed, true);
  assert.equal(result.restrictions.realMoney, "DISABLED");
});

test("beta gate blocks kill switch", () => {
  const result = betaGate({ mode: "BETA", balance: 10, killSwitch: true });
  assert.equal(result.allowed, false);
});

test("beta gate blocks real money", () => {
  const result = betaGate({ mode: "BETA", balance: 10, realMoney: true });
  assert.equal(result.allowed, false);
});
