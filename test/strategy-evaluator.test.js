import test from "node:test";
import assert from "node:assert/strict";
import { evaluateStrategy } from "../src/strategy-evaluator.js";
test("strategy evaluator promotes strong evidence", () => {
  const r = evaluateStrategy([{status:"SUCCESS",net:5},{status:"SUCCESS",net:4}]);
  assert.equal(r.verdict, "PROMOTE");
});
