import { runStressTest } from "../src/stress-test.js";

const result = await runStressTest({
  runs: 80,
  cycles: 250,
  initialBalance: 10,
  seed: 20260928
});

console.log(JSON.stringify(result, null, 2));
