import { RealSandbox } from "../src/real-sandbox.js";
import { Guardrails } from "../src/guardrails.js";
import { SandboxRunner } from "../src/sandbox-runner.js";

const killSwitch = process.env.NEVERA_KILL_SWITCH === "1";
const sandbox = new RealSandbox({
  allowDomains: (process.env.NEVERA_ALLOWED_DOMAINS ?? "example.com")
    .split(",").map((value) => value.trim()).filter(Boolean),
  killSwitch
});
const guardrails = new Guardrails({
  reserveRatio: Number(process.env.NEVERA_RESERVE_RATIO ?? 0.5),
  maxOperationCost: Number(process.env.NEVERA_MAX_OPERATION_COST ?? 1),
  dailyLossLimit: Number(process.env.NEVERA_DAILY_LOSS_LIMIT ?? 2),
  killSwitch
});
const runner = new SandboxRunner({ sandbox, guardrails });

const tasks = [
  {
    name: "public-connectivity-check",
    url: process.env.NEVERA_SANDBOX_URL ?? "https://example.com",
    cost: 0
  }
];

const results = await runner.run(tasks, Number(process.env.NEVERA_BALANCE ?? 10));
console.log(JSON.stringify({
  mode: "REAL_SANDBOX",
  money: "NONE",
  payments: "DISABLED",
  credentials: "NONE",
  guardrails: guardrails.snapshot(),
  results
}, null, 2));
