import { readFile } from "node:fs/promises";
import process from "node:process";

const REQUIRED_FILES = [
  "package.json",
  "src/index.js",
  "src/economy.js",
  "src/nevera.js",
  "src/guardrails.js",
  "src/persistence.js",
  "src/real-sandbox.js"
];

const REQUIRED_SCRIPTS = ["test", "start", "sandbox", "health", "paper-economy", "stress-test"];

function fail(message) {
  console.error(JSON.stringify({ ok: false, error: message }));
  process.exitCode = 1;
}

const major = Number(process.versions.node.split(".")[0]);
if (major < 20) fail("NODE_20_REQUIRED");

const packageJson = JSON.parse(await readFile("./package.json", "utf8"));
for (const script of REQUIRED_SCRIPTS) {
  if (!packageJson.scripts?.[script]) fail(`MISSING_SCRIPT:${script}`);
}

for (const file of REQUIRED_FILES) {
  try {
    await readFile(file, "utf8");
  } catch {
    fail(`MISSING_FILE:${file}`);
  }
}

const forbidden = [
  "PRIVATE_KEY",
  "SEED_PHRASE",
  "API_KEY",
  "ACCESS_TOKEN",
  "WALLET_PRIVATE_KEY"
];
const configured = forbidden.filter((key) => process.env[key]);
if (configured.length) fail(`SENSITIVE_ENV_PRESENT:${configured.join(",")}`);

const killSwitch = String(process.env.NEVERA_KILL_SWITCH ?? "false").toLowerCase();
const realMoney = String(process.env.NEVERA_REAL_MONEY ?? "false").toLowerCase();
if (realMoney === "true") fail("REAL_MONEY_DISABLED_IN_PREFLIGHT");
if (killSwitch === "true") fail("KILL_SWITCH_ACTIVE");

console.log(JSON.stringify({
  ok: process.exitCode !== 1,
  mode: "SIMULATION/PAPER",
  node: process.version,
  realMoney: false,
  credentials: "not-configured",
  requiredFiles: REQUIRED_FILES.length
}, null, 2));
