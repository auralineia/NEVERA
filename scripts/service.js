import { spawn } from "node:child_process";

const children = [
  ["dashboard", ["scripts/dashboard.js"]],
  ["worker", ["scripts/beta-worker.js"]]
].map(([name, args]) => {
  const child = spawn(process.execPath, args, {
    stdio: "inherit",
    env: process.env
  });
  child.on("exit", (code, signal) => {
    if (code !== 0) {
      console.error(JSON.stringify({ type: "SERVICE_CHILD_EXIT", name, code, signal }));
    }
  });
  return { name, child };
});

function shutdown(signal) {
  for (const { child } of children) child.kill(signal);
  setTimeout(() => process.exit(0), 1000).unref();
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(signal));
}

console.log("NEVERA service started: dashboard + autonomous worker");
