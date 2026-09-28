import { Nevera } from "./nevera.js";
import { Brain } from "./brain.js";
import { createSimulationTools } from "./tools.js";
import { NeveraAgent } from "./agent.js";
import { defaultMarket } from "./market.js";
import { chooseOpportunity } from "./strategy.js";
import { simulateOutcome } from "./simulator.js";
import { Learning } from "./learning.js";
import { OpportunityCreator } from "./creator.js";
import { evaluateOpportunity } from "./evaluator.js";
import { Persistence } from "./persistence.js";
import { SurvivalManager } from "./survival.js";
import { StrategyPortfolio } from "./strategies.js";
import { calculateMetrics } from "./metrics.js";
import { DecisionLedger } from "./decision-ledger.js";

const persistence = new Persistence();
const saved = await persistence.load();

const initialBalance = saved?.initialBalance ?? 10;
const nevera = new Nevera({ initialBalance: saved?.balance ?? initialBalance });
const brain = new Brain();
const tools = createSimulationTools();
const market = defaultMarket();
const learning = new Learning(saved?.learning ?? []);
const creator = new OpportunityCreator();
const survival = new SurvivalManager();
const portfolio = new StrategyPortfolio();
const ledger = new DecisionLedger(saved?.decisions ?? []);

nevera.boot();
brain.setObjective("Encontrar uma forma legítima e sustentável de gerar a primeira receita");

const agent = new NeveraAgent(
  nevera,
  brain,
  tools,
  chooseOpportunity,
  market,
  simulateOutcome,
  learning,
  creator,
  evaluateOpportunity,
  survival
);

const startCycle = (saved?.cycle ?? 0) + 1;

for (let offset = 0; offset < 5 && !nevera.isDead(); offset += 1) {
  const cycle = startCycle + offset;
  const strategy = portfolio.choose(cycle);
  const result = await agent.cycle(strategy);

  if (result.action?.outcome) {
    portfolio.record(strategy, result.action.outcome);
  }

  ledger.record({
    cycle,
    decision: result.decision,
    strategy: strategy.name,
    opportunity: result.chosenOpportunity,
    score: result.score,
    survival: result.survival,
    outcome: result.action?.outcome ?? null
  });

  const metrics = calculateMetrics({
    initialBalance,
    currentBalance: nevera.snapshot().economy.balance,
    learning,
    strategies: portfolio.stats()
  });

  await persistence.save({
    initialBalance,
    balance: nevera.snapshot().economy.balance,
    cycle,
    learning: learning.export(),
    strategies: portfolio.export(),
    decisions: ledger.export(),
    metrics,
    lastResult: result
  });

  console.log(JSON.stringify({
    cycle,
    strategy: strategy.name,
    metrics,
    decisionStats: ledger.stats(),
    result
  }, null, 2));
}

const finalMetrics = calculateMetrics({
  initialBalance,
  currentBalance: nevera.snapshot().economy.balance,
  learning,
  strategies: portfolio.stats()
});

console.log(JSON.stringify({
  agent: nevera.snapshot(),
  metrics: finalMetrics,
  decisionStats: ledger.stats(),
  recentDecisions: ledger.recent(5),
  persistence: "LOCAL_SIMULATION"
}, null, 2));
