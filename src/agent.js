import { ExecutionEngine } from "./execution-engine.js";
import { validateExecution } from "./quality.js";
import { CapitalPolicy } from "./capital-policy.js";
import { chooseOpportunities } from "./strategy.js";
import { chooseDecisions } from "./decision-engine.js";
import { ProductionQueue } from "./production-queue.js";
import { Guardrails } from "./guardrails.js";
import { calculateProductionPriority, defaultPriorityWeights, learnPriorityWeights } from "./priority.js";

function transformOpportunity(opportunity, strategyProfile = null) {
  if (!strategyProfile) return opportunity;

  return {
    ...opportunity,
    estimatedCost: Number((opportunity.estimatedCost * strategyProfile.riskMultiplier).toFixed(2)),
    estimatedRevenue: Number((opportunity.estimatedRevenue * strategyProfile.revenueMultiplier).toFixed(2)),
    risk: Math.min(0.95, Number((opportunity.risk * strategyProfile.riskMultiplier).toFixed(4)))
  };
}

function isRetryable(result) {
  return [
    "EXECUTION_FAILED",
    "QUALITY_GATE_FAILED",
    "EXECUTION_CAPABILITY_UNAVAILABLE",
    "MARKET_DEMAND_EXHAUSTED",
    "HOLD_CAPITAL"
  ].includes(result?.result?.reason);
}

export class NeveraAgent {
  constructor(nevera, brain, tools, strategy, market, simulator, learning, creator, evaluator, survival, dynamicMarket = null, executionEngine = null, {
    priorityWeights = null,
    queueState = null,
    experimentEvidence = [],
    guardrails = null,
    maxCycleCost = 1
  } = {}) {
    this.nevera = nevera;
    this.brain = brain;
    this.tools = tools;
    this.strategy = strategy;
    this.market = market;
    this.simulator = simulator;
    this.learning = learning;
    this.creator = creator;
    this.evaluator = evaluator;
    this.survival = survival;
    this.dynamicMarket = dynamicMarket;
    this.executionEngine = executionEngine ?? new ExecutionEngine();
    this.capitalPolicy = new CapitalPolicy();
    this.priorityWeights = priorityWeights ?? defaultPriorityWeights();
    this.experimentEvidence = Array.isArray(experimentEvidence) ? experimentEvidence : [];
    this.guardrails = guardrails ?? null;
    this.maxCycleCost = Math.max(0, Number(maxCycleCost ?? 1));
    this.productionQueue = new ProductionQueue(
      (item) => calculateProductionPriority(item, this.learning, this.priorityWeights),
      queueState ?? {}
    );
  }

  async cycle(strategyProfile = null, { maxActions = 3 } = {}) {
    this.priorityWeights = learnPriorityWeights(this.learning, this.priorityWeights);
    const actions = [];
    let resources = this.executionEngine.beginCycle();
    this.nevera.log("RESOURCE_CYCLE", { resources, maxActions });

    const prepared = await this.prepareBatch(strategyProfile, maxActions * 2);
    this.productionQueue.enqueue(prepared);
    let batch = this.productionQueue.next(maxActions);
    const budget = this.#fitCycleBudget(batch);
    batch = budget.batch;
    this.nevera.log("ACTION_BUDGET", budget);
    if (batch.length > 1) {
      const capitalBatch = this.capitalPolicy.reserveBatch(
        this.nevera.snapshot().economy.balance,
        batch.map((item) => item.executionOpportunity ?? item.choice.opportunity)
      );
      const allowedNames = new Set(capitalBatch.selected.map((item) => item.name));
      batch = batch.filter((item) => allowedNames.has(item.choice.opportunity.name));
      this.nevera.log("CAPITAL_BATCH_RESERVATION", capitalBatch);
    }
    if (batch.length > 1) {
      const results = await this.executePreparedBatch(batch, strategyProfile);
      results.forEach((result, index) => {
        this.productionQueue.recordResult(result);
        if (isRetryable(result)) this.productionQueue.requeue([batch[index]]);
      });
      actions.push(...results);
    } else {
      for (let index = 0; index < maxActions; index += 1) {
        const result = await this.cycleOnce(strategyProfile, { resetResources: false });
        this.productionQueue.recordResult(result);
        actions.push(result);
        if (!result.action?.outcome) break;
      }
    }

    const last = actions.at(-1) ?? {
      result: { status: "NO_ACTION", reason: "NO_ACTIONS" },
      action: { outcome: null }
    };
    return {
      ...last,
      actions,
      production: {
        requested: maxActions,
        queue: this.productionQueue.stats(),
        executed: actions.filter((item) => item.action?.outcome).length,
        outcomes: actions.map((item) => item.action?.outcome ?? null)
      }
    };
  }

  #fitCycleBudget(batch = []) {
    let remaining = this.maxCycleCost;
    const selected = [];
    for (const item of batch) {
      const opportunity = item.executionOpportunity ?? item.choice?.opportunity;
      const cost = Number(opportunity?.estimatedCost ?? 0);
      if (cost <= remaining) {
        selected.push(item);
        remaining = Number((remaining - cost).toFixed(2));
      }
    }
    return {
      batch: selected,
      budget: this.maxCycleCost,
      plannedCost: Number((this.maxCycleCost - remaining).toFixed(2)),
      remaining: Number(remaining.toFixed(2))
    };
  }

  async prepareBatch(strategyProfile = null, maxActions = 3) {
    const state = this.nevera.snapshot();
    const decision = this.brain.think(state);
    if (decision.type !== "PROPOSE") return [];

    const marketOpportunities = this.dynamicMarket
      ? this.dynamicMarket.evolve(this.market.available())
      : this.market.available();

    const candidates = marketOpportunities
      .map((opportunity) => ({
        opportunity,
        evaluation: this.evaluator(opportunity, state.economy.balance),
        survival: this.survival.assess(state.economy.balance, opportunity),
        demandAvailable: this.dynamicMarket ? this.dynamicMarket.hasDemand(opportunity) : true
      }))
      .filter((item) => item.evaluation.viable && item.survival.allowed && item.demandAvailable)
      .filter((item) => {
        const stats = this.learning?.categoryStats?.(item.opportunity.category);
        return !(stats?.attempts >= 3 && stats.successRate < 0.3);
      })
      .filter((item) => !this.guardrails || this.guardrails.allow(
        state.economy.balance,
        item.opportunity
      ).allowed);

    const regime = candidates.length
      ? this.learning?.regime?.(candidates[0].opportunity.category)
      : null;

    return chooseDecisions(
      candidates.map((item) => item.opportunity),
      {
        balance: state.economy.balance,
        learning: this.learning,
        strategyProfile,
        experimentEvidence: this.experimentEvidence,
        regime
      },
      maxActions
    ).map((choice) => {
      const candidate = candidates.find(
        (item) => item.opportunity.name === choice.opportunity.name
      );
      const executionOpportunity = transformOpportunity(choice.opportunity, strategyProfile);

      return {
        choice,
        candidate,
        executionOpportunity,
        priorityScore: choice.decisionScore,
        legacyPriorityScore: calculateProductionPriority(
          { choice, opportunity: executionOpportunity },
          this.learning,
          this.priorityWeights
        )
      };
    });
  }

  async executePreparedBatch(batch, strategyProfile = null) {
    const results = batch.map(() => ({
      result: { status: "NO_ACTION", reason: "UNPROCESSED" },
      action: { outcome: null }
    }));

    const prepared = batch.map((item, index) => ({
      index,
      item,
      opportunity: transformOpportunity(item.choice.opportunity, strategyProfile)
    }));

    const executable = prepared.filter(({ opportunity }) =>
      this.capitalPolicy.decide(this.nevera.snapshot().economy.balance, opportunity).allowed
    );

    if (!executable.length) {
      results.forEach((result) => {
        result.result = { status: "NO_ACTION", reason: "HOLD_CAPITAL" };
      });
      return results;
    }

    const demandOk = executable.map(({ opportunity }) =>
      this.dynamicMarket ? this.dynamicMarket.consume(opportunity) : true
    );

    if (demandOk.some((ok) => !ok)) {
      executable.forEach(({ opportunity }, index) => {
        if (demandOk[index] === true) this.dynamicMarket?.release(opportunity);
      });
      results.forEach((result) => {
        result.result = { status: "NO_ACTION", reason: "MARKET_DEMAND_EXHAUSTED" };
      });
      return results;
    }

    const executions = await this.executionEngine.executeBatch(
      executable.map(({ opportunity }) => opportunity)
    );

    for (let index = 0; index < executable.length; index += 1) {
      const { item, opportunity, index: resultIndex } = executable[index];
      const execution = executions[index];

      if (execution?.status !== "SUCCESS") {
        this.dynamicMarket?.release(opportunity);
        this.executionEngine.releaseExecution?.(execution);
        results[resultIndex] = {
          result: { status: "NO_ACTION", reason: "EXECUTION_FAILED" },
          action: { execution, outcome: null }
        };
        continue;
      }

      const balanceBefore = this.nevera.snapshot().economy.balance;
      const outcome = await this.simulator(opportunity);
      const quality = validateExecution({ opportunity, execution, outcome });

      if (!quality.passed) {
        this.dynamicMarket?.release(opportunity);
        this.executionEngine.releaseExecution?.(execution);
        results[resultIndex] = {
          result: { status: "NO_ACTION", reason: "QUALITY_GATE_FAILED" },
          action: { execution, outcome: null }
        };
        continue;
      }

      if (outcome.cost > 0) {
        this.nevera.spend(outcome.cost, `executed: ${item.choice.opportunity.name}`);
      }

      if (outcome.revenue > 0 && outcome.status === "SUCCESS") {
        this.nevera.earn(outcome.revenue, `delivered: ${item.choice.opportunity.name}`);
      }

      item.choice.opportunity.status = "CLOSED";
      item.choice.opportunity.estimatedRevenue = opportunity.estimatedRevenue;
      item.choice.opportunity.strategy = strategyProfile?.name ?? null;
      this.learning.record(item.choice.opportunity, outcome);

      results[resultIndex] = {
        opportunity: item.choice.opportunity,
        score: item.choice.score,
        result: { status: "EXECUTED" },
        action: { execution, outcome, balanceBefore, balanceAfter: this.nevera.snapshot().economy.balance }
      };
    }

    return results;
  }

  async executePrepared(item, strategyProfile = null) {
    const opportunity = item.choice.opportunity;
    const executionOpportunity = transformOpportunity(opportunity, strategyProfile);

    const capitalDecision = this.capitalPolicy.decide(
      this.nevera.snapshot().economy.balance,
      executionOpportunity
    );
    if (!capitalDecision.allowed) return { result: { status: "NO_ACTION", reason: capitalDecision.reason }, action: { outcome: null } };

    if (this.dynamicMarket && !this.dynamicMarket.consume(opportunity)) {
      return { result: { status: "NO_ACTION", reason: "MARKET_DEMAND_EXHAUSTED" }, action: { outcome: null } };
    }

    const execution = await this.executionEngine.execute(executionOpportunity);
    if (execution.status !== "SUCCESS") {
      this.executionEngine.releaseExecution?.(execution);
      this.dynamicMarket?.release(opportunity);
      return { result: { status: "NO_ACTION", reason: "EXECUTION_FAILED" }, action: { execution, outcome: null } };
    }

    const balanceBefore = this.nevera.snapshot().economy.balance;
    const outcome = await this.simulator(executionOpportunity);
    const quality = validateExecution({ opportunity: executionOpportunity, execution, outcome });
    if (!quality.passed) {
      this.executionEngine.releaseExecution?.(execution);
      this.dynamicMarket?.release(opportunity);
      return { result: { status: "NO_ACTION", reason: "QUALITY_GATE_FAILED" }, action: { execution, outcome: null } };
    }

    if (outcome.cost > 0) this.nevera.spend(outcome.cost, `executed: ${opportunity.name}`);
    if (outcome.revenue > 0 && outcome.status === "SUCCESS") this.nevera.earn(outcome.revenue, `delivered: ${opportunity.name}`);
    opportunity.status = "CLOSED";
    opportunity.strategy = strategyProfile?.name ?? null;
    this.learning.record(opportunity, outcome);

    return {
      opportunity,
      score: item.choice.score,
      result: { status: "EXECUTED" },
      action: { execution, outcome, balanceBefore, balanceAfter: this.nevera.snapshot().economy.balance }
    };
  }

  async cycleOnce(strategyProfile = null, { resetResources = false } = {}) {
    if (resetResources) {
      const resources = this.executionEngine.beginCycle();
      this.nevera.log("RESOURCE_CYCLE", { resources });
    }

    const state = this.nevera.snapshot();
    const decision = this.brain.think(state);

    this.nevera.log("DECISION", decision);

    if (decision.type !== "PROPOSE") {
      return { decision, action: null, opportunity: null };
    }

    const created = this.creator.createFromMemory(this.learning);
    const createdEvaluation = this.evaluator(created, state.economy.balance);

    this.nevera.log("OPPORTUNITY_EVALUATED", {
      opportunity: created,
      evaluation: createdEvaluation
    });

    if (!createdEvaluation.viable) {
      this.brain.remember(created.name, {
        status: "REJECTED",
        reason: "LOW_VIABILITY",
        evaluation: createdEvaluation
      });
    } else {
      this.market.add(created);
      this.nevera.log("OPPORTUNITY_CREATED", created);
    }

    const marketOpportunities = this.dynamicMarket
      ? this.dynamicMarket.evolve(this.market.available())
      : this.market.available();

    const marketEvent = this.dynamicMarket?.lastEvent ?? null;
    if (marketEvent) {
      this.nevera.log("MARKET_EVENT", marketEvent);
    }

    const marketContexts = [
      ...marketOpportunities.slice(0, 3).map((item) => ({
        demand: item.demand ?? item.marketContext?.demand ?? 1,
        competition: item.competition ?? item.marketContext?.competition ?? 1
      })),
      { demand: 1.2, competition: 0.8 },
      { demand: 0.85, competition: 1.2 }
    ];

    const discovered = this.creator.scan(this.learning, marketContexts);
    const discoveredEvaluations = discovered.map((opportunity) => ({
      opportunity,
      evaluation: this.evaluator(opportunity, state.economy.balance)
    }));

    this.nevera.log("OPPORTUNITY_SCAN", {
      count: discoveredEvaluations.length,
      results: discoveredEvaluations
    });

    for (const item of discoveredEvaluations) {
      if (item.evaluation.viable) {
        this.market.add(item.opportunity);
      }
    }

    const candidates = marketOpportunities
      .map((opportunity) => ({
        opportunity,
        evaluation: this.evaluator(opportunity, state.economy.balance),
        survival: this.survival.assess(state.economy.balance, opportunity),
        demandAvailable: this.dynamicMarket
          ? this.dynamicMarket.hasDemand(opportunity)
          : true
      }))
      .filter((item) =>
        item.evaluation.viable &&
        item.survival.allowed &&
        item.demandAvailable
      );

    const choice = this.strategy(
      candidates.map((item) => item.opportunity),
      state.economy.balance,
      this.learning
    );

    if (!choice) {
      const result = { status: "NO_ACTION", reason: "PROTECT_CAPITAL" };
      this.nevera.log("CAPITAL_DECISION", result);
      return { decision, createdOpportunity: created, createdEvaluation, candidates, result };
    }

    const selected = candidates.find(
      (item) => item.opportunity.name === choice.opportunity.name
    );

    this.nevera.log("CAPITAL_DECISION", {
      selected: choice.opportunity.name,
      score: choice.score,
      strategy: strategyProfile?.name ?? "UNSPECIFIED",
      evaluation: selected.evaluation,
      survival: selected.survival
    });

    const research = await this.tools.execute("research_opportunity", {
      idea: choice.opportunity.name
    });

    const executionOpportunity = strategyProfile
      ? {
          ...choice.opportunity,
          estimatedCost: Number(
            (choice.opportunity.estimatedCost * strategyProfile.riskMultiplier).toFixed(2)
          ),
          estimatedRevenue: Number(
            (choice.opportunity.estimatedRevenue * strategyProfile.revenueMultiplier).toFixed(2)
          ),
          risk: Math.min(
            0.95,
            Number((choice.opportunity.risk * strategyProfile.riskMultiplier).toFixed(4))
          )
        }
      : choice.opportunity;

    const executionCheck = this.survival.assess(
      state.economy.balance,
      executionOpportunity
    );

    const capitalDecision = this.capitalPolicy.decide(
      state.economy.balance,
      executionOpportunity
    );

    this.nevera.log("CAPITAL_POLICY", capitalDecision);

    if (!capitalDecision.allowed) {
      const result = {
        status: "NO_ACTION",
        reason: capitalDecision.reason,
        capitalDecision
      };
      this.nevera.log("CAPITAL_DECISION", result);
      return { decision, createdOpportunity: created, createdEvaluation, candidates, result };
    }

    if (!executionCheck.allowed) {
      const result = {
        status: "NO_ACTION",
        reason: "STRATEGY_EXCEEDS_SURVIVAL_LIMIT",
        executionCheck
      };
      this.nevera.log("CAPITAL_DECISION", result);
      return { decision, createdOpportunity: created, createdEvaluation, candidates, result };
    }

    const demandReserved = this.dynamicMarket
      ? this.dynamicMarket.consume(choice.opportunity)
      : true;

    if (!demandReserved) {
      const result = { status: "NO_ACTION", reason: "MARKET_DEMAND_EXHAUSTED" };
      this.nevera.log("MARKET_REJECTED", result);
      return {
        decision,
        createdOpportunity: created,
        createdEvaluation,
        candidates,
        opportunity: choice.opportunity,
        score: choice.score,
        selectedEvaluation: selected.evaluation,
        survival: executionCheck,
        strategy: strategyProfile?.name ?? "UNSPECIFIED",
        action: { tool: "research_opportunity", research, outcome: null },
        marketEvent,
        result,
        learning: this.learning.stats()
      };
    }

    const executionPlan = this.executionEngine.plan(executionOpportunity);
    this.nevera.log("EXECUTION_PLAN", {
      opportunity: choice.opportunity.name,
      plan: executionPlan
    });

    if (!executionPlan.supported) {
      this.dynamicMarket?.release(choice.opportunity);
      const result = {
        status: "NO_ACTION",
        reason: "EXECUTION_CAPABILITY_UNAVAILABLE",
        executionPlan
      };
      this.nevera.log("EXECUTION_REJECTED", result);
      return {
        decision,
        createdOpportunity: created,
        createdEvaluation,
        candidates,
        opportunity: choice.opportunity,
        score: choice.score,
        selectedEvaluation: selected.evaluation,
        survival: executionCheck,
        strategy: strategyProfile?.name ?? "UNSPECIFIED",
        action: { tool: "research_opportunity", research, executionPlan, outcome: null },
        marketEvent,
        result,
        learning: this.learning.stats()
      };
    }

    const execution = await this.executionEngine.execute(executionOpportunity);

    if (execution.status !== "SUCCESS") {
      this.executionEngine.releaseExecution?.(execution);
      this.dynamicMarket?.release(choice.opportunity);
      const result = {
        status: "NO_ACTION",
        reason: "EXECUTION_FAILED",
        execution
      };
      this.nevera.log("EXECUTION_FAILED", result);
      return {
        decision,
        createdOpportunity: created,
        createdEvaluation,
        candidates,
        opportunity: choice.opportunity,
        score: choice.score,
        selectedEvaluation: selected.evaluation,
        survival: executionCheck,
        strategy: strategyProfile?.name ?? "UNSPECIFIED",
        action: { tool: "research_opportunity", research, executionPlan, execution, outcome: null },
        marketEvent,
        result,
        learning: this.learning.stats()
      };
    }

    const outcome = await this.simulator(executionOpportunity);
    const quality = validateExecution({
      opportunity: executionOpportunity,
      execution,
      outcome
    });

    this.nevera.log("QUALITY_GATE", quality);

    if (!quality.passed) {
      this.executionEngine.releaseExecution?.(execution);
      this.dynamicMarket?.release(choice.opportunity);
      const result = {
        status: "NO_ACTION",
        reason: "QUALITY_GATE_FAILED",
        quality
      };
      this.nevera.log("EXECUTION_REJECTED", result);
      return {
        decision,
        createdOpportunity: created,
        createdEvaluation,
        candidates,
        opportunity: choice.opportunity,
        score: choice.score,
        selectedEvaluation: selected.evaluation,
        survival: executionCheck,
        strategy: strategyProfile?.name ?? "UNSPECIFIED",
        action: {
          tool: "research_opportunity",
          research,
          executionPlan,
          execution,
          outcome: null
        },
        marketEvent,
        result,
        quality,
        learning: this.learning.stats()
      };
    }

    if (outcome.cost > 0) {
      this.nevera.spend(outcome.cost, `executed: ${choice.opportunity.name}`);
    }

    if (outcome.revenue > 0 && outcome.status === "SUCCESS") {
      this.nevera.earn(outcome.revenue, `delivered: ${choice.opportunity.name}`);
    }

    choice.opportunity.estimatedRevenue = executionOpportunity.estimatedRevenue;
    choice.opportunity.status = "CLOSED";
    this.learning.record(choice.opportunity, outcome);
    this.brain.remember(choice.opportunity.name, {
      ...outcome,
      execution: {
        status: execution.status,
        duration: execution.duration,
        deliverableType: execution.deliverable?.type ?? null
      }
    });

    this.nevera.log("MARKET_RESULT", {
      opportunity: choice.opportunity,
      strategy: strategyProfile?.name ?? "UNSPECIFIED",
      score: choice.score,
      execution,
      outcome,
      learning: this.learning.stats()
    });

    return {
      decision,
      createdOpportunity: created,
      createdEvaluation,
      candidates,
      opportunity: choice.opportunity,
      score: choice.score,
      selectedEvaluation: selected.evaluation,
      survival: executionCheck,
      strategy: strategyProfile?.name ?? "UNSPECIFIED",
      action: { tool: "research_opportunity", research, executionPlan, execution, outcome },
      marketEvent,
      learning: this.learning.stats()
    };
  }
}
