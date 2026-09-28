export function translatePublicSignals(scanResults = []) {
  return scanResults
    .filter((item) => item.status === "AVAILABLE")
    .map((item) => ({
      name: `Pesquisa pública: ${item.source}`,
      category: "RESEARCH",
      estimatedRevenue: 0,
      estimatedCost: 0,
      risk: 0,
      effort: 1,
      demand: 1,
      competition: 1,
      source: "PUBLIC_SIGNAL",
      signal: item.signal,
      url: item.url
    }));
}
