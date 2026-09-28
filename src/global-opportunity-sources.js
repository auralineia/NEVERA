export function configuredGlobalSources() {
  const raw = String(process.env.NEVERA_OPPORTUNITY_SOURCES ?? "").trim();
  if (!raw) return [];

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => {
      const separator = entry.indexOf("|");
      if (separator < 0) {
        return { name: `global-${index + 1}`, url: entry, signal: "PUBLIC_MARKET" };
      }
      return {
        name: entry.slice(0, separator).trim() || `global-${index + 1}`,
        url: entry.slice(separator + 1).trim(),
        signal: "PUBLIC_MARKET"
      };
    })
    .filter((source) => /^https:\/\//i.test(source.url));
}
