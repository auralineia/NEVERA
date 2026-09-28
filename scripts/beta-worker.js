import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { AutonomousRuntime } from "../src/autonomous-runtime.js";
import { RecoveryManager } from "../src/recovery.js";
import { Runtime } from "../src/runtime.js";
import { Telemetry } from "../src/telemetry.js";

const delay = Math.max(1000, Number(process.env.NEVERA_WORKER_DELAY_MS ?? 5000));
const maxRestarts = Math.max(0, Number(process.env.NEVERA_MAX_RESTARTS ?? 10));
const telemetry = new Telemetry();
const recovery = new RecoveryManager({ maxConsecutiveErrors: 3 });
const runtime = new Runtime();
const autonomous = new AutonomousRuntime({
  recovery,
  runtime,
  telemetry,
  stateReader: async () => JSON.parse(await readFile("./nevera-state.json", "utf8")),
  heartbeatMs: delay
});

let restarts = 0;
let stopping = false;

async function run() {
  if (stopping) return;
  try {
    const heartbeat = await autonomous.heartbeat({ mode: "BETA" });
    if (!heartbeat.ok) {
      console.error(JSON.stringify({ type: "BETA_GATE_BLOCKED", gate: heartbeat.gate }));
      process.exitCode = 1;
      return;
    }
  } catch (error) {
    recovery.failure(error);
    console.error(JSON.stringify({ type: "BETA_HEARTBEAT_ERROR", error: String(error) }));
  }

  const child = spawn(process.execPath, ["src/index.js"], {
    stdio: "inherit",
    env: { ...process.env, NEVERA_CYCLES: "0" }
  });

  child.on("exit", async (code, signal) => {
    if (stopping) return;
    if (code === 0) {
      restarts = 0;
      recovery.success();
    } else {
      restarts += 1;
      recovery.failure(new Error(`WORKER_EXIT:${code ?? signal ?? "UNKNOWN"}`));
      console.error(JSON.stringify({
        type: "WORKER_CRASH",
        code,
        signal,
        restarts,
        maxRestarts,
        recovery: recovery.snapshot()
      }));
    }

    if (restarts > maxRestarts) {
      console.error("NEVERA beta worker stopped after restart limit.");
      process.exitCode = 1;
      return;
    }

    setTimeout(run, delay);
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopping = true;
  });
}

run();
