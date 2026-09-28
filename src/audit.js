export class AuditTrail {
  constructor(entries = []) {
    this.entries = Array.isArray(entries) ? entries : [];
  }

  record(event, data = {}) {
    this.entries.push({
      id: this.entries.length + 1,
      event,
      data,
      timestamp: new Date().toISOString()
    });
  }

  recent(limit = 20) {
    return this.entries.slice(-limit);
  }

  export() {
    return this.entries.slice();
  }
}
