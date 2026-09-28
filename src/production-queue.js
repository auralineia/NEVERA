export class ProductionQueue {
  constructor(priorityScorer = null, {
    items = [],
    completed = 0,
    failed = 0,
    requeued = 0,
    maxRetries = 2
  } = {}) {
    this.items = Array.isArray(items) ? items : [];
    this.completed = completed;
    this.failed = failed;
    this.requeued = requeued;
    this.maxRetries = maxRetries;
    this.priorityScorer = priorityScorer;
    this.#sort();
  }

  enqueue(items = []) {
    const existing = new Set(
      this.items.map((item) => item.opportunity?.name).filter(Boolean)
    );

    for (const item of items) {
      const name = item?.opportunity?.name;
      if (!name || item.opportunity.status === "CLOSED" || existing.has(name)) continue;

      const prepared = this.priorityScorer
        ? { ...item, priorityScore: this.priorityScorer(item) }
        : item;

      this.items.push(prepared);
      existing.add(name);
    }

    this.#sort();
  }

  #sort() {
    this.items.sort((a, b) => {
      const scoreA = a.priorityScore ?? a.choice?.score ?? -Infinity;
      const scoreB = b.priorityScore ?? b.choice?.score ?? -Infinity;
      return scoreB - scoreA;
    });
  }

  next(limit = 1) {
    const selected = [];
    const max = Math.max(0, limit);

    while (selected.length < max && this.items.length) {
      const item = this.items.shift();
      if (item?.opportunity?.status === "CLOSED") continue;
      selected.push(item);
    }

    return selected;
  }

  requeue(items = []) {
    const retryable = [];

    for (const item of items) {
      const retries = item?.retryCount ?? 0;
      if (retries >= this.maxRetries || item?.opportunity?.status === "CLOSED") continue;
      retryable.push({
        ...item,
        retryCount: retries + 1,
        priorityScore: (item.priorityScore ?? item.choice?.score ?? 0) * 0.9
      });
    }

    this.requeued += retryable.length;
    this.enqueue(retryable);
    return retryable;
  }

  recordResult(result) {
    if (result?.action?.outcome?.status === "SUCCESS") {
      this.completed += 1;
    } else if (result?.action?.outcome || result?.result?.status === "NO_ACTION") {
      this.failed += 1;
    }
  }

  stats() {
    return {
      queued: this.items.length,
      completed: this.completed,
      failed: this.failed,
      requeued: this.requeued,
      maxRetries: this.maxRetries,
      throughput: this.completed + this.failed
        ? Number((this.completed / (this.completed + this.failed)).toFixed(4))
        : 0
    };
  }

  size() {
    return this.items.length;
  }

  snapshot() {
    return this.items.map((item) => ({
      name: item.opportunity?.name ?? null,
      score: item.choice?.score ?? null,
      priorityScore: item.priorityScore ?? null,
      category: item.opportunity?.category ?? null,
      retryCount: item.retryCount ?? 0
    }));
  }
}