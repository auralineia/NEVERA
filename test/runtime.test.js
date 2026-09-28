import test from "node:test";
import assert from "node:assert/strict";
import { Runtime } from "../src/runtime.js";

test("runtime tracks cycles and errors", () => {
  const runtime = new Runtime();
  runtime.cycleStarted(1);
  runtime.error(new Error("test"));
  const state = runtime.snapshot();
  assert.equal(state.cycles, 1);
  assert.equal(state.lastError.message, "test");
});
