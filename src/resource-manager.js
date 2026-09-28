export class ResourceManager {
  constructor(initialResources = {
    simulated_research_engine: 3,
    simulated_automation_engine: 3,
    simulated_product_builder: 2,
    simulated_general_executor: 2
  }) {
    this.capacity = { ...initialResources };
    this.resources = { ...initialResources };
  }

  available(resource) {
    return (this.resources[resource] ?? 0) > 0;
  }

  canReserve(resources = []) {
    const needed = {};
    for (const resource of resources) needed[resource] = (needed[resource] ?? 0) + 1;
    return Object.entries(needed).every(
      ([resource, amount]) => (this.resources[resource] ?? 0) >= amount
    );
  }

  reserve(resources = []) {
    if (!this.canReserve(resources)) return false;
    for (const resource of resources) this.resources[resource] -= 1;
    return true;
  }

  reserveBatch(resourceGroups = []) {
    const flattened = resourceGroups.flatMap((group) => group ?? []);
    if (!this.canReserve(flattened)) return false;
    return this.reserve(flattened);
  }

  release(resources = []) {
    for (const resource of resources) {
      const max = this.capacity[resource] ?? Number.POSITIVE_INFINITY;
      this.resources[resource] = Math.min(max, (this.resources[resource] ?? 0) + 1);
    }
    return this.snapshot();
  }

  releaseBatch(resourceGroups = []) {
    return this.release(resourceGroups.flatMap((group) => group ?? []));
  }

  replenish(resource, amount = 1) {
    if (amount < 0) throw new Error("amount must be non-negative");
    const max = this.capacity[resource] ?? Number.POSITIVE_INFINITY;
    this.resources[resource] = Math.min(max, (this.resources[resource] ?? 0) + amount);
  }

  beginCycle() {
    this.resources = { ...this.capacity };
    return this.snapshot();
  }

  snapshot() {
    return { ...this.resources };
  }

  capacitySnapshot() {
    return { ...this.capacity };
  }
}
