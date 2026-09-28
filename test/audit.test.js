import test from "node:test";
import assert from "node:assert/strict";
import { AuditTrail } from "../src/audit.js";

test("audit trail records events", () => {
  const audit = new AuditTrail();
  audit.record("DECISION", { score: 1 });
  assert.equal(audit.recent(1)[0].event, "DECISION");
});
