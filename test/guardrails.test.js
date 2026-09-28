import test from "node:test";
import assert from "node:assert/strict";
import { Guardrails } from "../src/guardrails.js";

test("preserva reserva de sobrevivência", () => {
  const guard = new Guardrails({ reserveRatio: 0.5, maxOperationCost: 10 });
  assert.equal(guard.allow(10, { estimatedCost: 6 }).reason, "SURVIVAL_RESERVE");
  assert.equal(guard.allow(10, { estimatedCost: 4 }).allowed, true);
});

test("kill switch bloqueia tudo", () => {
  const guard = new Guardrails({ killSwitch: true });
  assert.equal(guard.allow(100, { estimatedCost: 1 }).reason, "KILL_SWITCH");
});
