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
import { Guardrails } from "./guardrails.js";
import { RealSandbox } from "./real-sandbox.js";
import { OpportunityDiscovery } from "./opportunity-discovery.js";
import { TaskExecutor } from "./task-executor.js";
import { Telemetry } from "./telemetry.js";
import { Runtime } from "./runtime.js";
import { translatePublicSignals } from "./public-opportunities.js";
import { planPublicTasks } from "./task-planner.js";
import { RecoveryManager } from "./recovery.js";
import { taskToExecution } from "./task-planner.js";
import { OpportunityEngine } from "./opportunity-engine.js";
import { defaultOpportunitySources, normalizeSources } from "./opportunity-sources.js";
import { opportunityMetrics } from "./opportunity-metrics.js";
import { EconomicMemory } from "./economic-memory.js";
import { simulateEconomicOutcome } from "./economic-simulator.js";
import { FailureMemory } from "./failure-memory.js";
import { survivalMetrics } from "./survival-metrics.js";
import { buildPortfolio } from "./portfolio.js";
import { operationalState } from "./state.js";
import { ObjectiveManager } from "./objectives.js";
import { DecisionMemory } from "./decision-memory.js";
import { ActionBudget } from "./action-budget.js";


const persistence = new Persistence();
const saved = await persistence.load();

const initialBalance = saved?.initialBalance ?? 10;
const nevera = new Nevera({ initialBalance: saved?.balance ?? initialBalance });
const brain = new Brain(objectiveManager);
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
const guardrails = new Guardrails({
  reserveRatio: Number(process.env.NEVERA_RESERVE_RATIO ?? 0.5),
  maxOperationCost: Number(process.env.NEVERA_MAX_OPERATION_COST ?? 1),
  dailyLossLimit: Number(process.env.NEVERA_DAILY_LOSS_LIMIT ?? 2),
  killSwitch: process.env.NEVERA_KILL_SWITCH === "1"
});
const realSandbox = new RealSandbox({
  allowDomains: (process.env.NEVERA_ALLOWED_DOMAINS ?? "example.com").split(",").map((v) => v.trim()).filter(Boolean),
  killSwitch: process.env.NEVERA_KILL_SWITCH === "1"
});
const discovery = new OpportunityDiscovery({
  sandbox: realSandbox,
  sources: opportunitySources.map((source) => ({
    ...source,
    url: process.env.NEVERA_SANDBOX_URL && source.name === "example-public"
      ? process.env.NEVERA_SANDBOX_URL
      : source.url
  }))
});
const taskExecutor = new TaskExecutor({ sandbox: realSandbox, guardrails });
guardrails.losses = Number(saved?.guardrails?.losses ?? 0);
const telemetry = new Telemetry();
const objectiveManager = new ObjectiveManager();
const decisionMemory = new DecisionMemory(saved?.decisionMemory ?? []);
const actionBudget = new ActionBudget({ maxActions: 3, maxCost: Number(process.env.NEVERA_MAX_CYCLE_COST ?? 1) });
const runtime = new Runtime();
const recovery = new RecoveryManager();
const economicMemory = new EconomicMemory(saved?.economicMemory ?? []);
const failureMemory = new FailureMemory(saved?.failureMemory ?? []);
const opportunityEngine = new OpportunityEngine({ evaluator: evaluateOpportunity, maxQueue: 10, economicMemory, failureMemory });
const opportunitySources = normalizeSources(defaultOpportunitySources());

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
  dynamicMarket,
  null,
  {
    priorityWeights: saved?.priorityWeights ?? null,
    queueState: saved?.productionQueue ?? null,
    experimentEvidence: saved?.experimentEvidence ?? [],
    guardrails
  }
);

let explorationInterval = saved?.explorationInterval ?? 3;
const throughput = new ThroughputController(saved?.throughput ? { ...saved.throughput, initial: saved.throughput.current } : undefined);
const startCycle = (saved?.cycle ?? 0) + 1;
const configuredCycles = Number(process.env.NEVERA_CYCLES ?? 5);
const cycleLimit = configuredCycles === 0 ? Infinity : Math.max(1, configuredCycles);
const cycleDelayMs = Math.max(0, Number(process.env.NEVERA_CYCLE_DELAY_MS ?? 0));

for (let offset = 0; offset < cycleLimit && nevera.snapshot().status !== "DEAD"; offset += 1) {
  const cycle = startCycle + offset;
  runtime.cycleStarted(cycle);
  telemetry.record("CYCLE_START", { cycle });
  const publicSources = await discovery.scan();
  const publicOpportunities = translatePublicSignals(publicSources);
  const opportunityBatch = opportunityEngine.discover(publicOpportunities, nevera.snapshot().economy.balance);
  const portfolio = buildPortfolio(opportunityBatch.map((item) => item.opportunity), { maxItems: 3 });
  const publicTasks = planPublicTasks(portfolio);
  const opportunityStats = opportunityMetrics(opportunityBatch);
  for (const task of publicTasks) {
    telemetry.record("TASK_PLANNED", { cycle, task: task.name, cost: task.cost });
    try {
      const execution = await taskExecutor.execute(taskToExecution(task), nevera.snapshot().economy.balance);
      telemetry.record("TASK_EXECUTED", { cycle, task: task.name, status: execution.status });
    } catch (error) {
      telemetry.record("TASK_ERROR", { cycle, task: task.name, message: error.message });
    }
  }
  telemetry.record("PUBLIC_SCAN", { cycle, sources: publicSources.length, opportunities: publicOpportunities.length });
  portfolio.explorationInterval = explorationInterval;
  const strategy = portfolio.choose(cycle);
  const objective = brain.updateObjective({
    balance: nevera.snapshot().economy.balance,
    initialBalance,
    successRate: learning.stats().successRate ?? 0,
    failures: learning.stats().failures ?? 0
  });
  agent.experimentEvidence = experiments.recent(20)
    .map((item) => experiments.evaluate(item.id))
    .filter(Boolean);
  const experiment = experiments.start({
    cycle,
    hypothesis: hypothesisEngine.generate({
      strategy,
      strategyStats: portfolio.stats(),
      experimentStats: experiments.stats()
    }),
    strategy: strategy.name
  });
  let result;
  try {
    result = await agent.cycle(strategy, { maxActions: throughput.current });
    recovery.success();
  } catch (error) {
    recovery.failure();
    runtime.error(error);
    telemetry.record("CYCLE_ERROR", { cycle, message: error.message });
    if (recovery.snapshot().consecutiveErrors >= recovery.maxConsecutiveErrors) recovery.restart();
    throw error;
  }
  telemetry.record("AGENT_CYCLE", { cycle, executed: result.production?.executed ?? 0 });
  const throughputDecision = throughput.decide({
    outcomes: result.production?.outcomes ?? [],
    balance: nevera.snapshot().economy.balance,
    initialBalance
  });

  const outcomes = (result.actions ?? [])
    .map((item) => item.action?.outcome)
    .filter(Boolean);

  for (const item of opportunityBatch) {
    const economicOutcome = simulateEconomicOutcome(item.opportunity);
    economicMemory.record(item.opportunity, economicOutcome);
    failureMemory.record(item.opportunity, economicOutcome);
  }

  for (const outcome of outcomes) {
    portfolio.record(strategy, outcome);
    const learningItem = learning.results.at(-1);
    if (learningItem) learningItem.strategy = strategy.name;
  }

  if (outcomes.length) {
    experiments.complete(experiment.id, outcomes.at(-1));
  }

  decisionMemory.record({
    cycle,
    objective,
    strategy: strategy.name,
    opportunity: result.chosenOpportunity,
    score: result.score,
    outcome: outcomes
  });

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
    strategies: portfolio.stats(),
    production: agent.productionQueue.stats()
  });

  const experimentEvidence = experiments.recent(20)
    .map((item) => experiments.evaluate(item.id))
    .filter(Boolean);

  const adaptation = adaptationEngine.adapt({
    strategyStats: portfolio.stats(),
    experimentStats: experiments.stats(),
    experimentEvidence,
    currentExplorationInterval: explorationInterval
  });
  explorationInterval = adaptation.explorationInterval;

  if (cycleDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, cycleDelayMs));

  await persistence.save({
    initialBalance,
    balance: nevera.snapshot().economy.balance,
    cycle,
    learning: learning.export(),
    strategies: portfolio.export(),
    decisions: ledger.export(),
    experiments: experiments.export(),
    experimentEvidence,
    explorationInterval,
    throughput: throughput.snapshot(),
    priorityWeights: agent.priorityWeights,
    productionQueue: {
      items: agent.productionQueue.snapshot(),
      ...agent.productionQueue.stats()
    },
    marketSeed: 42,
    marketEvents: dynamicMarket.state(),
    metrics,
    guardrails: guardrails.snapshot(),
    sandbox: realSandbox.snapshot(),
    taskExecutor: taskExecutor.snapshot(),
    telemetry: telemetry.snapshot(),
    runtime: runtime.snapshot(),
    publicOpportunities,
    publicTasks,
    portfolio,
    opportunityStats,
    opportunityQueue: opportunityEngine.snapshot(),
  economicMemory: economicMemory.export(),
  failureMemory: failureMemory.export(),
  survival: survivalMetrics({
    initialBalance,
    currentBalance: nevera.snapshot().economy.balance,
    failures: learning.stats().failures ?? 0,
    cycles: cycleLimit === Infinity ? 0 : cycleLimit
  }),
    economicMemory: economicMemory.export(),
    failureMemory: failureMemory.export(),
    decisionMemory: decisionMemory.export(),
    objective: objectiveManager.snapshot(),
    recovery: recovery.snapshot(),
  opportunityQueue: opportunityEngine.snapshot(),
    lastResult: result
  });

  console.log(JSON.stringify({
    cycle,
    strategy: strategy.name,
    metrics,
    decisionStats: ledger.stats(),
    objective,
    decisionMemory: decisionMemory.recent(10),
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
  strategies: portfolio.stats(),
  production: agent.productionQueue.stats()
});

const finalOperationalState = operationalState({
  nevera,
  runtime,
  recovery,
  telemetry,
  guardrails,
  opportunityQueue: opportunityEngine.snapshot(),
  survival: survivalMetrics({
    initialBalance,
    currentBalance: nevera.snapshot().economy.balance,
    cycles: configuredCycles
  })
});

console.log(JSON.stringify({
  ...finalOperationalState,
  agent: nevera.snapshot(),
  metrics: finalMetrics,
  decisionStats: ledger.stats(),
  experimentStats: experiments.stats(),
  recentDecisions: ledger.recent(5),
  recentExperiments: experiments.recent(5),
  explorationInterval,
  marketEvent: dynamicMarket.lastEvent,
  marketState: dynamicMarket.state(),
  guardrails: guardrails.snapshot(),
  sandbox: realSandbox.snapshot(),
  telemetry: telemetry.snapshot(),
  runtime: runtime.snapshot(),
  recovery: recovery.snapshot(),
  persistence: "LOCAL_SIMULATION"
}, null, 2));
