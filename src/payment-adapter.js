import { createHmac, timingSafeEqual } from "node:crypto";

function jsonHeaders(secret) {
  return {
    "content-type": "application/json",
    ...(secret ? { authorization: `Bearer ${secret}` } : {})
  };
}

export class PaymentAdapter {
  constructor({ mode = process.env.NEVERA_PAYMENT_MODE ?? "SIMULATION" } = {}) {
    this.mode = String(mode).toUpperCase();
    this.provider = process.env.NEVERA_PAYMENT_PROVIDER ?? "HTTP";
    this.checkoutUrl = String(process.env.NEVERA_PAYMENT_CHECKOUT_URL ?? "").trim();
    this.webhookSecret = String(process.env.NEVERA_PAYMENT_WEBHOOK_SECRET ?? "").trim();
    this.returnUrl = String(process.env.NEVERA_PAYMENT_RETURN_URL ?? "").trim();
    this.realMoney = String(process.env.NEVERA_REAL_MONEY ?? "false").toLowerCase() === "true";
    this.liveAuthorized = this.mode === "LIVE" && this.realMoney && Boolean(this.checkoutUrl) && Boolean(this.webhookSecret);
  }

  status() {
    return {
      mode: this.mode,
      provider: this.provider,
      configured: Boolean(this.checkoutUrl && this.webhookSecret),
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

    const response = await fetch(this.checkoutUrl, {
      method: "POST",
      headers: jsonHeaders(this.webhookSecret),
      body: JSON.stringify({
        paymentId,
        offerId,
        amount,
        currency,
        title,
        returnUrl: this.returnUrl || undefined,
        metadata
      })
    });

    if (!response.ok) throw new Error(`PAYMENT_PROVIDER_HTTP_${response.status}`);
    const payload = await response.json();

    return {
      mode: "LIVE",
      provider: this.provider,
      paymentId,
      status: "CHECKOUT_CREATED",
      checkoutUrl: payload.checkoutUrl ?? payload.url ?? null,
      providerPaymentId: payload.paymentId ?? payload.id ?? null
    };
  }

  verifyWebhook(rawBody, signature) {
    if (!this.webhookSecret) return false;
    const expected = createHmac("sha256", this.webhookSecret).update(rawBody).digest("hex");
    const supplied = String(signature ?? "").replace(/^sha256=/, "");
    if (!supplied || supplied.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
  }

  parseWebhook(rawBody) {
    const body = JSON.parse(rawBody);
    return {
      paymentId: body.paymentId ?? body.payment_id ?? body.metadata?.paymentId ?? null,
      status: String(body.status ?? body.event ?? "").toUpperCase(),
      gross: body.gross ?? body.amount ?? null,
      fees: body.fees ?? body.fee ?? 0,
      currency: body.currency ?? null,
      providerPaymentId: body.providerPaymentId ?? body.id ?? null
    };
  }
}
