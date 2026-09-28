export class Telemetry {
  constructor() {
    this.events = [];
  }

  record(type, data = {}) {
    this.events.push({
      timestamp: new Date().toISOString(),
      type,
      ...data
    });
  }

  counters() {
    const counts = {};
    for (const event of this.events) counts[event.type] = (counts[event.type] ?? 0) + 1;
    return counts;
  }

  snapshot() {
    return {
      events: this.events.slice(-1000),
      counters: this.counters()
    };
  }
}
