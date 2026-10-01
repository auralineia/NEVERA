import test from "node:test";
import assert from "node:assert/strict";
import { RevenueEngine } from "../src/revenue-engine.js";

test("revenue engine remains simulation-only", () => {
  const engine = new RevenueEngine();
  const snapshot = engine.snapshot();
  assert.equal(engine.mode, "SIMULATION");
  assert.equal(snapshot.realPayments, false);
  assert.equal(snapshot.simulatedPayments, true);
  assert.equal(snapshot.providerStatus, "SIMULATION_ONLY");
});

test("created revenue intents are estimates, not confirmed payments", () => {
  const engine = new RevenueEngine();
  const offer = engine.createOffer({ channel: "DIGITAL_SERVICES", market: "BR" });
  const intent = engine.createPaymentIntent(offer);
  assert.equal(intent.status, "PENDING");
  assert.equal(intent.checkout, undefined);
  assert.equal(engine.snapshot().stats.paymentsConfirmed, 0);
});
