export class LongTermMemory {
  constructor(entries = [], limit = 500) {
    this.entries = Array.isArray(entries) ? entries : [];
    this.limit = limit;
  }

  remember(type, data = {}) {
    this.entries.push({ type, data, timestamp: new Date().toISOString() });
    if (this.entries.length > this.limit) this.entries.shift();
  }

  recall(type = null) {
    return type ? this.entries.filter((entry) => entry.type === type) : this.entries.slice();
  }

  summarize(type = null) {
    const entries = this.recall(type);
    return { count: entries.length, last: entries.at(-1) ?? null };
  }

  export() { return this.entries.slice(); }
}
