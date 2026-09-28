import test from "node:test";
import assert from "node:assert/strict";
import { selectStrategy } from "../src/strategy-selector.js";
test("strategy selector uses evidence", () => {
  assert.equal(selectStrategy([{name:"A"},{name:"B"}], {preferred:"B",exploration:false}).name, "B");
});
