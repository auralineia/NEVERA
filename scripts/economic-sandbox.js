import { EconomicSandbox, sandboxProfiles } from "../src/economic-sandbox.js";
import { defaultMarket } from "../src/market.js";

const market = defaultMarket().available();
const results = sandboxProfiles().map((regime) => {
  const sandbox = new EconomicSandbox({ regime, seed: 20260928 });
  return {
    regime,
    samples: market.map((opportunity) => sandbox.step(opportunity, () => 0.5)),
    state: sandbox.snapshot()
  };
});

console.log(JSON.stringify({
  mode: "ECONOMIC_SANDBOX",
  money: "VIRTUAL_ONLY",
  profiles: results
}, null, 2));
