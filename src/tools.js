export class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  register(name, description, handler) {
    if (!name || typeof handler !== "function") {
      throw new Error("Invalid tool");
    }

    this.tools.set(name, {
      name,
      description,
      handler
    });
  }

  list() {
    return [...this.tools.values()].map(({ name, description }) => ({
      name,
      description
    }));
  }

  async execute(name, input = {}) {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    return tool.handler(input);
  }
}

export function createSimulationTools() {
  const registry = new ToolRegistry();

  registry.register(
    "research_opportunity",
    "Analisa uma oportunidade de receita em modo simulado.",
    async ({ idea }) => ({
      mode: "SIMULATION",
      idea,
      viable: Boolean(idea && idea.length >= 10),
      estimatedRevenue: 0,
      estimatedCost: 0,
      note: "Nenhuma receita real foi gerada."
    })
  );

  registry.register(
    "create_task",
    "Cria uma tarefa interna para a NEVERA.",
    async ({ title }) => ({
      created: true,
      title
    })
  );

  return registry;
}
