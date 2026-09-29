export class PlatformAdapter {
  constructor({ name, domains = [], browser = null } = {}) {
    this.name = name ?? "generic";
    this.domains = new Set(domains.map((v) => String(v).trim().toLowerCase()).filter(Boolean));
    this.browser = browser;
  }

  supports(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return this.domains.size === 0 || [...this.domains].some((domain) => hostname === domain || hostname.endsWith("." + domain));
    } catch {
      return false;
    }
  }

  async inspect(session, url) {
    if (!this.browser) throw new Error("BROWSER_WORKER_NOT_CONFIGURED");
    if (!this.supports(url)) throw new Error("PLATFORM_DOMAIN_NOT_SUPPORTED");
    return {
      platform: this.name,
      ...(await this.browser.navigate(session, url)),
      snapshot: await this.browser.snapshot(session)
    };
  }

  async prepareApplication({ session, url, proposal, proposalSelector, submitSelector }) {
    if (!this.browser) throw new Error("BROWSER_WORKER_NOT_CONFIGURED");
    if (!this.supports(url)) throw new Error("PLATFORM_DOMAIN_NOT_SUPPORTED");
    await this.browser.navigate(session, url);
    if (proposalSelector) await this.browser.fill(session, proposalSelector, proposal ?? "");
    return {
      platform: this.name,
      ready: true,
      submitted: false,
      submitSelector: submitSelector ?? null
    };
  }

  async submitApplication({ session, submitSelector }) {
    if (!this.browser) throw new Error("BROWSER_WORKER_NOT_CONFIGURED");
    if (!submitSelector) throw new Error("SUBMIT_SELECTOR_MISSING");
    await this.browser.click(session, submitSelector);
    return { platform: this.name, submitted: true };
  }
}

export function createPlatformRegistry({ browser, definitions = [] } = {}) {
  return definitions.reduce((registry, definition) => {
    const adapter = new PlatformAdapter({ ...definition, browser });
    registry.set(adapter.name, adapter);
    return registry;
  }, new Map());
}
