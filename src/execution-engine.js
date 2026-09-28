export class ExecutionEngine {
  constructor({ capabilities = ["RESEARCH", "SERVICE", "PRODUCT", "EMERGING"], maxSteps = 8 } = {}) {
    this.capabilities = new Set(capabilities);
    this.maxSteps = maxSteps;
  }

  plan(opportunity) {
    const category = opportunity?.category ?? "RESEARCH";
    const supported = this.capabilities.has(category);
    const steps = this.#stepsFor(category);

    return {
      supported,
      category,
      requiredResources: this.#resourcesFor(category),
      steps: steps.slice(0, this.maxSteps),
      estimatedCost: Number((opportunity?.estimatedCost ?? 0).toFixed(2)),
      reason: supported ? "CAPABILITY_AVAILABLE" : "CAPABILITY_UNAVAILABLE"
    };
  }

  async execute(opportunity) {
    const plan = this.plan(opportunity);

    if (!plan.supported) {
      return {
        status: "REJECTED",
        reason: "UNSUPPORTED_CAPABILITY",
        category: plan.category,
        output: null,
        deliverable: null,
        actualCost: 0,
        duration: 0,
        steps: []
      };
    }

    const steps = plan.steps;
    const output = this.#buildOutput(opportunity, steps);

    return {
      status: "SUCCESS",
      category: plan.category,
      output,
      deliverable: {
        type: this.#deliverableType(plan.category),
        title: opportunity.name,
        content: output
      },
      actualCost: plan.estimatedCost,
      duration: steps.length,
      steps
    };
  }

  #stepsFor(category) {
    const map = {
      RESEARCH: ["interpret_request", "collect_simulated_evidence", "synthesize_findings", "prepare_report"],
      SERVICE: ["interpret_request", "prepare_execution_plan", "perform_simulated_service", "validate_result", "prepare_delivery"],
      PRODUCT: ["define_scope", "build_simulated_product", "validate_product", "prepare_delivery"],
      EMERGING: ["interpret_request", "explore_new_demand", "build_simulated_solution", "validate_result", "prepare_delivery"]
    };

    return map[category] ?? [];
  }

  #resourcesFor(category) {
    const map = {
      RESEARCH: ["simulated_research_engine"],
      SERVICE: ["simulated_automation_engine"],
      PRODUCT: ["simulated_product_builder"],
      EMERGING: ["simulated_general_executor"]
    };

    return map[category] ?? [];
  }

  #deliverableType(category) {
    return {
      RESEARCH: "REPORT",
      SERVICE: "SERVICE_RESULT",
      PRODUCT: "DIGITAL_PRODUCT",
      EMERGING: "EXPERIMENTAL_DELIVERABLE"
    }[category] ?? "UNKNOWN";
  }

  #buildOutput(opportunity, steps) {
    return [
      `Task: ${opportunity.name}`,
      `Category: ${opportunity.category}`,
      `Execution steps completed: ${steps.length}`,
      "Result generated inside NEVERA simulation."
    ].join("\n");
  }
}
