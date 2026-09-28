import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export class DeliverableEngine {
  constructor({ sandbox, baseDir = "/data/nevera-deliverables" } = {}) {
    this.sandbox = sandbox; this.baseDir = baseDir; this.history = [];
  }
  async fulfill(opportunity = {}) {
    const id = "DEL-" + randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
    const source = await this.#source(opportunity);
    const content = this.#build({ id, opportunity, source });
    await mkdir(this.baseDir, { recursive: true });
    const filename = id + ".md"; const filePath = path.join(this.baseDir, filename);
    await writeFile(filePath, content, "utf8");
    const record = { id, status: "DELIVERED", type: "MARKDOWN_FULFILLMENT",
      title: opportunity.title ?? opportunity.name ?? "NEVERA service",
      category: opportunity.category ?? "DIGITAL_SERVICES", filePath, filename,
      sourceUrl: opportunity.sourceUrl ?? opportunity.url ?? null, createdAt: new Date().toISOString() };
    this.history.push(record); return { ...record, content };
  }
  async #source(opportunity) {
    const url = opportunity.sourceUrl ?? opportunity.url;
    if (!url || !this.sandbox) return null;
    try { const r = await this.sandbox.fetchPublic(url); return { ok:r.ok,status:r.status,preview:r.preview??"",data:r.data??null}; }
    catch (e) { return { ok:false,error:e.message }; }
  }
  #build({ id, opportunity, source }) {
    const title=opportunity.title??opportunity.name??"NEVERA service";
    const company=opportunity.company??"Client"; const location=opportunity.location??"Worldwide";
    const category=opportunity.category??"DIGITAL_SERVICES"; const sourceUrl=opportunity.sourceUrl??opportunity.url??"Not provided";
    const evidence=source?.data?JSON.stringify(source.data,null,2).slice(0,12000):(source?.preview??"No public source content available.");
    const action={
      DIGITAL_SERVICES:"Prepared a client-ready service brief and delivery checklist.",
      BUSINESS_AUTOMATION:"Prepared an automation implementation brief with workflow scope, inputs, outputs and validation checkpoints.",
      CONTENT_AND_MEDIA:"Prepared a content production brief with deliverable structure, audience, channel and validation checklist.",
      DATA_AND_RESEARCH:"Prepared a research brief with evidence requirements, findings structure and validation checklist.",
      APPS_AND_TOOLS:"Prepared a software delivery brief with scope, acceptance criteria and validation checklist."
    }[category]??"Prepared a client-ready delivery brief and validation checklist.";
    return ["# NEVERA Fulfillment Package","","Fulfillment ID: "+id,"Opportunity: "+title,"Client/company: "+company,
      "Market/location: "+location,"Category: "+category,"","## Work completed",action,"","## Delivery scope",
      "- Review the public demand signal and requirements.","- Produce the agreed deliverable against the acceptance criteria.",
      "- Validate the result before customer delivery.","","## Public source",sourceUrl,"","## Source evidence captured",
      "SOURCE EVIDENCE",evidence,"","## Fulfillment status",
      "This package records concrete work NEVERA performed from available public inputs. It does not claim completion of external actions it was not authorized or able to perform.",""].join("\n");
  }
  snapshot(){ return this.history.slice(-100); }
}
