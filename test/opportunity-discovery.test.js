import test from "node:test";
import assert from "node:assert/strict";
import { OpportunityDiscovery } from "../src/opportunity-discovery.js";

test("descoberta consulta fontes públicas", async () => {
  const calls = [];
  const discovery = new OpportunityDiscovery({
    sandbox: { fetchPublic: async (url) => { calls.push(url); return { ok: true, bytes: 10 }; } },
    sources: [{ name: "source", url: "https://example.com", signal: "PUBLIC_DATA" }]
  });
  const result = await discovery.scan();
  assert.equal(calls.length, 1);
  assert.equal(result[0].status, "AVAILABLE");
});
