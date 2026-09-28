import test from "node:test";
import assert from "node:assert/strict";
import { TaskExecutor } from "../src/task-executor.js";

test("executor bloqueia tipo de tarefa desconhecido", async () => {
  const executor = new TaskExecutor({
    sandbox: { fetchPublic: async () => ({ ok: true }) },
    guardrails: { allow: () => ({ allowed: true }) }
  });
  const result = await executor.execute({ name: "x", type: "UNKNOWN" }, 10);
  assert.equal(result.status, "FAILED");
  assert.equal(result.reason, "TASK_TYPE_NOT_ALLOWED");
});
