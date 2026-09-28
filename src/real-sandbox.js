const ALLOWED_PROTOCOLS = new Set(["https:"]);

export class RealSandbox {
  constructor({ allowDomains = [], timeoutMs = 8000, killSwitch = false } = {}) {
    this.allowDomains = new Set(allowDomains);
    this.timeoutMs = timeoutMs;
    this.killSwitch = Boolean(killSwitch);
    this.actions = [];
  }

  canAccess(url) {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.has(parsed.protocol) &&
      (this.allowDomains.size === 0 || this.allowDomains.has(parsed.hostname));
  }

  async fetchPublic(url) {
    if (this.killSwitch) throw new Error("KILL_SWITCH");
    if (!this.canAccess(url)) throw new Error("DOMAIN_NOT_ALLOWED");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "error",
        signal: controller.signal,
        headers: { "user-agent": "NEVERA-Sandbox/0.1" }
      });
      const body = await response.text();
      const result = {
        type: "PUBLIC_FETCH",
        url,
        status: response.status,
        ok: response.ok,
        bytes: Buffer.byteLength(body),
        preview: body.slice(0, 500)
      };
      this.actions.push({ ...result, timestamp: new Date().toISOString() });
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  snapshot() {
    return { actions: [...this.actions] };
  }
}
