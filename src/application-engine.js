import { randomUUID } from "node:crypto";

const AUTOMATION_POLICY = "APPROVED_AUTOMATION";

export class ApplicationEngine {
  constructor({ browser = null, generator = null } = {}) {
    this.browser = browser;
    this.generator = generator;
    this.records = [];
  }

  prepare(opportunity = {}) {
    const id = "APP-" + randomUUID().replaceAll("-", "").slice(0, 14).toUpperCase();
    const record = {
      id,
      opportunityId: opportunity.id ?? opportunity.url ?? opportunity.title ?? "unknown",
      title: opportunity.title ?? opportunity.name ?? "Opportunity",
      url: opportunity.sourceUrl ?? opportunity.url ?? null,
      status: "DRAFT",
      policy: opportunity.automationPolicy ?? "DRAFT_ONLY",
      proposal: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.records.push(record);
    return record;
  }

  async generateProposal(record, opportunity = {}) {
    if (!record) throw new Error("APPLICATION_NOT_FOUND");
    const fallback = [
      "Olá,",
      "",
      "Analisei o escopo publicado e posso entregar o trabalho solicitado de forma objetiva e documentada.",
      "Antes de iniciar, confirmarei os requisitos, formato de entrega e prazo.",
      "",
      "Posso adaptar a proposta ao escopo específico e fornecer um entregável pronto para revisão."
    ].join("\n");
    let proposal = fallback;
    record.generationStatus = "LOCAL_FALLBACK";
    if (this.generator?.configured) {
      try {
        const generated = await this.generator.generate({
          system: "Write a truthful, concise freelance proposal. Never invent credentials, experience, clients, results or certifications.",
          prompt: JSON.stringify({
            title: opportunity.title ?? opportunity.name,
            company: opportunity.company,
            description: opportunity.description,
            category: opportunity.category,
            evidence: opportunity.signal ?? opportunity.sourceUrl ?? opportunity.url
          }),
          maxTokens: 900
        });
        if (generated?.trim()) {
          proposal = generated.trim();
          record.generationStatus = "GENERATED";
          record.generationError = null;
        }
      } catch (error) {
        // Provider outages/rate limits must not crash the worker or block a usable draft.
        const message = String(error?.message ?? "GENERATION_FAILED");
        const match = message.match(/HTTP_(\\d{3})/);
        record.generationStatus = "LOCAL_FALLBACK";
        record.generationError = match ? "PROVIDER_HTTP_" + match[1] : "PROVIDER_UNAVAILABLE";
      }
    }
    record.proposal = proposal;
    record.status = "READY";
    record.updatedAt = new Date().toISOString();
    return record;
  }

  async submit(record, { session = "default", url = null, selectors = {} } = {}) {
    if (!record) throw new Error("APPLICATION_NOT_FOUND");
    if (record.policy !== AUTOMATION_POLICY) {
      record.status = "DRAFT_ONLY";
      record.blockReason = "AUTOMATION_POLICY_NOT_APPROVED";
      record.updatedAt = new Date().toISOString();
      return record;
    }
    if (!this.browser) throw new Error("BROWSER_WORKER_NOT_CONFIGURED");
    const target = url ?? record.url;
    if (!target) throw new Error("APPLICATION_URL_MISSING");
    await this.browser.navigate(session, target);
    const page = await this.browser.snapshot(session);
    if (page?.captcha || page?.challenge) {
      record.status = "CAPTCHA_REQUIRED";
      record.blockReason = "HUMAN_INTERVENTION_REQUIRED";
      record.updatedAt = new Date().toISOString();
      return record;
    }
    if (selectors.proposal) await this.browser.fill(session, selectors.proposal, record.proposal ?? "");
    if (!selectors.submit) {
      record.status = "READY";
      record.blockReason = "SUBMIT_SELECTOR_MISSING";
      record.updatedAt = new Date().toISOString();
      return record;
    }
    await this.browser.click(session, selectors.submit);
    record.status = "SUBMITTED";
    record.submittedAt = new Date().toISOString();
    record.updatedAt = record.submittedAt;
    record.blockReason = null;
    return record;
  }
  snapshot() {
    return this.records.slice(-200);
  }

  restore(records = []) {
    this.records = Array.isArray(records) ? records.slice(-200) : [];
  }
}
