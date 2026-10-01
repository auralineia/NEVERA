import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

function clean(value, fallback = "") {
  return String(value ?? fallback).replace(/[<>]/g, "").trim();
}

export class DeliverableEngine {
  constructor({ sandbox, generator = null, baseDir = "/data/nevera-deliverables" } = {}) {
    this.sandbox = sandbox; this.generator = generator; this.baseDir = baseDir; this.history = [];
  }

  async fulfill(opportunity = {}) {
    const id = "DEL-" + randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
    const source = await this.#source(opportunity);
    const generated = await this.#generate({ id, opportunity, source });
    const artifact = generated ?? this.#buildArtifact({ id, opportunity, source });
    await mkdir(path.join(this.baseDir, id), { recursive: true });
    const files = [];
    for (const file of artifact.files) {
      const filePath = path.join(this.baseDir, id, file.name);
      await writeFile(filePath, file.content, "utf8");
      files.push({ name: file.name, filePath, bytes: Buffer.byteLength(file.content) });
    }
    const record = {
      id, status: "DELIVERED", type: artifact.type,
      title: clean(opportunity.title ?? opportunity.name, "NEVERA service"),
      category: opportunity.category ?? "DIGITAL_SERVICES",
      executionMode: generated ? "AI_PRODUCTION" : "RULE_BASED_FALLBACK",
      files, sourceUrl: opportunity.sourceUrl ?? opportunity.url ?? null,
      createdAt: new Date().toISOString()
    };
    this.history.push(record);
    return { ...record, content: artifact.files.map((f) => f.content).join("\n\n") };
  }

  async #source(opportunity) {
    const url = opportunity.sourceUrl ?? opportunity.url;
    if (!url || !this.sandbox) return null;
    try {
      const r = await this.sandbox.fetchPublic(url);
      return { ok:r.ok,status:r.status,preview:r.preview??"",data:r.data??null };
    } catch (e) { return { ok:false,error:e.message }; }
  }

  async #generate({ id, opportunity, source }) {
    if (!this.generator?.configured) return null;
    const evidence = source?.data ? JSON.stringify(source.data).slice(0, 12000) : (source?.preview ?? "");
    const prompt = [
      "Create the actual client work product for this opportunity, not a generic template.",
      "Do not claim external actions were performed.",
      "Use only the supplied evidence; clearly mark assumptions and missing inputs.",
      "For research/data work, provide concrete findings, tables or structured analysis when evidence supports them.",
      "For content work, write the requested copy rather than describing how to write it.",
      "For software/app work, provide an implementation-ready specification and code when the available evidence supports a concrete implementation.",
      "For automation work, provide a concrete workflow, inputs, outputs, validation and implementation details.",
      "Return only the client-facing deliverable content, ready for review. Do not include internal reasoning.",
      "Fulfillment ID: " + id,
      "Title: " + (opportunity.title ?? opportunity.name ?? ""),
      "Category: " + (opportunity.category ?? ""),
      "Company: " + (opportunity.company ?? ""),
      "Location: " + (opportunity.location ?? ""),
      "Public evidence: " + evidence
    ].join("\n");
    try {
      const content = await this.generator.generate({
        system: "You are NEVERA's production engine. Produce useful, concrete, professional digital work. Never fabricate completed external actions, credentials, approvals, results, customers or payments.",
        prompt,
        maxTokens: 5000
      });
      if (!content || content.length < 80) return null;
      return { type: "AI_GENERATED_WORK_PRODUCT", files: [{ name: "work-product.md", content }] };
    } catch (error) {
      this.history.push({ status: "GENERATION_FAILED", error: error.message, createdAt: new Date().toISOString() });
      return null;
    }
  }

  #buildArtifact({ id, opportunity, source }) {
    const title = clean(opportunity.title ?? opportunity.name, "NEVERA service");
    const company = clean(opportunity.company, "Client / opportunity owner");
    const location = clean(opportunity.location, "Not specified");
    const category = clean(opportunity.category, "DIGITAL_SERVICES");
    const evidence = source?.data
      ? JSON.stringify(source.data, null, 2).slice(0, 14000)
      : (source?.preview ?? "No public source content was retrieved.");
    const sourceStatus = source?.ok ? "Retrieved successfully" : "Not retrieved or unavailable";
    const base = [
      "# NEVERA — Review-ready work package", "",
      "**Fulfillment ID:** " + id,
      "**Opportunity:** " + title,
      "**Organization:** " + company,
      "**Market:** " + location,
      "**Category:** " + category,
      "**Prepared:** " + new Date().toISOString(),
      "**Production mode:** Rule-based fallback (not AI-generated)", "",
      "> This is a structured working draft based only on the opportunity metadata and evidence below. It is not proof of client acceptance, publication, implementation, hiring, or payment.", "",
      "## Evidence and assumptions",
      "- Source retrieval: " + sourceStatus,
      "- Source URL: " + clean(opportunity.sourceUrl ?? opportunity.url, "Not provided"),
      "- Evidence available: " + (evidence === "No public source content was retrieved." ? "No page content; verify requirements manually." : "Captured excerpt/data is included below."),
      "- Assumptions: requirements not explicitly present in the evidence are treated as unknown, not as facts.", "",
      "### Captured public evidence", "SOURCE EVIDENCE", evidence, "",
      "## Opportunity brief",
      "- **Requested outcome:** Confirm the exact result, format, audience, and acceptance criteria with the opportunity owner.",
      "- **Known inputs:** Public metadata and the evidence captured above.",
      "- **Missing inputs:** Scope details, brand/style requirements, source files, access permissions, deadline, and approval contact unless explicitly stated in evidence.",
      "- **Primary risk:** The public listing may be incomplete, expired, or not represent a confirmed customer request.", ""
    ];
    const review = [
      "## Quality and handoff checklist",
      "- [ ] Confirm scope, intended audience, and acceptance criteria.",
      "- [ ] Validate all factual claims against reliable source material.",
      "- [ ] Replace assumptions and placeholders with client-approved inputs.",
      "- [ ] Review privacy, licensing, accessibility, and security requirements as applicable.",
      "- [ ] Obtain human approval before sending, publishing, deploying, or submitting anything.",
      "- [ ] Record client feedback and revise the deliverable.", "",
      "## Current status",
      "**DRAFT_FOR_HUMAN_REVIEW**", "",
      "No external action was taken by generating this file."
    ];
    if (category === "DATA_AND_RESEARCH") {
      return { type: "RESEARCH_REPORT", files: [{ name: "research-report.md", content: [
        ...base, "## Research report", "",
        "### Questions to resolve",
        "1. What decision should this research support?",
        "2. Which geography, customer segment, and time period are in scope?",
        "3. Which sources and evidence standards are acceptable?",
        "",
        "### Findings",
        "The retrieved evidence is reproduced above. No market size, trend, competitor fact, or numerical finding is asserted unless it appears in that evidence.",
        "",
        "### Analysis framework",
        "| Dimension | What to verify | Result |",
        "|---|---|---|",
        "| Demand | Observable need and date of signal | Pending evidence review |",
        "| Audience | Buyer/user and geography | Not established |",
        "| Alternatives | Existing solutions and differentiators | Research required |",
        "| Feasibility | Inputs, skills, cost, and access | Requires scope confirmation |",
        "| Risks | Source quality, privacy, legal, operational | Review required |",
        "",
        "### Recommended next research steps",
        "- Verify the listing is active and its source is authoritative.",
        "- Collect at least two independent sources for material claims.",
        "- Separate measured facts, estimates, and hypotheses.",
        ...review, ""
      ].join("\n") }] };
    }
    if (category === "CONTENT_AND_MEDIA") {
      return { type: "CONTENT_DELIVERY", files: [{ name: "content-delivery.md", content: [
        ...base, "## Content package", "",
        "### Creative direction",
        "- **Objective:** To be confirmed with the requester.",
        "- **Audience:** Not established by available evidence.",
        "- **Channel and format:** Confirm before production.",
        "- **Tone and call to action:** Require approval; do not infer brand voice.",
        "",
        "### Draft content",
        "**Working headline:** " + title,
        "",
        "Create the final copy only after confirming the product/service facts, audience, channel, tone, and required length. The listing metadata alone is insufficient to make defensible product claims.",
        "",
        "### Variations to prepare after brief approval",
        "1. Short-form version for quick attention.",
        "2. Informative version explaining the verified value proposition.",
        "3. Conversion-oriented version with a client-approved call to action.",
        "",
        "### Production checklist",
        "- Confirm rights to images, music, logos, and supplied assets.",
        "- Fact-check names, prices, features, and claims.",
        "- Adapt dimensions and length to the approved channel.",
        "- Obtain approval before publication.",
        ...review, ""
      ].join("\n") }] };
    }
    if (category === "BUSINESS_AUTOMATION") {
      return { type: "AUTOMATION_SPEC", files: [{ name: "automation-spec.md", content: [
        ...base, "## Automation implementation brief", "",
        "### Proposed workflow (requires validation)",
        "1. **Trigger:** A client-approved event or incoming record.",
        "2. **Validate:** Check required fields, format, consent, and duplicate status.",
        "3. **Transform:** Normalize data and apply documented business rules.",
        "4. **Route:** Send the item to an approved destination or human review queue.",
        "5. **Record:** Store timestamp, outcome, errors, and a correlation ID.",
        "6. **Recover:** Retry only safe transient failures; route uncertain outcomes to manual review.",
        "",
        "### Interface contract",
        "- **Inputs:** To be defined from the client's actual systems and sample data.",
        "- **Outputs:** A validated result and an auditable execution record.",
        "- **Failure behavior:** Fail closed for missing consent, invalid data, or uncertain destructive actions.",
        "",
        "### Acceptance tests",
        "- Valid input completes and is traceable.",
        "- Invalid or duplicate input is safely rejected.",
        "- Temporary failure does not create duplicate side effects.",
        "- Human approval is required for external or irreversible actions.",
        ...review, ""
      ].join("\n") }] };
    }
    if (category === "APPS_AND_TOOLS") {
      return { type: "SOFTWARE_SPEC", files: [
        { name: "README.md", content: [
          ...base, "## Software delivery brief", "",
          "### Scope",
          "Define the smallest useful feature set after confirming the requester’s workflow and constraints.",
          "",
          "### Proposed components",
          "- Input validation and explicit data contract.",
          "- Core business logic separated from external integrations.",
          "- Error handling with safe, user-readable messages.",
          "- Tests for normal, invalid, boundary, and failure cases.",
          "- Logging that excludes secrets and unnecessary personal data.",
          "",
          "### Definition of done",
          "- Requirements and acceptance tests approved.",
          "- Implementation runs in the target environment.",
          "- Security, accessibility, and privacy checks completed.",
          "- Deployment and rollback steps documented.",
          ...review, ""
        ].join("\n") },
        { name: "app.js", content: "export function validateObjectInput(input) {\n  if (!input || typeof input !== \"object\" || Array.isArray(input)) {\n    return { ok: false, error: \"INPUT_MUST_BE_OBJECT\" };\n  }\n  return { ok: true, value: input };\n}\n" }
      ] };
    }
    return { type: "SERVICE_DELIVERY", files: [{ name: "service-delivery.md", content: [
      ...base, "## Service delivery brief", "",
      "### Work package",
      "1. Confirm the requested outcome and what is explicitly excluded.",
      "2. Gather authorized inputs and validate their completeness.",
      "3. Produce the agreed work product using the captured evidence.",
      "4. Run a factual, quality, and format review.",
      "5. Prepare a handoff package and list remaining client decisions.",
      "",
      "### Acceptance criteria",
      "- Output matches an agreed scope and format.",
      "- Material claims are traceable to supplied evidence.",
      "- Unknowns and dependencies are clearly disclosed.",
      "- No external action is represented as completed without confirmation.",
      ...review, ""
    ].join("\n") }] };
  }

  snapshot(){ return this.history.slice(-100); }
}
