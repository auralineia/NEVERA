export class NeveraAgent {
  constructor(nevera, brain, tools, strategy, market) {
    this.nevera = nevera;
    this.brain = brain;
    this.tools = tools;
    this.strategy = strategy;
    this.market = market;
  }

  async cycle() {
    const state = this.nevera.snapshot();
    const decision = this.brain.think(state);

    this.nevera.log("DECISION", decision);

    if (decision.type !== "PROPOSE") {
      return { decision, action: null, opportunity: null };
    }

    const choice = this.strategy(
      this.market.available(),
      state.economy.balance
    );

    if (!choice) {
      const result = { status: "NO_VIABLE_OPPORTUNITY" };
      this.nevera.log("MARKET_RESULT", result);
      return { decision, action: null, opportunity: null, result };
    }

    const result = await this.tools.execute("research_opportunity", {
      idea: choice.opportunity.name
    });

    this.brain.remember(choice.opportunity.name, result);

    this.nevera.log("MARKET_CHOICE", {
      opportunity: choice.opportunity,
      score: choice.score
    });

    this.nevera.log("TOOL_RESULT", result);

    return {
      decision,
      opportunity: choice.opportunity,
      score: choice.score,
      action: {
        tool: "research_opportunity",
        result
      }
    };
  }
}
