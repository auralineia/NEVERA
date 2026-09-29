import { createHmac, timingSafeEqual } from "node:crypto";

const STRIPE_API = "https://api.stripe.com/v1";
const MERCADO_PAGO_API = "https://api.mercadopago.com";

function stripeHeaders(secret) {
  return {
    authorization: `Bearer ${secret}`,
    "content-type": "application/x-www-form-urlencoded"
  };
}

function stripeAmount(amount, currency) {
  const zeroDecimal = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);
  return zeroDecimal.has(String(currency).toLowerCase())
    ? Math.round(Number(amount))
    : Math.round(Number(amount) * 100);
}

function formEncode(entries) {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  return params;
}

export class PaymentAdapter {
  constructor({ mode = process.env.NEVERA_PAYMENT_MODE ?? "SIMULATION" } = {}) {
    this.mode = String(mode).toUpperCase();
    this.provider = String(process.env.NEVERA_PAYMENT_PROVIDER ?? "HTTP").toUpperCase();
    this.apiSecret = String(process.env.NEVERA_PAYMENT_API_SECRET ?? "").trim();
    this.webhookSecret = String(process.env.NEVERA_PAYMENT_WEBHOOK_SECRET ?? "").trim();
    this.mercadoPagoAccessToken = String(process.env.NEVERA_MERCADO_PAGO_ACCESS_TOKEN ?? "").trim();
    this.mercadoPagoWebhookSecret = String(process.env.NEVERA_MERCADO_PAGO_WEBHOOK_SECRET ?? "").trim();
    this.returnUrl = String(process.env.NEVERA_PAYMENT_RETURN_URL ?? "").trim();
    this.realMoney = String(process.env.NEVERA_REAL_MONEY ?? "false").toLowerCase() === "true";
    this.liveAuthorized = this.mode === "LIVE" && this.realMoney && ((this.provider === "STRIPE" && Boolean(this.apiSecret) && Boolean(this.webhookSecret)) || (this.provider === "MERCADOPAGO" && Boolean(this.mercadoPagoAccessToken) && Boolean(this.mercadoPagoWebhookSecret)));
  }

  status() {
    return {
      mode: this.mode,
      provider: this.provider,
      configured: Boolean(this.apiSecret && this.webhookSecret),
      liveAuthorized: this.liveAuthorized,
      realMoney: this.realMoney,
      mercadoPagoConfigured: Boolean(this.mercadoPagoAccessToken && this.mercadoPagoWebhookSecret),
      checkout: this.liveAuthorized ? "READY" : "DISABLED"
    };
  }

  async createCheckout({ paymentId, offerId, amount, currency, title, metadata = {} } = {}) {
    if (!paymentId || !offerId) throw new Error("PAYMENT_DATA_REQUIRED");

    if (!this.liveAuthorized) {
      throw new Error("LIVE_PAYMENT_NOT_AUTHORIZED");
    }

    if (this.provider === "MERCADOPAGO") {
      const base = this.returnUrl ? this.returnUrl.replace(/\/$/, "") : undefined;
      const response = await fetch(`${MERCADO_PAGO_API}/checkout/preferences`, {
        method: "POST",
        headers: { authorization: `Bearer ${this.mercadoPagoAccessToken}`, "content-type": "application/json" },
        body: JSON.stringify({
          items: [{ id: offerId, title: title || "NEVERA", quantity: 1, unit_price: Number(amount), currency_id: String(currency).toUpperCase() }],
          external_reference: paymentId,
          notification_url: base ? `${base}/webhooks/payments?provider=mercadopago` : undefined,
          back_urls: base ? { success: `${base}/payment/success?payment_id=${encodeURIComponent(paymentId)}`, failure: `${base}/payment/cancel?payment_id=${encodeURIComponent(paymentId)}`, pending: `${base}/payment/success?payment_id=${encodeURIComponent(paymentId)}` } : undefined,
          metadata: { neveraPaymentId: paymentId, neveraOfferId: offerId, channel: metadata.channel, market: metadata.market, capitalFunding: Boolean(metadata.capitalFunding) }
        })
      });
      if (!response.ok) { const detail = await response.text(); throw new Error(`MERCADO_PAGO_CHECKOUT_HTTP_${response.status}:${detail.slice(0, 300)}`); }
      const payload = await response.json();
      return { mode: "LIVE", provider: "MERCADOPAGO", paymentId, status: "CHECKOUT_CREATED", checkoutUrl: payload.init_point ?? null, providerPaymentId: payload.id ?? null };
    }
    if (this.provider !== "STRIPE") throw new Error("UNSUPPORTED_PAYMENT_PROVIDER");

    const successUrl = this.returnUrl
      ? `${this.returnUrl.replace(/\/$/, "")}/payment/success?payment_id=${encodeURIComponent(paymentId)}`
      : undefined;
    const cancelUrl = this.returnUrl
      ? `${this.returnUrl.replace(/\/$/, "")}/payment/cancel?payment_id=${encodeURIComponent(paymentId)}`
      : undefined;

    const params = formEncode([
      ["mode", "payment"],
      ["payment_method_types[0]", "card"],
      ["success_url", successUrl],
      ["cancel_url", cancelUrl],
      ["line_items[0][price_data][currency]", String(currency).toLowerCase()],
      ["line_items[0][price_data][product_data][name]", title || "NEVERA"],
      ["line_items[0][price_data][unit_amount]", stripeAmount(amount, currency)],
      ["line_items[0][quantity]", 1],
      ["metadata[neveraPaymentId]", paymentId],
      ["metadata[neveraOfferId]", offerId],
      ["payment_intent_data[metadata][neveraPaymentId]", paymentId],
      ["payment_intent_data[metadata][neveraOfferId]", offerId],
      ["payment_intent_data[metadata][channel]", metadata.channel],
      ["payment_intent_data[metadata][market]", metadata.market],
      ["metadata[channel]", metadata.channel],
      ["metadata[market]", metadata.market],
      ["metadata[capitalFunding]", metadata.capitalFunding ? "true" : undefined],
      ["payment_intent_data[metadata][capitalFunding]", metadata.capitalFunding ? "true" : undefined]
    ]);

    const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: "POST",
      headers: stripeHeaders(this.apiSecret),
      body: params
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`STRIPE_CHECKOUT_HTTP_${response.status}:${detail.slice(0, 300)}`);
    }

    const payload = await response.json();
    return {
      mode: "LIVE",
      provider: "STRIPE",
      paymentId,
      status: "CHECKOUT_CREATED",
      checkoutUrl: payload.url ?? null,
      providerPaymentId: payload.id ?? null
    };
  }

  verifyWebhook(rawBody, signature, context = {}) {
    if (this.provider === "MERCADOPAGO") {
      if (!this.mercadoPagoWebhookSecret || !signature) return false;
      const parts = Object.fromEntries(String(signature).split(",").map((part) => part.split("=", 2)).filter(([k,v]) => k && v).map(([k,v]) => [k.trim(), v.trim()]));
      const ts = parts.ts;
      const supplied = parts.v1;
      const requestUrl = new URL(context.url ?? "/", "https://nevera.local");
      const dataId = (requestUrl.searchParams.get("data.id") ?? "").toLowerCase();
      const requestId = String(context.requestId ?? "");
      if (!ts || !supplied || !dataId || !requestId) return false;
      const age = Math.abs(Date.now() - Number(ts) * 1000);
      if (!Number.isFinite(age) || age > 300000) return false;
      const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
      const expected = createHmac("sha256", this.mercadoPagoWebhookSecret).update(manifest).digest("hex");
      if (supplied.length !== expected.length) return false;
      return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
    }
    if (!this.webhookSecret || !signature) return false;

    const header = String(signature);
    const parts = Object.fromEntries(
      header.split(",").map((part) => {
        const [key, ...rest] = part.split("=");
        return [key, rest.join("=")];
      }).filter(([key, value]) => key && value)
    );
    const timestamp = parts.t;
    const signatures = header
      .split(",")
      .filter((part) => part.startsWith("v1="))
      .map((part) => part.slice(3));

    if (!timestamp || !signatures.length) return false;
    const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
    if (!Number.isFinite(age) || age > 300) return false;

    const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
    const expected = createHmac("sha256", this.webhookSecret).update(signedPayload).digest("hex");

    return signatures.some((supplied) => {
      if (supplied.length !== expected.length) return false;
      return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
    });
  }

  async parseWebhook(rawBody) {
    const event = JSON.parse(rawBody.toString("utf8"));
    if (this.provider === "MERCADOPAGO") {
      const providerPaymentId = event.data?.id ?? event.id ?? null;
      if (!providerPaymentId) return { paymentId: null, status: "IGNORED", eventType: String(event.type ?? ""), providerPaymentId: null };
      const response = await fetch(`${MERCADO_PAGO_API}/v1/payments/${encodeURIComponent(providerPaymentId)}`, { headers: { authorization: `Bearer ${this.mercadoPagoAccessToken}` } });
      if (!response.ok) throw new Error(`MERCADO_PAGO_PAYMENT_HTTP_${response.status}`);
      const payment = await response.json();
      const status = String(payment.status ?? "").toLowerCase();
      return {
        paymentId: payment.external_reference ?? payment.metadata?.neveraPaymentId ?? null,
        status: status === "approved" ? "SUCCEEDED" : status.toUpperCase(),
        gross: payment.transaction_amount ?? null,
        fees: payment.fee_details?.reduce((sum, item) => sum + Number(item.amount ?? 0), 0) ?? 0,
        currency: payment.currency_id ?? "BRL",
        providerPaymentId: String(providerPaymentId),
        eventType: String(event.type ?? "payment"),
        capitalFunding: Boolean(payment.metadata?.capitalFunding)
      };
    }
    const type = String(event.type ?? "").toLowerCase();
    const object = event.data?.object ?? {};
    return {
      paymentId: object.metadata?.neveraPaymentId ?? object.metadata?.paymentId ?? event.metadata?.neveraPaymentId ?? null,
      status: type === "payment_intent.succeeded" || type === "checkout.session.completed" ? "SUCCEEDED" : type.toUpperCase(),
      gross: object.amount_received ?? object.amount_total ?? object.amount ?? null,
      fees: 0,
      currency: object.currency ?? null,
      providerPaymentId: object.id ?? event.id ?? null,
      eventType: type,
      capitalFunding: String(object.metadata?.capitalFunding ?? event.metadata?.capitalFunding ?? "") === "true"
    };
  }
}
