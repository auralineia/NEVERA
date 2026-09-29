function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function classifyStage(status) {
  if (status === "PAID") return "IN_PROGRESS";
  if (status === "DELIVERED") return "PAYMENT_RECEIVED";
  return status;
}

export class RevenueExecutionPipeline {
  constructor({ generator = null, maxHistory = 100 } = {}) {
    this.generator = generator;
    this.maxHistory = maxHistory;
    this.records = [];
    this.stats = {
      discovered: 0,
      qualified: 0,
      rejected: 0,
      proposalsReady: 0,
      awaitingAcceptance: 0,
      inProgress: 0,
      delivered: 0,
      paid: 0,
      estimatedRevenue: 0
    };
  }

  restore(saved = []) {
    if (Array.isArray(saved)) {
      this.records = saved.slice(-this.maxHistory);
      this.stats = this.records.reduce((acc, item) => {
        acc.discovered += 1;
        if (item.status === "QUALIFIED" || item.status === "PROPOSAL_READY" || item.status === "AWAITING_ACCEPTANCE" || item.status === "IN_PROGRESS" || item.status === "DELIVERED" || item.status === "PAID") acc.qualified += 1;
        if (item.status === "REJECTED") acc.rejected += 1;
        if (item.status === "PROPOSAL_READY") acc.proposalsReady += 1;
        if (item.status === "AWAITING_ACCEPTANCE") acc.awaitingAcceptance += 1;
        if (item.status === "IN_PROGRESS") acc.inProgress += 1;
        if (item.status === "DELIVERED") acc.delivered += 1;
        if (item.status === "PAID") acc.paid += 1;
        acc.estimatedRevenue += money(item.estimatedRevenue);
        return acc;
      }, { ...this.stats });
    }
  }

  #key(opportunity) {
    return String(opportunity?.url ?? opportunity?.applicationUrl ?? opportunity?.name ?? "").trim().toLowerCase();
  }

  #score(opportunity, evaluation = {}) {
    const evidence = [
      opportunity?.url,
      opportunity?.applicationUrl,
      opportunity?.company,
      opportunity?.location,
      opportunity?.name
    ].filter(Boolean).length;
    const evidenceScore = Math.min(1, evidence / 5);
    const viability = clamp(evaluation.viabilityScore ?? opportunity?.score ?? 0);
    const demand = clamp(opportunity?.demand ?? 1);
    const competition = clamp(opportunity?.competition ?? 1);
    const risk = clamp(opportunity?.risk ?? 0.25);
    return Number(clamp(
      viability * 0.55 +
      evidenceScore * 0.15 +
      demand * 0.15 +
      (1 - competition) * 0.05 +
      (1 - risk) * 0.10
    ).toFixed(4));
  }

  qualify(opportunity, evaluation = {}) {
    const score = this.#score(opportunity, evaluation);
    const key = this.#key(opportunity);
    const existing = this.records.find((item) => item.key === key && key);
    if (existing) return { ...existing, duplicate: true };

    const estimatedRevenue = money(opportunity?.estimatedRevenue);
    const estimatedCost = money(opportunity?.estimatedCost);
    const qualified = Boolean(
      key &&
      evaluation.viable &&
      score >= 0.5 &&
      estimatedRevenue > estimatedCost
    );

    const record = {
      id: "OPP-" + String(this.records.length + 1).padStart(6, "0"),
      key,
      title: opportunity?.name ?? opportunity?.title ?? "Public opportunity",
      company: opportunity?.company ?? null,
      category: opportunity?.category ?? "DIGITAL_SERVICES",
      source: opportunity?.source ?? null,
      signal: opportunity?.signal ?? null,
      url: opportunity?.url ?? null,
      applicationUrl: opportunity?.applicationUrl ?? opportunity?.url ?? null,
      market: opportunity?.market ?? "BR",
      estimatedRevenue,
      estimatedCost,
      score,
      status: qualified ? "QUALIFIED" : "REJECTED",
      stage: qualified ? "QUALIFIED" : "REJECTED",
      createdAt: new Date().toISOString(),
      proposal: null,
      fulfillmentId: null,
      paymentId: null
    };

    this.records.push(record);
    this.records = this.records.slice(-this.maxHistory);
    this.stats.discovered += 1;
    this.stats[qualified ? "qualified" : "rejected"] += 1;
    if (qualified) this.stats.estimatedRevenue += estimatedRevenue;
    return record;
  }

  async prepareProposal(record, opportunity) {
    if (!record || record.status !== "QUALIFIED") return record;
    if (record.proposal) return record;

    const fallback = [
      "PROPOSTA NEVERA",
      "",
      "Projeto: " + record.title,
      "Empresa: " + (record.company ?? "Cliente"),
      "Categoria: " + record.category,
      "",
      "Escopo inicial:",
      "- analisar os requisitos públicos disponíveis",
      "- produzir o trabalho solicitado com revisão de qualidade",
      "- entregar os arquivos e evidências em formato utilizável",
      "",
      "Observação: esta proposta não afirma candidatura, contratação ou resultado externo sem confirmação do cliente."
    ].join("\n");

    let content = fallback;
    if (this.generator?.configured) {
      try {
        const generated = await this.generator.generate({
          system: "Você é o motor comercial da NEVERA. Escreva propostas profissionais, objetivas e honestas. Nunca diga que a NEVERA foi contratada, que enviou candidatura ou que falou com o cliente se isso não estiver comprovado.",
          prompt: [
            "Crie uma proposta curta para esta oportunidade pública.",
            "Inclua escopo, entregáveis, prazo sugerido sem inventar prazo do cliente e próximo passo.",
            "Não invente experiência, clientes, certificações, preços obrigatórios ou resultados.",
            "Título: " + record.title,
            "Empresa: " + (record.company ?? ""),
            "Categoria: " + record.category,
            "Fonte: " + (record.url ?? ""),
            "Receita estimada: " + record.estimatedRevenue + " " + record.market
          ].join("\n"),
          maxTokens: 1200
        });
        if (generated && generated.length >= 80) content = generated;
      } catch {}
    }

    record.proposal = {
      status: "READY",
      content,
      preparedAt: new Date().toISOString()
    };
    record.status = "PROPOSAL_READY";
    record.stage = "PROPOSAL_READY";
    this.stats.proposalsReady += 1;
    this.stats.awaitingAcceptance += 1;
    return record;
  }

  attachPayment(record, paymentId) {
    if (!record) return null;
    record.paymentId = paymentId ?? null;
    record.status = "AWAITING_PAYMENT";
    record.stage = "AWAITING_PAYMENT";
    this.stats.awaitingAcceptance = Math.max(0, this.stats.awaitingAcceptance - 1);
    return record;
  }

  markPaid(record, paymentId, fulfillmentId = null) {
    if (!record) return null;
    record.paymentId = paymentId ?? record.paymentId;
    record.fulfillmentId = fulfillmentId ?? record.fulfillmentId;
    record.status = "PAID";
    record.stage = classifyStage("PAID");
    this.stats.inProgress += 1;
    return record;
  }

  markDelivered(record, fulfillmentId) {
    if (!record) return null;
    const wasPaid = record.status === "PAID";
    record.fulfillmentId = fulfillmentId ?? record.fulfillmentId;
    record.status = "DELIVERED";
    record.stage = "DELIVERED";
    this.stats.inProgress = Math.max(0, this.stats.inProgress - 1);
    this.stats.delivered += 1;
    if (wasPaid) this.stats.paid += 1;
    return record;
  }

  markPaymentReceived(record) {
    if (!record) return null;
    record.status = "PAID";
    record.stage = "PAYMENT_RECEIVED";
    this.stats.paid += 1;
    return record;
  }

  snapshot() {
    return {
      stats: { ...this.stats },
      records: this.records.slice(-this.maxHistory)
    };
  }
}
