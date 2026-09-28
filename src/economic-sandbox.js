const PROFILES = {
  STABLE: { demand: 1, competition: 1, volatility: 0.05 },
  RECESSION: { demand: 0.65, competition: 1.25, volatility: 0.15 },
  BOOM: { demand: 1.35, competition: 0.85, volatility: 0.12 },
  SHOCK: { demand: 0.8, competition: 1.45, volatility: 0.35 }
};

export class EconomicSandbox {
  constructor({ regime = "STABLE", seed = 42 } = {}) {
    this.regime = PROFILES[regime] ? regime : "STABLE";
    this.seed = seed;
    this.tick = 0;
  }

  setRegime(regime) {
    if (PROFILES[regime]) this.regime = regime;
  }

  step(opportunity, random = Math.random) {
    this.tick += 1;
    const profile = PROFILES[this.regime];
    const demandFactor = Math.max(0.3, profile.demand + (random() - 0.5) * profile.volatility);
    const competitionFactor = Math.max(0.5, profile.competition + (random() - 0.5) * profile.volatility);
    const successProbability = Math.max(0.05, Math.min(0.95,
      (1 - Number(opportunity.risk ?? 0)) * demandFactor / competitionFactor
    ));
    const success = random() < successProbability;
    const revenue = success ? Number((Number(opportunity.estimatedRevenue ?? 0) * demandFactor / competitionFactor).toFixed(2)) : 0;
    const cost = Number((Number(opportunity.estimatedCost ?? 0) * (1 + profile.volatility * random())).toFixed(2));
    return {
      status: success ? "SUCCESS" : "FAILURE",
      revenue,
      cost,
      net: Number((revenue - cost).toFixed(2)),
      regime: this.regime,
      successProbability: Number(successProbability.toFixed(4))
    };
  }

  snapshot() { return { regime: this.regime, seed: this.seed, tick: this.tick }; }
}

export function sandboxProfiles() { return Object.keys(PROFILES); }
