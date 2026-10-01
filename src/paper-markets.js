const round = (value, digits = 2) => {
  const scale = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * scale) / scale;
};
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

/**
 * Deterministic paper-only finance models. No broker, wallet, exchange, or
 * hardware connection is performed by this module.
 */
export function miningEstimate({
  hashRateTH = 0,
  powerWatts = 0,
  electricityPricePerKwh = 0,
  grossRevenuePerTHDay = 0,
  poolFeePercent = 0,
  days = 1
} = {}) {
  const hash = Math.max(0, finite(hashRateTH));
  const watts = Math.max(0, finite(powerWatts));
  const energyPrice = Math.max(0, finite(electricityPricePerKwh));
  const grossRate = Math.max(0, finite(grossRevenuePerTHDay));
  const fee = Math.min(100, Math.max(0, finite(poolFeePercent)));
  const period = Math.max(0, finite(days));
  const grossRevenue = hash * grossRate * period;
  const electricityKwh = (watts / 1000) * 24 * period;
  const electricityCost = electricityKwh * energyPrice;
  const poolFees = grossRevenue * fee / 100;
  const net = grossRevenue - electricityCost - poolFees;
  return {
    mode: "SIMULATION_ONLY",
    assetClass: "MINING",
    hashRateTH: round(hash, 6),
    powerWatts: round(watts, 2),
    days: round(period, 4),
    grossRevenue: round(grossRevenue),
    electricityKwh: round(electricityKwh, 4),
    electricityCost: round(electricityCost),
    poolFees: round(poolFees),
    net: round(net),
    profitable: net > 0,
    assumptions: { grossRevenuePerTHDay: round(grossRate, 6), electricityPricePerKwh: round(energyPrice, 6), poolFeePercent: round(fee, 4) }
  };
}

export function stockPaperResult({
  symbol,
  quantity = 0,
  entryPrice = 0,
  currentPrice = 0,
  feesPercent = 0
} = {}) {
  const qty = Math.max(0, finite(quantity));
  const entry = Math.max(0, finite(entryPrice));
  const current = Math.max(0, finite(currentPrice));
  const fees = Math.min(100, Math.max(0, finite(feesPercent)));
  const invested = qty * entry;
  const marketValue = qty * current;
  const totalFees = (invested + marketValue) * fees / 100;
  const pnl = marketValue - invested - totalFees;
  return {
    mode: "SIMULATION_ONLY",
    assetClass: "EQUITY",
    symbol: String(symbol ?? "PAPER-ASSET").trim().slice(0, 24) || "PAPER-ASSET",
    quantity: round(qty, 8),
    entryPrice: round(entry, 6),
    currentPrice: round(current, 6),
    invested: round(invested),
    marketValue: round(marketValue),
    fees: round(totalFees),
    pnl: round(pnl),
    returnPercent: invested > 0 ? round((pnl / invested) * 100, 4) : 0
  };
}

export function createPaperPortfolio({ startingCash = 1000, positions = [] } = {}) {
  const cash = Math.max(0, finite(startingCash));
  const safePositions = Array.isArray(positions) ? positions.map((position) => ({
    symbol: String(position?.symbol ?? "PAPER-ASSET").slice(0, 24),
    quantity: Math.max(0, finite(position?.quantity)),
    entryPrice: Math.max(0, finite(position?.entryPrice)),
    currentPrice: Math.max(0, finite(position?.currentPrice ?? position?.entryPrice))
  })) : [];
  const valuation = safePositions.reduce((sum, position) => sum + position.quantity * position.currentPrice, 0);
  const costBasis = safePositions.reduce((sum, position) => sum + position.quantity * position.entryPrice, 0);
  return {
    mode: "SIMULATION_ONLY",
    startingCash: round(cash),
    cash: round(cash),
    positions: safePositions,
    marketValue: round(valuation),
    invested: round(costBasis),
    unrealizedPnl: round(valuation - costBasis),
    equity: round(cash + valuation),
    history: []
  };
}

export function markPaperPortfolio(portfolio, prices = {}, timestamp = new Date().toISOString()) {
  const next = createPaperPortfolio(portfolio);
  next.positions = next.positions.map((position) => {
    const supplied = finite(prices[position.symbol], position.currentPrice);
    return { ...position, currentPrice: Math.max(0, supplied) };
  });
  next.marketValue = round(next.positions.reduce((sum, item) => sum + item.quantity * item.currentPrice, 0));
  next.invested = round(next.positions.reduce((sum, item) => sum + item.quantity * item.entryPrice, 0));
  next.unrealizedPnl = round(next.marketValue - next.invested);
  next.equity = round(next.cash + next.marketValue);
  next.history = [...(Array.isArray(portfolio?.history) ? portfolio.history : []), {
    timestamp,
    cash: next.cash,
    marketValue: next.marketValue,
    equity: next.equity,
    unrealizedPnl: next.unrealizedPnl
  }].slice(-500);
  return next;
}
