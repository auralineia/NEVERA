export class OpportunityDiscovery {
  constructor({ sandbox, sources = [] } = {}) {
    this.sandbox = sandbox;
    this.sources = sources;
  }

  async scan() {
    const results = [];
    for (const source of this.sources) {
      try {
        const result = await this.sandbox.fetchPublic(source.url);
        results.push({
          source: source.name,
          url: source.url,
          status: result.ok ? "AVAILABLE" : "UNAVAILABLE",
          signal: source.signal ?? "PUBLIC_DATA",
          bytes: result.bytes
        });
      } catch (error) {
        results.push({
          source: source.name,
          url: source.url,
          status: "FAILED",
          reason: error.message
        });
      }
    }
    return results;
  }
}
