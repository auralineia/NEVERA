import test from "node:test";
import assert from "node:assert/strict";
import { RealSandbox } from "../src/real-sandbox.js";

test("sandbox só permite HTTPS", () => {
  const sandbox = new RealSandbox({ allowDomains: ["example.com"] });
  assert.equal(sandbox.canAccess("http://example.com"), false);
  assert.equal(sandbox.canAccess("https://example.com"), true);
  assert.equal(sandbox.canAccess("https://google.com"), false);
});
