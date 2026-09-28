import { spawn } from "node:child_process";

const delay = Math.max(250, Number(process.env.NEVERA_WORKER_DELAY_MS ?? 1000));
const maxRestarts = Math.max(0, Number(process.env.NEVERA_MAX_RESTARTS ?? 10));
let restarts = 0;
let stopping = false;

function run() {
  if (stopping) return;
  const child = spawn(process.execPath, ["src/index.js"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NEVERA_CYCLES: "0"
    }
  });

  child.on("exit", (code, signal) => {
    if (stopping) return;
    if (code === 0) {
      restarts = 0;
    } else {
      restarts += 1;
      console.error(JSON.stringify({
        type: "WORKER_CRASH",
        code,
        signal,
        restarts,
        maxRestarts
      }));
    }

    if (restarts > maxRestarts) {
      console.error("NEVERA worker stopped after restart limit.");
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
