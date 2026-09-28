export class ResourceManager {
  constructor(initialResources = {
    simulated_research_engine: 3,
    simulated_automation_engine: 3,
    simulated_product_builder: 2,
    simulated_general_executor: 2
  }) {
    this.resources = { ...initialResources };
  }

  available(resource) {
    return (this.resources[resource] ?? 0) > 0;
  }

  canReserve(resources = []) {
    return resources.every((resource) => this.available(resource));
  }

  reserve(resources = []) {
    if (!this.canReserve(resources)) return false;
    for (const resource of resources) {
      this.resources[resource] -= 1;
    }
    return true;
  }

  replenish(resource, amount = 1) {
    if (amount < 0) throw new Error("amount must be non-negative");
    this.resources[resource] = (this.resources[resource] ?? 0) + amount;
  }

  snapshot() {
    return { ...this.resources };
  }
}
