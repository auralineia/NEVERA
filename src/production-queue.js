export class ProductionQueue {
  constructor(priorityScorer = null) {
    this.items = [];
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
    this.enqueue(items);
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
