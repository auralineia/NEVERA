export class ProductionQueue {
  constructor() {
    this.items = [];
  }

  enqueue(items = []) {
    for (const item of items) {
      if (!item?.opportunity) continue;
      this.items.push(item);
    }
    this.#sort();
  }

  #sort() {
    this.items.sort((a, b) => {
      const scoreA = a.choice?.score ?? -Infinity;
      const scoreB = b.choice?.score ?? -Infinity;
      return scoreB - scoreA;
    });
  }

  next(limit = 1) {
    const selected = this.items.splice(0, Math.max(0, limit));
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
      category: item.opportunity?.category ?? null
    }));
  }
}
