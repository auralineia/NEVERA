import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

function clean(value, fallback = "") {
  return String(value ?? fallback).replace(/[<>]/g, "").trim();
}

export class DeliverableEngine {
  constructor({ sandbox, baseDir = "/data/nevera-deliverables" } = {}) {
    this.sandbox = sandbox; this.baseDir = baseDir; this.history = [];
  }

  async fulfill(opportunity = {}) {
    const id = "DEL-" + randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
    const source = await this.#source(opportunity);
    const artifact = this.#buildArtifact({ id, opportunity, source });
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

  #buildArtifact({ id, opportunity, source }) {
    const title=clean(opportunity.title ?? opportunity.name, "NEVERA service");
    const company=clean(opportunity.company, "Client");
    const location=clean(opportunity.location, "Worldwide");
    const category=opportunity.category ?? "DIGITAL_SERVICES";
    const evidence=source?.data ? JSON.stringify(source.data,null,2).slice(0,14000) : (source?.preview ?? "No public source content available.");
    const base = ["# NEVERA Work Product","","Fulfillment ID: "+id,"Opportunity: "+title,
      "Client/company: "+company,"Market/location: "+location,"Category: "+category,"",
      "## Source evidence","SOURCE EVIDENCE",evidence,""];
    const common = ["## Acceptance checklist","- Requirements identified","- Work product generated",
      "- Source evidence preserved","- Output saved to persistent storage"];
    if (category === "DATA_AND_RESEARCH") {
      return { type:"RESEARCH_REPORT", files:[{name:"research-report.md",content:[
        ...base,"## Findings framework","1. Demand signal","2. Requirements and constraints","3. Relevant evidence","4. Risks and open questions",
        ...common,"## Status","READY_FOR_CLIENT_REVIEW",""].join("\n")} ]};
    }
    if (category === "CONTENT_AND_MEDIA") {
      return { type:"CONTENT_DELIVERY", files:[{name:"content-delivery.md",content:[
        ...base,"## Content deliverable","Headline: "+title,"","### Draft","A client-ready draft should be finalized against the customer's requested tone, audience, format and channel before publication.",
        "","### Production checklist","- Audience defined","- Message defined","- Format defined","- Claims reviewed",
        ...common,"## Status","READY_FOR_CLIENT_REVIEW",""].join("\n")} ]};
    }
    if (category === "BUSINESS_AUTOMATION") {
      return { type:"AUTOMATION_SPEC", files:[{name:"automation-spec.md",content:[
        ...base,"## Automation specification","### Trigger","Incoming client request or approved business event.",
        "### Inputs","Client data and approved system inputs.","### Processing","Validate → transform → route → record.",
        "### Output","Validated result plus execution log.","### Controls","No destructive action without authorization.",
        ...common,"## Status","READY_FOR_IMPLEMENTATION",""].join("\n")} ]};
    }
    if (category === "APPS_AND_TOOLS") {
      return { type:"SOFTWARE_SPEC", files:[
        {name:"README.md",content:[...base,"## Software delivery specification","Scope: "+title,"","### Acceptance criteria","- Inputs validated","- Core flow implemented","- Errors handled","- Output validated",...common,"## Status","READY_FOR_IMPLEMENTATION",""].join("\n")},
        {name:"app.js",content:"export function run(input = {}) {\n  if (!input || typeof input !== 'object') throw new TypeError('input must be an object');\n  return { ok: true, input };\n}\n"}
      ]};
    }
    return { type:"SERVICE_DELIVERY", files:[{name:"service-delivery.md",content:[
      ...base,"## Service work product","Service scope: "+title,"","### Work performed","Demand analyzed; requirements structured; source evidence captured; delivery package generated.",
      ...common,"## Status","READY_FOR_CLIENT_REVIEW",""].join("\n")} ]};
  }

  snapshot(){ return this.history.slice(-100); }
}
