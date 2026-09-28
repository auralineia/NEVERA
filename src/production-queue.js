export class ProductionQueue {
  constructor(priorityScorer = null) {
    this.items = [];
    this.completed = 0;
    this.failed = 0;
    this.requeued = 0;
    this.priorityScorer = priorityScorer;
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
    this.requeued += items.length;
    this.enqueue(items);
  }

  recordResult(result) {
    if (result?.action?.outcome?.status === "SUCCESS") this.completed += 1;
    else if (result?.action?.outcome || result?.result?.status === "NO_ACTION") this.failed += 1;
  }

  stats() {
    return {
      queued: this.items.length,
      completed: this.completed,
      failed: this.failed,
      requeued: this.requeued,
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
      category: item.opportunity?.category ?? null
    }));
  }
}
