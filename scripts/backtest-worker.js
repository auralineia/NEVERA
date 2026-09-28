import { parentPort, workerData } from "node:worker_threads";
import { runBacktest } from "../src/backtest.js";

try {
  const result = await runBacktest(workerData);
  parentPort.postMessage({ ok: true, result });
} catch (error) {
  parentPort.postMessage({
    ok: false,
    error: error instanceof Error ? error.message : String(error)
  });
}
