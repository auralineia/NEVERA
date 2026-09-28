export function selectStrategy(strategies = [], evidence = {}) {
  if (!strategies.length) return null;
  const { preferred = null, exploration = false } = evidence;
  if (!exploration && preferred) {
    return strategies.find((item) => item.name === preferred) ?? strategies[0];
  }
  return strategies.slice().sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];
}
