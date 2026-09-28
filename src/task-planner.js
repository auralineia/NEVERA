export function planPublicTasks(opportunities = []) {
  return opportunities.map((opportunity) => ({
    name: opportunity.name,
    type: "ANALYZE_PUBLIC_SIGNAL",
    source: opportunity.source,
    signal: opportunity.signal,
    url: opportunity.url,
    cost: 0
  }));
}

export function taskToExecution(task) {
  if (task.type !== "ANALYZE_PUBLIC_SIGNAL") {
    throw new Error("TASK_TYPE_NOT_ALLOWED");
  }
  return {
    type: "FETCH_PUBLIC",
    name: task.name,
    url: task.url,
    cost: 0
  };
}
