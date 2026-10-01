import test from "node:test";
import assert from "node:assert/strict";
import { runParallelAgents, createAgentRoster } from "../src/parallel-agents.js";

test("runs tasks concurrently while preserving input order", async () => {
  let active = 0;
  let peak = 0;
  const results = await runParallelAgents([3, 2, 1, 0], {
    concurrency: 2,
    task: async (value) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, value === 3 ? 12 : 2));
      active -= 1;
      return value * 2;
    }
  });
  assert.deepEqual(results, [6, 4, 2, 0]);
  assert.equal(peak, 2);
});

test("caps concurrency and records individual task errors", async () => {
  const results = await runParallelAgents([1, 2], {
    concurrency: 99,
    task: async (value) => { if (value === 1) throw new Error("expected"); return value; }
  });
  assert.equal(results[0].ok, false);
  assert.equal(results[1], 2);
});

test("exposes the NEVERA agent roster", () => {
  assert.ok(createAgentRoster().some((agent) => agent.id === "coordinator"));
});
