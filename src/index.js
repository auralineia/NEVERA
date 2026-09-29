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
import { FailureMemory } from "./failure-memory.js";
import { survivalMetrics } from "./survival-metrics.js";
import { buildPortfolio } from "./portfolio.js";
import { operationalState } from "./state.js";
import { ObjectiveManager } from "./objectives.js";
import { DecisionMemory } from "./decision-memory.js";
import { ActionBudget } from "./action-budget.js";
import { CycleController } from "./cycle-controller.js";
import { LongTermMemory } from "./long-term-memory.js";
import { metaLearn } from "./meta-learning.js";
import { DecisionFilter } from "./decision-filter.js";
import { StrategyLab } from "./strategy-lab.js";
import { StrategyMemory } from "./strategy-memory.js";
import { RiskMemory } from "./risk-memory.js";
import { evaluateAction } from "./post-action.js";
import { testStrategy } from "./strategy-evolution.js";
import { RevenueEngine } from "./revenue-engine.js";
import { PaymentAdapter } from "./payment-adapter.js";
import { createServer } from "node:http";
import { configuredGlobalSources } from "./global-opportunity-sources.js";
import { DeliverableEngine } from "./deliverable-engine.js";
import { GenerationProvider } from "./generation-provider.js";
import { RealCapital } from "./real-capital.js";
import { RevenueExecutionPipeline } from "./revenue-execution-pipeline.js";
import { BrowserWorker } from "./browser-worker.js";
import { ApplicationEngine } from "./application-engine.js";
import { createPlatformRegistry } from "./platform-adapter.js";
import { ApplicationPolicy } from "./application-policy.js";


const persistence = new Persistence(process.env.NEVERA_STATE_FILE ?? "./nevera-state.json");
const saved = await persistence.load();

const initialBalance = saved?.initialBalance ?? 10;
const nevera = new Nevera({ initialBalance: saved?.balance ?? initialBalance });
const realCapital = new RealCapital(saved?.realCapital ?? {});
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
  maxDrawdown: Number(process.env.NEVERA_MAX_DRAWDOWN ?? 0.5),
  cooldownCycles: Number(process.env.NEVERA_COOLDOWN_CYCLES ?? 2),
  killSwitch: process.env.NEVERA_KILL_SWITCH === "1"
});
const realSandbox = new RealSandbox({
  allowDomains: (process.env.NEVERA_ALLOWED_DOMAINS ?? "example.com,jobicy.com,himalayas.app,remoteok.com,remotive.com,arbeitnow.com,weworkremotely.com").split(",").map((v) => v.trim()).filter(Boolean),
  killSwitch: process.env.NEVERA_KILL_SWITCH === "1"
});
const opportunitySources = normalizeSources([...defaultOpportunitySources(), ...configuredGlobalSources()]);
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
const generationProvider = new GenerationProvider();
const deliverableEngine = new DeliverableEngine({
  sandbox: realSandbox,
  generator: generationProvider,
  baseDir: process.env.NEVERA_DELIVERABLE_DIR ?? "/data/nevera-deliverables"
});
const savedDeliverables = Array.isArray(saved?.deliverables) ? saved.deliverables : [];
deliverableEngine.history.push(...savedDeliverables);
guardrails.losses = Number(saved?.guardrails?.losses ?? 0);
guardrails.cooldownRemaining = Number(saved?.guardrails?.cooldownRemaining ?? 0);
guardrails.peakBalance = Number(saved?.guardrails?.peakBalance ?? saved?.balance ?? initialBalance);
const telemetry = new Telemetry();
const objectiveManager = new ObjectiveManager();
const brain = new Brain(objectiveManager);
const decisionMemory = new DecisionMemory(saved?.decisionMemory ?? []);
const actionBudget = new ActionBudget({ maxActions: 3, maxCost: Number(process.env.NEVERA_MAX_CYCLE_COST ?? 1) });
const cycleController = new CycleController();
const longTermMemory = new LongTermMemory(saved?.longTermMemory ?? []);
const decisionFilter = new DecisionFilter();
const strategyLab = new StrategyLab(saved?.strategyLab ?? []);
const strategyMemory = new StrategyMemory(saved?.strategyMemory ?? []);
const riskMemory = new RiskMemory(saved?.riskMemory ?? []);
const runtime = new Runtime();
const recovery = new RecoveryManager();
const economicMemory = new EconomicMemory(saved?.economicMemory ?? []);
const failureMemory = new FailureMemory(saved?.failureMemory ?? []);
const opportunityEngine = new OpportunityEngine({ evaluator: evaluateOpportunity, maxQueue: 10, economicMemory, failureMemory, riskMemory });

const revenueEngine = new RevenueEngine(saved?.revenueEngine ?? {});
const executionPipeline = new RevenueExecutionPipeline({ generator: generationProvider });
executionPipeline.restore(saved?.executionPipeline?.records ?? []);
const paymentAdapter = new PaymentAdapter({ mode: revenueEngine.mode });
const browserWorker = new BrowserWorker({
  storageDir: process.env.NEVERA_BROWSER_STORAGE_DIR ?? "/data/nevera-browser",
  allowDomains: (process.env.NEVERA_BROWSER_ALLOWED_DOMAINS ?? "").split(",").map((v) => v.trim()).filter(Boolean),
  headless: String(process.env.NEVERA_BROWSER_HEADLESS ?? "true").toLowerCase() !== "false",
  timeoutMs: Math.max(3000, Number(process.env.NEVERA_BROWSER_TIMEOUT_MS ?? 15000)),
  automationEnabled: String(process.env.NEVERA_BROWSER_AUTOMATION ?? "false").toLowerCase() === "true"
});
const applicationEngine = new ApplicationEngine({ browser: browserWorker, generator: generationProvider });
applicationEngine.restore(saved?.applications ?? []);
const platformRegistry = createPlatformRegistry({
  browser: browserWorker,
  definitions: (process.env.NEVERA_PLATFORM_DOMAINS ?? "").split(";").map((entry) => {
    const [name, domains] = entry.split("=");
    return {
      name: String(name ?? "").trim(),
      domains: String(domains ?? "").split(",").map((v) => v.trim()).filter(Boolean)
    };
  }).filter((item) => item.name)
});
const applicationPolicy = new ApplicationPolicy({
  automationEnabled: String(process.env.NEVERA_AUTO_APPLY ?? "false").toLowerCase() === "true",
  maxApplicationsPerDay: Number(process.env.NEVERA_MAX_APPLICATIONS_PER_DAY ?? 10),
  minScore: Number(process.env.NEVERA_MIN_APPLICATION_SCORE ?? 70),
  allowedDomains: (process.env.NEVERA_BROWSER_ALLOWED_DOMAINS ?? "").split(",").map((v) => v.trim()).filter(Boolean)
});

const paymentWebhookPort = Number(process.env.NEVERA_PAYMENT_WEBHOOK_PORT ?? process.env.PORT ?? 8080);
const paymentWebhookHost = process.env.NEVERA_PAYMENT_WEBHOOK_HOST ?? "0.0.0.0";
const liveCheckoutEnabled = String(process.env.NEVERA_LIVE_CHECKOUTS ?? "false").toLowerCase() === "true";
const liveExecutionMode = paymentAdapter.liveAuthorized && liveCheckoutEnabled;
const outcomeProvider = liveExecutionMode
  ? async () => ({ status: "PENDING_PAYMENT", revenue: 0, cost: 0, net: 0 })
  : simulateOutcome;
const liveCheckoutMaxPerCycle = Math.max(1, Number(process.env.NEVERA_LIVE_MAX_CHECKOUTS_PER_CYCLE ?? 1));
const liveCheckoutMinIntervalMs = Math.max(0, Number(process.env.NEVERA_LIVE_MIN_INTERVAL_MS ?? 600000));
let lastLiveCheckoutAt = 0;

const paymentWebhookServer = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify({
      ok: true,
      service: "NEVERA",
      cycle: nevera?.snapshot?.().cycle ?? null,
      payment: paymentAdapter.status(),
      generation: generationProvider.status()
    }));
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/generation-test")) {
    const requestUrl = new URL(req.url, "http://nevera.local");
    const token = requestUrl.searchParams.get("token") ?? String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    const expected = String(process.env.NEVERA_DASHBOARD_TOKEN ?? "");
    const authorization = String(req.headers.authorization ?? "");
    const authorizedByHeader = authorization === `Bearer ${expected}` || (authorization.startsWith("Basic ") && (() => { try { const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8"); return decoded.endsWith(`:${expected}`); } catch { return false; } })());
    if (!expected || (token !== expected && !authorizedByHeader)) {
      res.writeHead(401, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ error: "UNAUTHORIZED" }));
      return;
    }
    try {
      const content = await generationProvider.generate({
        system: "You are NEVERA's production engine. Return only the requested test deliverable. Do not claim external actions were performed.",
        prompt: "Generate a short professional test deliverable in Portuguese proving that the connected generation provider can produce useful work. Include a title, three concrete bullet points and a final line: GERACAO_REAL_OK.",
        maxTokens: 700
      });
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify({
        ok: Boolean(content),
        generation: generationProvider.status(),
        content: content ?? null
      }));
    } catch (error) {
      res.writeHead(502, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify({ ok: false, generation: generationProvider.status(), error: String(error?.message ?? error) }));
    }
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/capital/funding-checkout")) {
    const requestUrl = new URL(req.url, "http://nevera.local");
    const token = requestUrl.searchParams.get("token") ?? String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    const expected = String(process.env.NEVERA_DASHBOARD_TOKEN ?? "");
    if (!expected || token !== expected) {
      res.writeHead(401, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ error: "UNAUTHORIZED" }));
      return;
    }
    if (realCapital.balance > 0) {
      res.writeHead(409, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ error: "REAL_CAPITAL_ALREADY_FUNDED", capital: realCapital.snapshot() }));
      return;
    }
    try {
      const paymentId = "CAPITAL-" + Date.now().toString(36).toUpperCase();
      const pix = await paymentAdapter.createPixPayment({
        paymentId,
        amount: Number(process.env.NEVERA_REAL_CAPITAL_TARGET ?? 10),
        title: "NEVERA — Capital inicial",
        payerEmail: process.env.NEVERA_CAPITAL_PAYER_EMAIL ?? "Kelvyncandeia@gmail.com",
        metadata: { channel: "CAPITAL_FUNDING", market: "BR", capitalFunding: true }
      });
      const qr = String(pix.qrCode ?? "");
      const safeQr = qr.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
      const safeUrl = String(pix.ticketUrl ?? "#").replace(/&/g,"&amp;").replace(/"/g,"&quot;");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end("<!doctype html><html><body style='font-family:system-ui;max-width:700px;margin:40px auto;padding:20px'><h1>NEVERA — Pix</h1><h2>R$ 10,00</h2><p>Copie o código abaixo no aplicativo do seu banco:</p><textarea style='width:100%;height:180px;font-size:13px' readonly>"+safeQr+"</textarea><p><a href='"+safeUrl+"'>Abrir pagamento Pix</a></p></body></html>");
    } catch (error) {
      res.writeHead(502, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ ok: false, error: String(error?.message ?? error) }));
    }
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/applications/submit")) {
    const requestUrl = new URL(req.url, "http://nevera.local");
    const token = requestUrl.searchParams.get("token") ?? String(req.headers.authorization ?? "").replace(/^Bearer\\s+/i, "");
    const expected = String(process.env.NEVERA_DASHBOARD_TOKEN ?? "");
    if (!expected || token !== expected) {
      res.writeHead(401, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ error: "UNAUTHORIZED" }));
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    let body = {};
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "INVALID_JSON" }));
      return;
    }
    const application = applicationEngine.records.find((item) => item.id === body.applicationId);
    if (!application) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "APPLICATION_NOT_FOUND" }));
      return;
    }
    const submittedToday = applicationEngine.records.filter((item) =>
      item.status === "SUBMITTED" &&
      item.submittedAt &&
      new Date(item.submittedAt).toDateString() === new Date().toDateString()
    ).length;
    const decision = applicationPolicy.canSubmit({
      score: Number(body.score ?? 0),
      url: body.url ?? application.url,
      submittedToday
    });
    if (!decision.allowed) {
      application.status = "DRAFT_ONLY";
      application.blockReason = decision.reason;
      application.updatedAt = new Date().toISOString();
      res.writeHead(409, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, decision, application, policy: applicationPolicy.snapshot() }));
      return;
    }
    const result = await applicationEngine.submit(application, {
      session: body.session ?? "default",
      url: body.url ?? application.url,
      selectors: body.selectors ?? {}
    });
    res.writeHead(result.status === "SUBMITTED" ? 200 : 409, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify({ ok: result.status === "SUBMITTED", application: result, policy: applicationPolicy.snapshot() }));
    return;
  }

  if (req.method === "GET" && req.url === "/payment-status") {
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify(paymentAdapter.status()));
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/payment/success")) {
    const paymentId = new URL(req.url, "http://nevera.local").searchParams.get("payment_id");
    const payment = revenueEngine.paymentIntents.find((item) => item.id === paymentId);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end("<html><body><h1>Pagamento recebido</h1><p>O pagamento foi confirmado pelo provedor. A NEVERA está preparando sua entrega.</p><p>Status: " +
      String(payment?.fulfillmentStatus ?? "PROCESSANDO") + "</p></body></html>");
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/deliverables/")) {
    const id = decodeURIComponent(req.url.slice("/deliverables/".length).split("?")[0]);
    const item = deliverableEngine.history.find((entry) => entry.id === id);
    if (!item) {
      res.writeHead(404, { "content-type": "application/json" }); res.end(JSON.stringify({ error: "DELIVERABLE_NOT_FOUND" })); return;
    }
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(item.filePath, "utf8");
    res.writeHead(200, { "content-type": "text/markdown; charset=utf-8", "cache-control": "no-store" });
    res.end(content);
    return;
  }

  if (req.method === "GET" && req.url === "/latest-checkout") {
    const livePayments = revenueEngine.paymentIntents
      .filter((item) => item?.checkout?.checkoutUrl && item?.checkout?.status === "CHECKOUT_CREATED")
      .slice(-1);
    const payment = livePayments[0];
    if (!payment) {
      res.writeHead(404, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ error: "CHECKOUT_NOT_FOUND", liveCheckoutEnabled }));
      return;
    }
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify({
      paymentId: payment.id,
      offerId: payment.offerId,
      amount: payment.amount,
      currency: payment.currency,
      checkoutUrl: payment.checkout.checkoutUrl,
      status: payment.checkout.status
    }));
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/pay/")) {
    const paymentId = decodeURIComponent(req.url.slice("/pay/".length).split("?")[0]);
    const payment = revenueEngine.paymentIntents.find((item) => item.id === paymentId);
    const checkoutUrl = payment?.checkout?.checkoutUrl;
    if (!checkoutUrl) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "CHECKOUT_NOT_FOUND", paymentId }));
      return;
    }
    res.writeHead(302, { location: checkoutUrl, "cache-control": "no-store" });
    res.end();
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/capital/reconcile")) {
    const requestUrl = new URL(req.url, "http://nevera.local");
    const token = requestUrl.searchParams.get("token") ?? String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
    const expected = String(process.env.NEVERA_DASHBOARD_TOKEN ?? "");
    if (!expected || token !== expected) {
      res.writeHead(401, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ error: "UNAUTHORIZED" }));
      return;
    }
    if (paymentAdapter.provider !== "MERCADOPAGO" || !paymentAdapter.liveAuthorized) {
      res.writeHead(409, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ error: "MERCADOPAGO_NOT_AUTHORIZED" }));
      return;
    }
    try {
      const response = await fetch("https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=50", {
        headers: { authorization: "Bearer " + paymentAdapter.mercadoPagoAccessToken }
      });
      if (!response.ok) throw new Error("MERCADO_PAGO_SEARCH_HTTP_" + response.status);
      const payload = await response.json();
      const payment = (payload.results ?? []).find((item) =>
        String(item.status ?? "").toLowerCase() === "approved" &&
        String(item.external_reference ?? "").startsWith("CAPITAL-")
      );
      if (!payment) {
        res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
        res.end(JSON.stringify({ ok: true, found: false, capital: realCapital.snapshot() }));
        return;
      }
      if (realCapital.balance <= 0) {
        realCapital.fund(Number(payment.transaction_amount), "MERCADOPAGO_CAPITAL_RECONCILIATION", true);
        const state = (await persistence.load()) ?? {};
        state.realCapital = realCapital.snapshot();
        state.revenueEngine = revenueEngine.snapshot();
        state.deliverables = deliverableEngine.snapshot();
        await persistence.save(state);
      }
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ ok: true, found: true, paymentId: payment.id, amount: payment.transaction_amount, status: payment.status, capital: realCapital.snapshot() }));
    } catch (error) {
      res.writeHead(502, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ ok: false, error: String(error?.message ?? error) }));
    }
    return;
  }

  if (req.method !== "POST" || !req.url.startsWith("/webhooks/payments")) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "NOT_FOUND" }));
    return;
  }
  const chunks = [];
  let size = 0;
  try {
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 1024 * 1024) throw new Error("PAYLOAD_TOO_LARGE");
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks);
    if (!paymentAdapter.verifyWebhook(rawBody, req.headers["x-nevera-signature"] ?? req.headers["stripe-signature"] ?? req.headers["x-signature"], { url: req.url, requestId: req.headers["x-request-id"] })) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "INVALID_SIGNATURE" }));
      return;
    }
    const event = await paymentAdapter.parseWebhook(rawBody);
    if (!["PAID", "SUCCEEDED", "COMPLETED", "PAYMENT_SUCCEEDED"].includes(event.status)) {
      res.writeHead(202, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, ignored: event.status }));
      return;
    }
    if (!event.paymentId) {
      res.writeHead(202, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, ignored: "NO_NEVERA_PAYMENT_ID", eventType: event.eventType }));
      return;
    }
    if (event.capitalFunding) {
      if (realCapital.balance <= 0) {
        const fundedAmount = event.gross != null && String(event.currency ?? "BRL").toLowerCase() === "brl"
          ? Number(event.gross)
          : Number(event.gross ?? process.env.NEVERA_REAL_CAPITAL_TARGET ?? 10);
        realCapital.fund(fundedAmount, "MERCADOPAGO_CAPITAL_FUNDING", true);
      }
      const state = (await persistence.load()) ?? {};
      state.realCapital = realCapital.snapshot();
      state.revenueEngine = revenueEngine.snapshot();
      state.deliverables = deliverableEngine.snapshot();
      state.executionPipeline = executionPipeline.snapshot();
      await persistence.save(state);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, capitalFunding: true, capital: realCapital.snapshot() }));
      return;
    }
    const existingPayment = revenueEngine.paymentIntents.find((item) => item.id === event.paymentId);
    const confirmed = revenueEngine.confirmPayment(event.paymentId, { gross: event.gross, fees: event.fees });
    const offer = revenueEngine.offers.find((item) => item.id === confirmed.offerId);
    let fulfillment = null;
    const pipelineRecord = executionPipeline.records.find((item) => item.paymentId === confirmed.id || item.id === offer?.pipelineId);
    if (!existingPayment?.fulfillmentId && offer?.opportunity) {
      try {
        fulfillment = await deliverableEngine.fulfill(offer.opportunity);
        confirmed.fulfillmentId = fulfillment.id;
        confirmed.fulfillmentStatus = fulfillment.status;
        if (pipelineRecord) {
          executionPipeline.markPaid(pipelineRecord, confirmed.id, fulfillment.id);
          if (fulfillment.status === "DELIVERED") {
            executionPipeline.markDelivered(pipelineRecord, fulfillment.id);
          } else {
            executionPipeline.markFulfillmentFailed(pipelineRecord, "DELIVERABLE_NOT_CONFIRMED");
          }
        }
      } catch (error) {
        confirmed.fulfillmentStatus = "FAILED";
        if (pipelineRecord) {
          executionPipeline.markPaid(pipelineRecord, confirmed.id);
          executionPipeline.markFulfillmentFailed(pipelineRecord, error.message);
        }
        telemetry.record("FULFILLMENT_ERROR", { paymentId: confirmed.id, offerId: offer?.id ?? null, message: error.message });
      }
    }
    const state = (await persistence.load()) ?? {};
    state.revenueEngine = revenueEngine.snapshot();
    state.deliverables = deliverableEngine.snapshot();
    state.realCapital = realCapital.snapshot();
    state.executionPipeline = executionPipeline.snapshot();
    await persistence.save(state);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, paymentId: confirmed.id, status: confirmed.status }));
  } catch (error) {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  }
});
paymentWebhookServer.listen(paymentWebhookPort, paymentWebhookHost, () => {
  console.log(`NEVERA payment webhook listening on ${paymentWebhookHost}:${paymentWebhookPort}`);
});

const revenueCategories = [
  "DIGITAL_SERVICES",
  "BUSINESS_AUTOMATION",
  "CONTENT_AND_MEDIA",
  "DIGITAL_PRODUCTS",
  "ECOMMERCE",
  "DATA_AND_RESEARCH",
  "MICRO_SAAS",
  "APPS_AND_TOOLS",
  "AFFILIATE_MARKETING",
  "B2B_CONTRACTS",
  "ARBITRAGE",
  "INVESTMENT_RESEARCH"
];



const dynamicMarket = new DynamicMarket(
  saved?.marketSeed ?? 42,
  saved?.marketEvents ?? null
);

nevera.boot();
brain.setObjective("Descobrir, testar, executar e otimizar continuamente múltiplas fontes legítimas e sustentáveis de receita");

const agent = new NeveraAgent(
  nevera,
  brain,
  tools,
  chooseOpportunity,
  market,
  outcomeProvider,
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
    guardrails,
    maxCycleCost: Number(process.env.NEVERA_MAX_CYCLE_COST ?? 1)
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
  guardrails.observe(nevera.snapshot().economy.balance);
  guardrails.tick();
  telemetry.record("CYCLE_START", { cycle });
  const publicSources = await discovery.scan();
  const publicOpportunities = translatePublicSignals(publicSources);
  const opportunityBatch = opportunityEngine.discover(publicOpportunities, nevera.snapshot().economy.balance);
  for (const item of opportunityBatch) {
    if (decisionFilter.repeatedFailure(item.opportunity, failureMemory)) decisionFilter.reject(item.opportunity, "REPEATED_CATEGORY_FAILURE");
  }
  const portfolioSelection = buildPortfolio(opportunityBatch.map((item) => item.opportunity), { maxItems: 3 });
  const publicTasks = guardrails.snapshot().cooldownRemaining > 0 || guardrails.snapshot().killSwitch
    ? []
    : planPublicTasks(portfolioSelection);
  const opportunityStats = opportunityMetrics(opportunityBatch);
  const requestedOfferLimit = paymentAdapter.liveAuthorized && liveCheckoutEnabled
    ? liveCheckoutMaxPerCycle
    : 5;
  const qualifiedOpportunities = [];
  for (const item of opportunityBatch) {
    const opportunity = { ...item.opportunity, score: item.evaluation?.viabilityScore ?? item.opportunity?.score ?? 0 };
    const pipelineRecord = executionPipeline.qualify(opportunity, item.evaluation ?? {});
    if (!pipelineRecord.duplicate && pipelineRecord.status === "QUALIFIED") {
      await executionPipeline.prepareProposal(pipelineRecord, opportunity);
    }
    if (pipelineRecord.status === "PROPOSAL_READY") {
      const application = applicationEngine.prepare({
        ...opportunity,
        automationPolicy: opportunity.automationPolicy ?? "DRAFT_ONLY"
      });
      await applicationEngine.generateProposal(application, opportunity);
      qualifiedOpportunities.push({ ...opportunity, score: pipelineRecord.score, pipelineId: pipelineRecord.id, applicationId: application.id });
    }
  }
  const revenueOffers = revenueEngine.cycle({
    opportunities: qualifiedOpportunities,
    maxOffers: requestedOfferLimit
  });
  for (const offer of revenueOffers) {
    try {
      if (paymentAdapter.liveAuthorized && !liveCheckoutEnabled) {
        telemetry.record("LIVE_CHECKOUT_BLOCKED", { cycle, offer: offer.id, reason: "EXPLICIT_LIVE_CHECKOUTS_REQUIRED" });
        continue;
      }
      if (paymentAdapter.liveAuthorized && liveCheckoutEnabled && Date.now() - lastLiveCheckoutAt < liveCheckoutMinIntervalMs) {
        telemetry.record("LIVE_CHECKOUT_THROTTLED", { cycle, offer: offer.id, minIntervalMs: liveCheckoutMinIntervalMs });
        continue;
      }
      const payment = revenueEngine.createPaymentIntent(offer);
      if (paymentAdapter.liveAuthorized) lastLiveCheckoutAt = Date.now();
      const checkout = await paymentAdapter.createCheckout({
        paymentId: payment.id,
        offerId: offer.id,
        amount: offer.amount,
        currency: offer.currency,
        title: offer.title,
        metadata: { channel: offer.channel, market: offer.market }
      });
      payment.checkout = checkout;
      payment.provider = checkout.provider ?? payment.provider;
      if (paymentAdapter.liveAuthorized && checkout.status === "CHECKOUT_CREATED") lastLiveCheckoutAt = Date.now();
    } catch (error) {
      const payment = revenueEngine.paymentIntents.at(-1);
      if (payment?.offerId === offer.id) {
        payment.status = "CHECKOUT_FAILED";
        payment.checkout = {
          mode: "LIVE",
          provider: paymentAdapter.provider,
          paymentId: payment.id,
          status: "CHECKOUT_FAILED",
          error: String(error?.message ?? "CHECKOUT_FAILED").slice(0, 500),
          failedAt: new Date().toISOString()
        };
      }
      telemetry.record("PAYMENT_ADAPTER_ERROR", { cycle, offer: offer.id, message: error.message });
    }
  }
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
  const meta = metaLearn({ strategies: portfolio.stats(), experiments: experiments.recent(20), failures: learning.stats().failures ?? 0 });
  const strategy = portfolio.choose(cycle);
  const mutation = strategyLab.mutate(strategy, portfolio.stats().find((item) => item.strategy === strategy.name));
  const mutationTest = testStrategy(mutation, market.available(), { cycles: 8, seed: cycle * 101, regime: cycle % 4 === 0 ? "SHOCK" : cycle % 3 === 0 ? "RECESSION" : "STABLE" });
  strategyMemory.record(mutation, mutationTest);
  if (mutationTest.verdict === "PROMOTE") {
    strategyLab.promote(mutation.name);
    portfolio.addStrategy(mutation);
  } else if (mutationTest.verdict === "REJECT") {
    strategyLab.demote(mutation.name);
  }
  longTermMemory.remember("STRATEGY_TEST", mutationTest);
  longTermMemory.remember("META_LEARNING", meta);
  const cycleDecision = cycleController.decide({
    balance: nevera.snapshot().economy.balance,
    drawdown: initialBalance > 0 ? 1 - nevera.snapshot().economy.balance / initialBalance : 1,
    failures: learning.stats().failures ?? 0,
    confidence: learning.stats().successRate ?? 0
  });
  longTermMemory.remember("CYCLE_DECISION", { cycle, strategy: strategy.name, decision: cycleDecision });
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
  const balanceBeforeAction = nevera.snapshot().economy.balance;
  let result;
  try {
    result = await agent.cycle(strategy, { maxActions: Math.min(throughput.current, cycleDecision.actions) });
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

  const balanceAfterAction = nevera.snapshot().economy.balance;
  for (const item of result.actions ?? []) {
    const outcome = item.action?.outcome;
    const opportunity = item.opportunity ?? null;
    if (!outcome || !opportunity) continue;
    const actionEvaluation = evaluateAction({ opportunity, outcome, balanceBefore: item.action?.balanceBefore ?? balanceBeforeAction, balanceAfter: item.action?.balanceAfter ?? balanceAfterAction });
    const risk = opportunity.risk ?? 0;
    economicMemory.record(opportunity, outcome);
    failureMemory.record(opportunity, outcome);
    riskMemory.record(opportunity, { score: risk, exposure: balanceBeforeAction > 0 ? opportunity.estimatedCost / balanceBeforeAction : 1 }, outcome);
    guardrails.record(outcome.net);
    portfolio.record(strategy, outcome);
    strategyMemory.record(strategy, { ...actionEvaluation, score: result.score ?? 0, verdict: outcome.status === "SUCCESS" ? "SUCCESS" : "FAILURE" });
    longTermMemory.remember("ACTUAL_OUTCOME", { cycle, opportunity: opportunity.name, outcome, actionEvaluation });
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
    status: nevera.snapshot().status,
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
    deliverables: deliverableEngine.snapshot(),
    executionPipeline: executionPipeline.snapshot(),
    generation: generationProvider.status(),
    telemetry: telemetry.snapshot(),
    runtime: runtime.snapshot(),
    publicOpportunities,
    publicTasks,
    opportunityStats,
    revenueEngine: { ...revenueEngine.snapshot(), paymentAdapter: paymentAdapter.status() },
    executionPipeline: executionPipeline.snapshot(),
    applications: applicationEngine.snapshot(),
    browser: { ...browserWorker.status(), platforms: [...platformRegistry.keys()], applicationPolicy: applicationPolicy.snapshot() },
    realCapital: realCapital.snapshot(),
    opportunityQueue: opportunityEngine.snapshot(),
    economicMemory: economicMemory.export(),
    failureMemory: failureMemory.export(),
    survival: survivalMetrics({
      initialBalance,
      currentBalance: nevera.snapshot().economy.balance,
      failures: learning.stats().failures ?? 0,
      cycles: cycleLimit === Infinity ? 0 : cycleLimit
    }),
    decisionMemory: decisionMemory.export(),
    riskMemory: riskMemory.export(),
    economicSandbox: { mode: "ANALYTICS_ONLY" },
    longTermMemory: longTermMemory.export(),
    cycleController: cycleController.snapshot(),
    decisionFilter: decisionFilter.recent(),
    strategyMemory: strategyMemory.export(),
    strategyLab: strategyLab.list(),
    objective: objectiveManager.snapshot(),
    recovery: recovery.snapshot(),
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
  revenueEngine: { ...revenueEngine.snapshot(), paymentAdapter: paymentAdapter.status() },
  persistence: "LIVE_PERSISTENCE"
}, null, 2));
