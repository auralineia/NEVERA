export class ApplicationPolicy {
  constructor({
    automationEnabled = false,
    maxApplicationsPerDay = 10,
    minScore = 70,
    allowedDomains = []
  } = {}) {
    this.automationEnabled = Boolean(automationEnabled);
    this.maxApplicationsPerDay = Math.max(0, Number(maxApplicationsPerDay));
    this.minScore = Math.max(0, Number(minScore));
    this.allowedDomains = new Set(allowedDomains.map((v) => String(v).trim().toLowerCase()).filter(Boolean));
  }

  canSubmit({ score = 0, url = null, submittedToday = 0 } = {}) {
    if (!this.automationEnabled) return { allowed: false, reason: "AUTOMATION_DISABLED" };
    if (Number(score) < this.minScore) return { allowed: false, reason: "SCORE_BELOW_THRESHOLD" };
    if (Number(submittedToday) >= this.maxApplicationsPerDay) return { allowed: false, reason: "DAILY_APPLICATION_LIMIT" };
    if (url) {
      try {
        const hostname = new URL(url).hostname.toLowerCase();
        if (this.allowedDomains.size && ![...this.allowedDomains].some((d) => hostname === d || hostname.endsWith("." + d))) {
          return { allowed: false, reason: "DOMAIN_NOT_ALLOWED" };
        }
      } catch {
        return { allowed: false, reason: "INVALID_URL" };
      }
    }
    return { allowed: true };
  }

  snapshot() {
    return {
      automationEnabled: this.automationEnabled,
      maxApplicationsPerDay: this.maxApplicationsPerDay,
      minScore: this.minScore,
      allowedDomains: [...this.allowedDomains]
    };
  }
}
