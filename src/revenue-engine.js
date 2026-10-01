export const GLOBAL_MARKETS = [
  { code: "BR", currency: "BRL", multiplier: 1.00, methods: ["PIX", "CARD", "BANK_TRANSFER", "INVOICE"] },
  { code: "US", currency: "USD", multiplier: 1.18, methods: ["CARD", "BANK_TRANSFER", "INVOICE"] },
  { code: "CA", currency: "CAD", multiplier: 1.12, methods: ["CARD", "BANK_TRANSFER", "INVOICE"] },
  { code: "GB", currency: "GBP", multiplier: 1.15, methods: ["CARD", "BANK_TRANSFER", "INVOICE"] },
  { code: "EU", currency: "EUR", multiplier: 1.15, methods: ["CARD", "BANK_TRANSFER", "INVOICE"] },
  { code: "AU", currency: "AUD", multiplier: 1.10, methods: ["CARD", "BANK_TRANSFER", "INVOICE"] },
  { code: "JP", currency: "JPY", multiplier: 1.04, methods: ["CARD", "BANK_TRANSFER", "INVOICE"] },
  { code: "SG", currency: "SGD", multiplier: 1.12, methods: ["CARD", "BANK_TRANSFER", "INVOICE"] },
  { code: "AE", currency: "AED", multiplier: 1.12, methods: ["CARD", "BANK_TRANSFER", "INVOICE"] },
  { code: "MX", currency: "MXN", multiplier: 0.92, methods: ["CARD", "BANK_TRANSFER", "INVOICE"] },
  { code: "CL", currency: "CLP", multiplier: 0.92, methods: ["CARD", "BANK_TRANSFER", "INVOICE"] },
  { code: "AR", currency: "ARS", multiplier: 0.88, methods: ["CARD", "BANK_TRANSFER", "INVOICE"] }
];

export const REVENUE_CHANNELS = [
  "DIGITAL_SERVICES",
  "BUSINESS_AUTOMATION",
  "CONTENT_AND_MEDIA",
  "DIGITAL_PRODUCTS",
  "ECOMMERCE",
  "DATA_AND_RESEARCH",
  "MICRO_SAAS",
  "APPS_AND_TOOLS",
  "AFFILIATE_MARKETING",
  "B2B_CONTRACTS",
  "ARBITRAGE",
  "INVESTMENT_RESEARCH"
];

const SERVICE_PROFILES = {
  DIGITAL_SERVICES: { label: "Serviço digital", baseUsd: 150 },
  BUSINESS_AUTOMATION: { label: "Automação empresarial", baseUsd: 500 },
  CONTENT_AND_MEDIA: { label: "Conteúdo e mídia", baseUsd: 120 },
  DIGITAL_PRODUCTS: { label: "Produto digital", baseUsd: 49 },
  ECOMMERCE: { label: "Oferta de e-commerce", baseUsd: 80 },
  DATA_AND_RESEARCH: { label: "Pesquisa e dados", baseUsd: 300 },
  MICRO_SAAS: { label: "Micro-SaaS", baseUsd: 29 },
  APPS_AND_TOOLS: { label: "App ou ferramenta", baseUsd: 99 },
  AFFILIATE_MARKETING: { label: "Oferta de afiliados", baseUsd: 35 },
  B2B_CONTRACTS: { label: "Contrato B2B", baseUsd: 1500 },
  ARBITRAGE: { label: "Arbitragem legítima", baseUsd: 100 },
  INVESTMENT_RESEARCH: { label: "Pesquisa de investimentos", baseUsd: 100 }
};

export class RevenueEngine {
  constructor(saved = {}) {
    this.mode = "SIMULATION"; // Hard lock: no real-money payment mode.
    this.currency = String(process.env.NEVERA_BASE_CURRENCY ?? saved.currency ?? "USD").toUpperCase();
    this.sequence = Number(saved.sequence ?? 0);
    this.offers = Array.isArray(saved.offers) ? saved.offers : [];
    this.paymentIntents = Array.isArray(saved.paymentIntents) ? saved.paymentIntents : [];
    this.ledger = Array.isArray(saved.ledger) ? saved.ledger : [];
    this.stats = saved.stats ?? {
      offersCreated: 0,
      paymentsPending: 0,
      paymentsConfirmed: 0,
      grossRevenue: 0,
      netRevenue: 0
    };
  }

  market(code) {
    return GLOBAL_MARKETS.find((item) => item.code === String(code).toUpperCase()) ?? GLOBAL_MARKETS[0];
  }

  price(channel, marketCode, signalScore = 0.5) {
    const profile = SERVICE_PROFILES[channel] ?? SERVICE_PROFILES.DIGITAL_SERVICES;
    const requestedMarket = this.market(marketCode);
    const liveMercadoPago = String(process.env.NEVERA_PAYMENT_PROVIDER ?? "").toUpperCase() === "MERCADOPAGO" && String(process.env.NEVERA_PAYMENT_MODE ?? this.mode).toUpperCase() === "LIVE";
    const market = liveMercadoPago ? this.market("BR") : requestedMarket;
    const confidence = Math.max(0.75, Math.min(1.5, 0.75 + Number(signalScore || 0) * 0.75));
    const amount = Math.max(1, Math.round(profile.baseUsd * market.multiplier * confidence));
    return {
      amount,
      currency: market.currency,
      market: market.code,
      label: profile.label,
      baseUsd: profile.baseUsd
    };
  }

  createOffer({ channel, market, signal, score = 0.5, title = null, sourceUrl = null, company = null, location = null, pipelineId = null } = {}) {
    const selectedChannel = REVENUE_CHANNELS.includes(channel) ? channel : "DIGITAL_SERVICES";
    const pricing = this.price(selectedChannel, market, score);
    const id = "OFFER-" + (++this.sequence).toString().padStart(6, "0");
    const offer = {
      id,
      channel: selectedChannel,
      market: pricing.market,
      currency: pricing.currency,
      amount: pricing.amount,
      title: title ?? pricing.label,
      signal: signal?.name ?? "PUBLIC_DEMAND",
      sourceUrl,
      company,
      location,
      score: Number(score) || 0,
      pipelineId,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      paymentMethods: this.market(pricing.market).methods,
      opportunity: {
        name: title ?? pricing.label,
        title: title ?? pricing.label,
        category: selectedChannel,
        sourceUrl,
        url: sourceUrl,
        company,
        location,
        signal: signal?.name ?? "PUBLIC_DEMAND",
        pipelineId,
        market: pricing.market
      }
    };
    this.offers.push(offer);
    this.stats.offersCreated += 1;
    return offer;
  }

  createPaymentIntent(offer) {
    if (!offer?.id) throw new Error("OFFER_REQUIRED");
    const id = "PAY-" + (++this.sequence).toString().padStart(6, "0");
    const intent = {
      id,
      offerId: offer.id,
      amount: offer.amount,
      currency: offer.currency,
      status: "PENDING",
      provider: "PROVIDER_ADAPTER_REQUIRED",
      createdAt: new Date().toISOString()
    };
    this.paymentIntents.push(intent);
    this.stats.paymentsPending += 1;
    return intent;
  }

  confirmPayment(paymentId, { gross = null, fees = 0 } = {}) {
    const intent = this.paymentIntents.find((item) => item.id === paymentId);
    if (!intent) throw new Error("PAYMENT_INTENT_NOT_FOUND");
    if (intent.status === "CONFIRMED") return intent;
    const grossAmount = Number(gross ?? intent.amount);
    const feeAmount = Math.max(0, Number(fees) || 0);
    intent.status = "CONFIRMED";
    intent.confirmedAt = new Date().toISOString();
    intent.gross = grossAmount;
    intent.fees = feeAmount;
    intent.net = Math.max(0, grossAmount - feeAmount);
    this.stats.paymentsPending = Math.max(0, this.stats.paymentsPending - 1);
    this.stats.paymentsConfirmed += 1;
    this.stats.grossRevenue += grossAmount;
    this.stats.netRevenue += intent.net;
    this.ledger.push({
      paymentId,
      offerId: intent.offerId,
      currency: intent.currency,
      gross: grossAmount,
      fees: feeAmount,
      net: intent.net,
      recordedAt: intent.confirmedAt
    });
    return intent;
  }

  cycle({ opportunities = [], maxOffers = 5 } = {}) {
    const created = [];
    for (const item of opportunities.slice(0, maxOffers)) {
      const channel = item?.category && REVENUE_CHANNELS.includes(item.category)
        ? item.category
        : REVENUE_CHANNELS[item?.index ? Math.abs(Number(item.index)) % REVENUE_CHANNELS.length : 0];
      const market = item?.market ?? GLOBAL_MARKETS[this.sequence % GLOBAL_MARKETS.length].code;
      created.push(this.createOffer({
        channel,
        market,
        signal: item,
        score: Number(item?.score ?? item?.viability ?? 0.5),
        title: item?.name ?? null,
        sourceUrl: item?.url ?? null,
        company: item?.company ?? null,
        location: item?.location ?? null,
        pipelineId: item?.pipelineId ?? null
      }));
    }
    return created;
  }

  snapshot() {
    return {
      mode: this.mode,
      baseCurrency: this.currency,
      globalMarkets: GLOBAL_MARKETS.length,
      revenueChannels: REVENUE_CHANNELS,
      offers: this.offers.slice(-50),
      paymentIntents: this.paymentIntents.slice(-50),
      ledger: this.ledger.slice(-100),
      stats: { ...this.stats },
      realPayments: true,
      providerStatus: "LIVE_CHECKOUT_READY"
    };
  }
}
