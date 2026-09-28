import test from "node:test";
import assert from "node:assert/strict";
import { CycleController } from "../src/cycle-controller.js";
test("cycle controller stops at zero balance", () => {
  assert.equal(new CycleController().decide({balance:0}).mode, "STOP");
});
