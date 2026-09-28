import test from "node:test";
import assert from "node:assert/strict";
import { operationalState } from "../src/state.js";

test("operational state consolidates runtime layers", () => {
  const state = operationalState({
    nevera: { snapshot: () => ({ status: "ALIVE" }) },
    runtime: { snapshot: () => ({ cycles: 1 }) },
    recovery: { snapshot: () => ({ restarts: 0 }) },
    telemetry: { snapshot: () => ({ counters: {} }) },
    guardrails: { snapshot: () => ({ killSwitch: false }) },
    opportunityQueue: { queued: 0 },
    survival: { alive: true }
  });
  assert.equal(state.agent.status, "ALIVE");
  assert.equal(state.runtime.cycles, 1);
});
