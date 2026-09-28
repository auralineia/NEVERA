import test from "node:test";
import assert from "node:assert/strict";
import { AutonomousRuntime } from "../src/autonomous-runtime.js";

function telemetry() {
  const events = [];
  return {
    events,
    record(type, data) { events.push({ type, data }); }
  };
}

test("autonomous runtime records a healthy heartbeat", async () => {
  const t = telemetry();
  const runtime = new AutonomousRuntime({
    telemetry: t,
    stateReader: async () => ({ balance: 12.5, status: "ALIVE" })
  });
  const result = await runtime.heartbeat();
  assert.equal(result.ok, true);
  assert.equal(result.state.balance, 12.5);
  assert.equal(t.events.at(-1).type, "HEARTBEAT");
});

test("autonomous runtime blocks real money", async () => {
  const runtime = new AutonomousRuntime({
    stateReader: async () => ({ balance: 10, status: "ALIVE" })
  });
  const result = await runtime.heartbeat({ realMoney: true });
  assert.equal(result.ok, false);
});

test("autonomous runtime survives a state read failure", async () => {
  const t = telemetry();
  const runtime = new AutonomousRuntime({
    telemetry: t,
    stateReader: async () => { throw new Error("STATE_DOWN"); }
  });
  const result = await runtime.heartbeat();
  assert.equal(result.ok, true);
  assert.equal(t.events.at(-1).type, "HEARTBEAT");
});
