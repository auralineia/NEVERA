export class Economy {
  constructor(initialBalance = 10) {
    if (!Number.isFinite(initialBalance) || initialBalance < 0) {
      throw new Error("Invalid initial balance");
    }

    this.balance = Number(initialBalance.toFixed(2));
    this.revenue = 0;
    this.expenses = 0;
    this.transactions = [];
  }

  credit(amount, reason = "revenue") {
    this.#validateAmount(amount);
    this.balance = Number((this.balance + amount).toFixed(2));
    this.revenue = Number((this.revenue + amount).toFixed(2));
    this.#record("CREDIT", amount, reason);
  }

  debit(amount, reason = "expense") {
    this.#validateAmount(amount);

    if (amount > this.balance) {
      throw new Error("Insufficient balance");
    }

    this.balance = Number((this.balance - amount).toFixed(2));
    this.expenses = Number((this.expenses + amount).toFixed(2));
    this.#record("DEBIT", amount, reason);
  }

  isDead() {
    return this.balance <= 0;
  }

  summary() {
    return {
      balance: this.balance,
      revenue: this.revenue,
      expenses: this.expenses,
      net: Number((this.revenue - this.expenses).toFixed(2)),
      transactions: this.transactions.length
    };
  }

  #validateAmount(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
  }

  #record(type, amount, reason) {
    this.transactions.push({
      timestamp: new Date().toISOString(),
      type,
      amount,
      reason,
      balance: this.balance
    });
  }
}
