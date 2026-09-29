function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
}

export class RealCapital {
  constructor(saved = {}) {
    this.currency = "BRL";
    this.balance = money(saved.balance ?? 0);
    this.totalFunded = money(saved.totalFunded ?? 0);
    this.totalSpent = money(saved.totalSpent ?? 0);
    this.totalReturned = money(saved.totalReturned ?? 0);
    this.transactions = Array.isArray(saved.transactions) ? saved.transactions : [];
  }

  fund(amount, reference = "EXTERNAL_FUNDING") {
    const value = money(amount);
    if (value <= 0) throw new Error("INVALID_REAL_CAPITAL_AMOUNT");
    this.balance = money(this.balance + value);
    this.totalFunded = money(this.totalFunded + value);
    this.transactions.push({
      type: "FUNDING",
      amount: value,
      currency: this.currency,
      reference: String(reference),
      verified: false,
      recordedAt: new Date().toISOString()
    });
    return this.snapshot();
  }

  spend(amount, reference = "OPERATION") {
    const value = money(amount);
    if (value <= 0) throw new Error("INVALID_REAL_CAPITAL_AMOUNT");
    if (value > this.balance) throw new Error("REAL_CAPITAL_INSUFFICIENT");
    this.balance = money(this.balance - value);
    this.totalSpent = money(this.totalSpent + value);
    this.transactions.push({
      type: "SPEND",
      amount: value,
      currency: this.currency,
      reference: String(reference),
      recordedAt: new Date().toISOString()
    });
    return this.snapshot();
  }

  receive(amount, reference = "REVENUE") {
    const value = money(amount);
    if (value <= 0) throw new Error("INVALID_REAL_CAPITAL_AMOUNT");
    this.balance = money(this.balance + value);
    this.totalReturned = money(this.totalReturned + value);
    this.transactions.push({
      type: "REVENUE",
      amount: value,
      currency: this.currency,
      reference: String(reference),
      recordedAt: new Date().toISOString()
    });
    return this.snapshot();
  }

  snapshot() {
    return {
      currency: this.currency,
      balance: this.balance,
      totalFunded: this.totalFunded,
      totalSpent: this.totalSpent,
      totalReturned: this.totalReturned,
      fundingStatus: this.balance > 0 ? "FUNDED_LEDGER" : "AWAITING_REAL_FUNDING",
      transactions: this.transactions.slice(-100)
    };
  }
}
