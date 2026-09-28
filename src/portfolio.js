export function buildPortfolio(opportunities = [], { maxItems = 3 } = {}) {
  const categories = new Set();
  const result = [];

  for (const opportunity of opportunities) {
    if (result.length >= maxItems) break;
    if (categories.has(opportunity.category)) continue;
    categories.add(opportunity.category);
    result.push(opportunity);
  }

  return result;
}
