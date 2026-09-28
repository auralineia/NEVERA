import test from "node:test";
import assert from "node:assert/strict";
import { Telemetry } from "../src/telemetry.js";

test("telemetria conta eventos", () => {
  const telemetry = new Telemetry();
  telemetry.record("SCAN");
  telemetry.record("SCAN");
  telemetry.record("TASK");
  assert.equal(telemetry.counters().SCAN, 2);
  assert.equal(telemetry.counters().TASK, 1);
});
