import test from "node:test";
import assert from "node:assert/strict";
import { recoveryPolicy } from "../src/recovery-policy.js";
test("recovery protects deep drawdown", () => {
  assert.equal(recoveryPolicy({balance:4, initialBalance:10}).mode, "PRESERVE");
});
