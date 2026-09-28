import test from "node:test";
import assert from "node:assert/strict";
import { ThroughputController } from "../src/throughput.js";

test("throughput aumenta após produção consistente e lucrativa", () => {
  const controller = new ThroughputController({ initial: 3, max: 6 });
  const result = controller.decide({
    outcomes: [
      { status: "SUCCESS", net: 4 },
      { status: "SUCCESS", net: 3 },
      { status: "SUCCESS", net: 2 }
    ],
    balance: 19,
    initialBalance: 10
  });
  assert.equal(result.reason, "INCREASE_THROUGHPUT");
  assert.equal(controller.current, 4);
});

test("throughput reduz após falhas", () => {
  const controller = new ThroughputController({ initial: 3 });
  const result = controller.decide({
    outcomes: [
      { status: "FAILURE", net: -1 },
      { status: "FAILURE", net: -1 }
    ],
    balance: 8,
    initialBalance: 10
  });
  assert.equal(result.reason, "DECREASE_THROUGHPUT");
  assert.equal(controller.current, 2);
});

test("throughput permanece estável sem evidência suficiente", () => {
  const controller = new ThroughputController({ initial: 3 });
  const result = controller.decide({
    outcomes: [{ status: "SUCCESS", net: 4 }],
    balance: 14,
    initialBalance: 10
  });
  assert.equal(result.reason, "INSUFFICIENT_EVIDENCE");
  assert.equal(controller.current, 3);
});
