export async function runParallelAgents(items, { concurrency = 4, task } = {}) {
  if (!Array.isArray(items) || typeof task !== "function") throw new TypeError("items and task are required");
  const limit = Math.max(1, Math.min(8, Math.floor(Number(concurrency) || 1)));
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      try { results[index] = await task(items[index], index); }
      catch (error) { results[index] = { ok: false, error: String(error?.message ?? error), index }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

export function createAgentRoster() {
  return [
    { id: "discovery", name: "Opportunity Discovery", role: "Find and classify opportunities" },
    { id: "research", name: "Research Analyst", role: "Prepare evidence-backed proposals" },
    { id: "production", name: "Production Agent", role: "Generate review-ready deliverables" },
    { id: "risk", name: "Risk Analyst", role: "Flag assumptions, costs and risks" },
    { id: "markets", name: "Paper Markets", role: "Analyze simulated mining and stock scenarios" },
    { id: "coordinator", name: "Coordinator", role: "Aggregate results and preserve auditability" }
  ];
}
