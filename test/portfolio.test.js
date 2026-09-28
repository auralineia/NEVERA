import test from "node:test";
import assert from "node:assert/strict";
import { buildPortfolio } from "../src/portfolio.js";

test("portfolio diversifies categories", () => {
  const result = buildPortfolio([
    { name: "a", category: "SERVICE" },
    { name: "b", category: "SERVICE" },
    { name: "c", category: "RESEARCH" }
  ]);
  assert.equal(result.length, 2);
});
