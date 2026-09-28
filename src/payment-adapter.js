import { createHmac, timingSafeEqual } from "node:crypto";

const STRIPE_API = "https://api.stripe.com/v1";

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
    this.returnUrl = String(process.env.NEVERA_PAYMENT_RETURN_URL ?? "").trim();
    this.realMoney = String(process.env.NEVERA_REAL_MONEY ?? "false").toLowerCase() === "true";
    this.liveAuthorized = this.provider === "STRIPE"
      && this.mode === "LIVE"
      && this.realMoney
      && Boolean(this.apiSecret)
      && Boolean(this.webhookSecret);
  }

  status() {
    return {
      mode: this.mode,
      provider: this.provider,
      configured: Boolean(this.apiSecret && this.webhookSecret),
      liveAuthorized: this.liveAuthorized,
      realMoney: this.realMoney,
      checkout: this.liveAuthorized ? "READY" : "DISABLED"
    };
  }

  async createCheckout({ paymentId, offerId, amount, currency, title, metadata = {} } = {}) {
    if (!paymentId || !offerId) throw new Error("PAYMENT_DATA_REQUIRED");

    if (!this.liveAuthorized) {
      return {
        mode: "SIMULATION",
        provider: this.provider,
        paymentId,
        checkoutUrl: `/pay/${encodeURIComponent(paymentId)}`,
        status: "SIMULATED_CHECKOUT"
      };
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
      ["success_url", successUrl],
      ["cancel_url", cancelUrl],
      ["line_items[0][price_data][currency]", String(currency).toLowerCase()],
      ["line_items[0][price_data][product_data][name]", title || "NEVERA"],
      ["line_items[0][price_data][unit_amount]", stripeAmount(amount, currency)],
      ["line_items[0][quantity]", 1],
      ["metadata[neveraPaymentId]", paymentId],
      ["metadata[neveraOfferId]", offerId],
      ["metadata[channel]", metadata.channel],
      ["metadata[market]", metadata.market]
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

  verifyWebhook(rawBody, signature) {
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

  parseWebhook(rawBody) {
    const event = JSON.parse(rawBody.toString("utf8"));
    const type = String(event.type ?? "").toLowerCase();
    const object = event.data?.object ?? {};

    return {
      paymentId: object.metadata?.neveraPaymentId
        ?? object.metadata?.paymentId
        ?? event.metadata?.neveraPaymentId
        ?? null,
      status: type === "payment_intent.succeeded" || type === "checkout.session.completed"
        ? "SUCCEEDED"
        : type.toUpperCase(),
      gross: object.amount_received ?? object.amount_total ?? object.amount ?? null,
      fees: 0,
      currency: object.currency ?? null,
      providerPaymentId: object.id ?? event.id ?? null,
      eventType: type
    };
  }
}
