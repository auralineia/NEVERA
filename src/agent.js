export class NeveraAgent {
  constructor(nevera, brain, tools, strategy, market, simulator, learning, creator, evaluator) {
    this.nevera = nevera;
    this.brain = brain;
    this.tools = tools;
    this.strategy = strategy;
    this.market = market;
    this.simulator = simulator;
    this.learning = learning;
    this.creator = creator;
    this.evaluator = evaluator;
  }

  async cycle() {
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

    const candidates = this.market.available()
      .map((opportunity) => ({
        opportunity,
        evaluation: this.evaluator(opportunity, state.economy.balance)
      }))
      .filter((item) => item.evaluation.viable);

    const choice = this.strategy(
      candidates.map((item) => item.opportunity),
      state.economy.balance,
      this.learning
    );

    if (!choice) {
      const result = { status: "NO_VIABLE_OPPORTUNITY" };
      this.nevera.log("MARKET_RESULT", result);
      return {
        decision,
        createdOpportunity: created,
        createdEvaluation,
        candidates,
        result
      };
    }

    const selectedEvaluation = candidates.find(
      (item) => item.opportunity.name === choice.opportunity.name
    )?.evaluation;

    this.nevera.log("CAPITAL_DECISION", {
      selected: choice.opportunity.name,
      score: choice.score,
      evaluation: selectedEvaluation
    });

    const research = await this.tools.execute("research_opportunity", {
      idea: choice.opportunity.name
    });

    const outcome = this.simulator(choice.opportunity);

    if (outcome.cost > 0) {
      this.nevera.spend(outcome.cost, `simulated: ${choice.opportunity.name}`);
    }

    if (outcome.revenue > 0) {
      this.nevera.earn(outcome.revenue, `simulated: ${choice.opportunity.name}`);
    }

    this.learning.record(choice.opportunity, outcome);
    this.brain.remember(choice.opportunity.name, outcome);

    this.nevera.log("MARKET_RESULT", {
      opportunity: choice.opportunity,
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
      selectedEvaluation,
      action: {
        tool: "research_opportunity",
        research,
        outcome
      },
      learning: this.learning.stats()
    };
  }
}
