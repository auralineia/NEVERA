import test from "node:test";
import assert from "node:assert/strict";
import { CapitalPolicy } from "../src/capital-policy.js";

test("política investe quando retorno esperado supera o custo e preserva capital", () => {
  const result = new CapitalPolicy().decide(10, { estimatedRevenue: 8, estimatedCost: 1 });
  assert.equal(result.allowed, true);
  assert.equal(result.reason, "INVEST");
  assert.equal(result.expectedNet, 7);
});

test("política segura capital quando investimento consome demais", () => {
  const result = new CapitalPolicy().decide(10, { estimatedRevenue: 30, estimatedCost: 3 });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "HOLD_CAPITAL");
});

test("política segura capital quando retorno esperado é insuficiente", () => {
  const result = new CapitalPolicy().decide(10, { estimatedRevenue: 1.2, estimatedCost: 1 });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "HOLD_CAPITAL");
});
