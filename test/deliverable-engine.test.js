import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DeliverableEngine } from "../src/deliverable-engine.js";

test("fallback deliverables contain reviewable, evidence-aware work packages", async () => {
  const baseDir = await mkdtemp(path.join(os.tmpdir(), "nevera-deliverable-"));
  try {
    const engine = new DeliverableEngine({ baseDir });
    const cases = [
      ["DATA_AND_RESEARCH", "research-report.md", "Questions to resolve"],
      ["CONTENT_AND_MEDIA", "content-delivery.md", "Creative direction"],
      ["BUSINESS_AUTOMATION", "automation-spec.md", "Acceptance tests"],
      ["APPS_AND_TOOLS", "README.md", "Definition of done"],
      ["DIGITAL_SERVICES", "service-delivery.md", "Acceptance criteria"]
    ];
    for (const [category, filename, expected] of cases) {
      const result = await engine.fulfill({
        title: "Sample opportunity",
        company: "Example organization",
        category,
        url: "https://example.com/listing"
      });
      assert.equal(result.executionMode, "RULE_BASED_FALLBACK");
      assert.equal(result.status, "DELIVERED");
      assert.ok(result.content.includes(expected), category + " should contain tailored guidance");
      assert.ok(result.content.includes("DRAFT_FOR_HUMAN_REVIEW"));
      assert.ok(result.content.includes("No public source content was retrieved."));
      assert.equal(result.files[0].name, filename);
      const persisted = await Promise.all(result.files.map((file) => readFile(file.filePath, "utf8")));
      assert.deepEqual(persisted, result.files.map((file) => file.name === "README.md" ? persisted[0] : persisted[result.files.indexOf(file)]));
      assert.equal(result.content, persisted.join("\n\n"));
    }
    assert.equal(engine.snapshot().length, cases.length);
  } finally {
    await rm(baseDir, { recursive: true, force: true });
  }
});

test("AI-generated work products remain distinguished from fallback drafts", async () => {
  const baseDir = await mkdtemp(path.join(os.tmpdir(), "nevera-ai-deliverable-"));
  try {
    const engine = new DeliverableEngine({
      baseDir,
      generator: { configured: true, generate: async () => "A".repeat(100) }
    });
    const result = await engine.fulfill({ title: "Verified scope", category: "DIGITAL_SERVICES" });
    assert.equal(result.executionMode, "AI_PRODUCTION");
    assert.equal(result.type, "AI_GENERATED_WORK_PRODUCT");
    assert.equal(result.files[0].name, "work-product.md");
    assert.equal(await readFile(result.files[0].filePath, "utf8"), result.content);
  } finally {
    await rm(baseDir, { recursive: true, force: true });
  }
});
