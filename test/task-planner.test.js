import test from "node:test";
import assert from "node:assert/strict";
import { planPublicTasks, taskToExecution } from "../src/task-planner.js";

test("planner creates zero-cost public analysis tasks", () => {
  const tasks = planPublicTasks([{ name: "signal", source: "public", signal: "DATA" }]);
  assert.equal(tasks[0].cost, 0);
  assert.equal(tasks[0].type, "ANALYZE_PUBLIC_SIGNAL");
});

test("planner rejects unknown execution types", () => {
  assert.throws(() => taskToExecution({ type: "PAYMENT" }), /TASK_TYPE_NOT_ALLOWED/);
});
