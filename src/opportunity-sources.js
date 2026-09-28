export function defaultOpportunitySources() {
  return [
    { name: "example-public", url: "https://example.com", signal: "PUBLIC_DATA" }
  ];
}

export function normalizeSources(sources = []) {
  return sources
    .filter((source) => source?.url && source?.name)
    .map((source) => ({
      name: String(source.name),
      url: String(source.url),
      signal: source.signal ?? "PUBLIC_DATA"
    }));
}
