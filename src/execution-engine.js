import { ResourceManager } from "./resource-manager.js";

export class ExecutionEngine {
  constructor({ capabilities = ["RESEARCH", "SERVICE", "PRODUCT", "EMERGING"], maxSteps = 8, resources = null } = {}) {
    this.capabilities = new Set(capabilities);
    this.maxSteps = maxSteps;
    this.resourceManager = resources instanceof ResourceManager ? resources : new ResourceManager(resources ?? undefined);
  }

  plan(opportunity) {
    const category = opportunity?.category ?? "RESEARCH";
    const supported = this.capabilities.has(category);
    const steps = this.#stepsFor(category);
    const requiredResources = this.#resourcesFor(category);
    const resourcesAvailable = this.resourceManager.canReserve(requiredResources);

    return {
      supported: supported && resourcesAvailable,
      category,
      requiredResources,
      steps: steps.slice(0, this.maxSteps),
      estimatedCost: Number((opportunity?.estimatedCost ?? 0).toFixed(2)),
      reason: !supported ? "CAPABILITY_UNAVAILABLE" : !resourcesAvailable ? "RESOURCE_UNAVAILABLE" : "CAPABILITY_AVAILABLE"
    };
  }

  async execute(opportunity) {
    const plan = this.plan(opportunity);

    if (!plan.supported) {
      return {
        status: "REJECTED",
        reason: plan.reason,
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
    this.resourceManager.reserve(plan.requiredResources);

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
