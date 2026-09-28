export class NeveraAgent {
  constructor(nevera, brain, tools) {
    this.nevera = nevera;
    this.brain = brain;
    this.tools = tools;
  }

  async cycle() {
    const state = this.nevera.snapshot();
    const decision = this.brain.think(state);

    this.nevera.log("DECISION", decision);

    if (decision.type !== "PROPOSE") {
      return { decision, action: null };
    }

    const result = await this.tools.execute("research_opportunity", {
      idea: decision.objective
    });

    this.brain.remember(decision.objective, result);
    this.nevera.log("TOOL_RESULT", result);

    return {
      decision,
      action: {
        tool: "research_opportunity",
        result
      }
    };
  }
}
