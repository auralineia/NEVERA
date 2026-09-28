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
import { ExperimentManager } from "./experiments.js";
import { HypothesisEngine } from "./hypotheses.js";
import { AdaptationEngine } from "./adaptation.js";
import { DynamicMarket } from "./dynamic-market.js";
import { ThroughputController } from "./throughput.js";

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
const portfolio = new StrategyPortfolio(undefined, 3, saved?.strategies ?? []);
const ledger = new DecisionLedger(saved?.decisions ?? []);
const experiments = new ExperimentManager(saved?.experiments ?? []);
const hypothesisEngine = new HypothesisEngine();
const adaptationEngine = new AdaptationEngine();
const dynamicMarket = new DynamicMarket(
  saved?.marketSeed ?? 42,
  saved?.marketEvents ?? null
);

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
  survival,
  dynamicMarket
);

let explorationInterval = saved?.explorationInterval ?? 3;
const throughput = new ThroughputController(saved?.throughput ? { ...saved.throughput, initial: saved.throughput.current } : undefined);
const startCycle = (saved?.cycle ?? 0) + 1;

for (let offset = 0; offset < 5 && nevera.snapshot().status !== "DEAD"; offset += 1) {
  const cycle = startCycle + offset;
  portfolio.explorationInterval = explorationInterval;
  const strategy = portfolio.choose(cycle);
  const experiment = experiments.start({
    cycle,
    hypothesis: hypothesisEngine.generate({
      strategy,
      strategyStats: portfolio.stats(),
      experimentStats: experiments.stats()
    }),
    strategy: strategy.name
  });
  const result = await agent.cycle(strategy, { maxActions: throughput.current });
  const throughputDecision = throughput.decide({
    outcomes: result.production?.outcomes ?? [],
    balance: nevera.snapshot().economy.balance,
    initialBalance
  });

  const outcomes = (result.actions ?? [])
    .map((item) => item.action?.outcome)
    .filter(Boolean);

  for (const outcome of outcomes) {
    portfolio.record(strategy, outcome);
  }

  if (outcomes.length) {
    experiments.complete(experiment.id, outcomes.at(-1));
  }

  ledger.record({
    cycle,
    decision: result.decision,
    strategy: strategy.name,
    opportunity: result.chosenOpportunity,
    score: result.score,
    survival: result.survival,
    outcome: outcomes
  });

  const metrics = calculateMetrics({
    initialBalance,
    currentBalance: nevera.snapshot().economy.balance,
    learning,
    strategies: portfolio.stats()
  });

  const adaptation = adaptationEngine.adapt({
    strategyStats: portfolio.stats(),
    experimentStats: experiments.stats(),
    currentExplorationInterval: explorationInterval
  });
  explorationInterval = adaptation.explorationInterval;

  await persistence.save({
    initialBalance,
    balance: nevera.snapshot().economy.balance,
    cycle,
    learning: learning.export(),
    strategies: portfolio.export(),
    decisions: ledger.export(),
    experiments: experiments.export(),
    explorationInterval,
    throughput: throughput.snapshot(),
    marketSeed: 42,
    marketEvents: dynamicMarket.state(),
    metrics,
    lastResult: result
  });

  console.log(JSON.stringify({
    cycle,
    strategy: strategy.name,
    metrics,
    decisionStats: ledger.stats(),
    experimentStats: experiments.stats(),
    adaptation,
    throughput: throughputDecision,
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
  experimentStats: experiments.stats(),
  recentDecisions: ledger.recent(5),
  recentExperiments: experiments.recent(5),
  explorationInterval,
  marketEvent: dynamicMarket.lastEvent,
  marketState: dynamicMarket.state(),
  persistence: "LOCAL_SIMULATION"
}, null, 2));
