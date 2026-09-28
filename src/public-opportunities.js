export function translatePublicSignals(scanResults = []) {
  return scanResults
    .filter((item) => item.status === "AVAILABLE")
    .map((item) => ({
      name: `Demanda pública: ${item.source}`,
      category: "DIGITAL_SERVICES",
      estimatedRevenue: 150,
      estimatedCost: 0,
      risk: 0.05,
      effort: 1,
      demand: 1,
      competition: 1,
      source: "PUBLIC_SIGNAL",
      signal: item.signal,
      url: item.url
    }));
}
