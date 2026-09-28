export class NeveraAgent {
  constructor(nevera, brain, tools, strategy, market, simulator, learning, creator, evaluator, survival, dynamicMarket = null) {
    this.nevera = nevera;
    this.brain = brain;
    this.tools = tools;
    this.strategy = strategy;
    this.market = market;
    this.simulator = simulator;
    this.learning = learning;
    this.creator = creator;
    this.evaluator = evaluator;
    this.survival = survival;
    this.dynamicMarket = dynamicMarket;
  }

  async cycle(strategyProfile = null) {
    const state = this.nevera.snapshot();
    const decision = this.brain.think(state);

    this.nevera.log("DECISION", decision);

    if (decision.type !== "PROPOSE") {
      return { decision, action: null, opportunity: null };
    }

    const created = this.creator.createFromMemory(this.learning);
    const createdEvaluation = this.evaluator(created, state.economy.balance);

    this.nevera.log("OPPORTUNITY_EVALUATED", {
      opportunity: created,
      evaluation: createdEvaluation
    });

    if (!createdEvaluation.viable) {
      this.brain.remember(created.name, {
        status: "REJECTED",
        reason: "LOW_VIABILITY",
        evaluation: createdEvaluation
      });
    } else {
      this.market.add(created);
      this.nevera.log("OPPORTUNITY_CREATED", created);
    }

    const marketOpportunities = this.dynamicMarket
      ? this.dynamicMarket.evolve(this.market.available())
      : this.market.available();

    const marketEvent = this.dynamicMarket?.lastEvent ?? null;
    if (marketEvent) {
      this.nevera.log("MARKET_EVENT", marketEvent);
    }

    const marketContexts = [
      ...marketOpportunities.slice(0, 3).map((item) => ({
        demand: item.demand ?? item.marketContext?.demand ?? 1,
        competition: item.competition ?? item.marketContext?.competition ?? 1
      })),
      { demand: 1.2, competition: 0.8 },
      { demand: 0.85, competition: 1.2 }
    ];

    const discovered = this.creator.scan(this.learning, marketContexts);
    const discoveredEvaluations = discovered.map((opportunity) => ({
      opportunity,
      evaluation: this.evaluator(opportunity, state.economy.balance)
    }));

    this.nevera.log("OPPORTUNITY_SCAN", {
      count: discoveredEvaluations.length,
      results: discoveredEvaluations
    });

    for (const item of discoveredEvaluations) {
      if (item.evaluation.viable) {
        this.market.add(item.opportunity);
      }
    }

    const candidates = this.market.available()
      .map((opportunity) => ({
        opportunity,
        evaluation: this.evaluator(opportunity, state.economy.balance),
        survival: this.survival.assess(state.economy.balance, opportunity),
        demandAvailable: this.dynamicMarket
          ? this.dynamicMarket.hasDemand(opportunity)
          : true
      }))
      .filter((item) =>
        item.evaluation.viable &&
        item.survival.allowed &&
        item.demandAvailable
      );

    const choice = this.strategy(
      candidates.map((item) => item.opportunity),
      state.economy.balance,
      this.learning
    );

    if (!choice) {
      const result = { status: "NO_ACTION", reason: "PROTECT_CAPITAL" };
      this.nevera.log("CAPITAL_DECISION", result);
      return { decision, createdOpportunity: created, createdEvaluation, candidates, result };
    }

    const selected = candidates.find(
      (item) => item.opportunity.name === choice.opportunity.name
    );

    this.nevera.log("CAPITAL_DECISION", {
      selected: choice.opportunity.name,
      score: choice.score,
      strategy: strategyProfile?.name ?? "UNSPECIFIED",
      evaluation: selected.evaluation,
      survival: selected.survival
    });

    const research = await this.tools.execute("research_opportunity", {
      idea: choice.opportunity.name
    });

    const executionOpportunity = strategyProfile
      ? {
          ...choice.opportunity,
          estimatedCost: Number(
            (choice.opportunity.estimatedCost * strategyProfile.riskMultiplier).toFixed(2)
          ),
          estimatedRevenue: Number(
            (choice.opportunity.estimatedRevenue * strategyProfile.revenueMultiplier).toFixed(2)
          ),
          risk: Math.min(
            0.95,
            Number((choice.opportunity.risk * strategyProfile.riskMultiplier).toFixed(4))
          )
        }
      : choice.opportunity;

    const executionCheck = this.survival.assess(
      state.economy.balance,
      executionOpportunity
    );

    if (!executionCheck.allowed) {
      const result = {
        status: "NO_ACTION",
        reason: "STRATEGY_EXCEEDS_SURVIVAL_LIMIT",
        executionCheck
      };
      this.nevera.log("CAPITAL_DECISION", result);
      return { decision, createdOpportunity: created, createdEvaluation, candidates, result };
    }

    const outcome = await this.simulator(executionOpportunity);

    if (outcome.cost > 0) {
      this.nevera.spend(outcome.cost, `simulated: ${choice.opportunity.name}`);
    }

    if (outcome.revenue > 0) {
      this.nevera.earn(outcome.revenue, `simulated: ${choice.opportunity.name}`);
    }

    choice.opportunity.status = "CLOSED";
    this.learning.record(choice.opportunity, outcome);
    this.brain.remember(choice.opportunity.name, outcome);

    this.nevera.log("MARKET_RESULT", {
      opportunity: choice.opportunity,
      strategy: strategyProfile?.name ?? "UNSPECIFIED",
      score: choice.score,
      outcome,
      learning: this.learning.stats()
    });

    return {
      decision,
      createdOpportunity: created,
      createdEvaluation,
      candidates,
      opportunity: choice.opportunity,
      score: choice.score,
      selectedEvaluation: selected.evaluation,
      survival: executionCheck,
      strategy: strategyProfile?.name ?? "UNSPECIFIED",
      action: { tool: "research_opportunity", research, outcome },
      marketEvent,
      learning: this.learning.stats()
    };
  }
}
