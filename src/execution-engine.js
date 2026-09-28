import { ResourceManager } from "./resource-manager.js";

export class ExecutionEngine {
  constructor({ capabilities = ["RESEARCH", "SERVICE", "PRODUCT", "ARBITRAGE", "EMERGING"], maxSteps = 8, resources = null } = {}) {
    this.capabilities = new Set(capabilities);
    this.maxSteps = maxSteps;
    this.resourceManager = resources instanceof ResourceManager ? resources : new ResourceManager(resources ?? undefined);
  }

  beginCycle() {
    return this.resourceManager.beginCycle();
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

  async executeBatch(opportunities = []) {
    const plans = opportunities.map((opportunity) => ({
      opportunity,
      plan: this.plan(opportunity)
    }));

    const valid = plans.filter((item) => item.plan.supported);
    const results = opportunities.map((opportunity) => ({
      status: "REJECTED",
      reason: "NO_EXECUTABLE_OPPORTUNITIES",
      category: opportunity?.category ?? "RESEARCH"
    }));

    if (!valid.length) return results;

    const reserved = this.resourceManager.reserveBatch(
      valid.map((item) => item.plan.requiredResources)
    );

    if (!reserved) {
      return opportunities.map((opportunity) => ({
        status: "REJECTED",
        reason: "RESOURCE_BATCH_UNAVAILABLE",
        category: opportunity?.category ?? "RESEARCH"
      }));
    }

    const executed = await Promise.all(valid.map(async ({ opportunity, plan }) => {
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
        steps,
        resourcesUsed: plan.requiredResources
      };
    }));

    for (let index = 0; index < valid.length; index += 1) {
      const originalIndex = opportunities.indexOf(valid[index].opportunity);
      results[originalIndex] = executed[index];
    }

    return results;
  }

  releaseResources(resources = []) {
    return this.resourceManager.release(resources);
  }

  releaseExecution(execution) {
    return this.releaseResources(execution?.resourcesUsed ?? []);
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
    const reserved = this.resourceManager.reserve(plan.requiredResources);

    if (!reserved) {
      return {
        status: "REJECTED",
        reason: "RESOURCE_UNAVAILABLE",
        category: plan.category,
        output: null,
        deliverable: null,
        actualCost: 0,
        duration: 0,
        steps: []
      };
    }

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
      steps,
      resourcesUsed: plan.requiredResources
    };
  }

  #stepsFor(category) {
    const map = {
      RESEARCH: ["interpret_request", "collect_public_evidence", "synthesize_findings", "prepare_report"],
      SERVICE: ["interpret_request", "prepare_execution_plan", "perform_verifiable_service", "validate_result", "prepare_delivery"],
      PRODUCT: ["define_scope", "build_verifiable_product", "validate_product", "prepare_delivery"],
      ARBITRAGE: ["scan_price_discrepancy", "validate_public_route", "validate_spread", "prepare_delivery"],
      EMERGING: ["interpret_request", "explore_new_demand", "build_verifiable_solution", "validate_result", "prepare_delivery"]
    };

    return map[category] ?? [];
  }

  #resourcesFor(category) {
    const map = {
      RESEARCH: ["public_research"],
      SERVICE: ["verifiable_service"],
      PRODUCT: ["deliverable_builder"],
      ARBITRAGE: ["public_price_analysis"],
      EMERGING: ["public_task_executor"]
    };

    return map[category] ?? [];
  }

  #deliverableType(category) {
    return {
      RESEARCH: "REPORT",
      SERVICE: "SERVICE_RESULT",
      PRODUCT: "DIGITAL_PRODUCT",
      ARBITRAGE: "ARBITRAGE_RESULT",
      EMERGING: "EXPERIMENTAL_DELIVERABLE"
    }[category] ?? "UNKNOWN";
  }

  #buildOutput(opportunity, steps) {
    return [
      `Task: ${opportunity.name}`,
      `Category: ${opportunity.category}`,
      `Execution steps completed: ${steps.length}`,
      "Result generated by NEVERA from the available public inputs; payment remains pending until a real provider confirms it."
    ].join("\n");
  }
}
