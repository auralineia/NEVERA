import { createServer, request as httpRequest } from "node:http";
import { readFile } from "node:fs/promises";
import { GenerationProvider } from "../src/generation-provider.js";

const port = Number(process.env.NEVERA_DASHBOARD_PORT ?? 8787);
const statePath = (process.env.NEVERA_STATE_FILE ?? "./nevera-state.json").trim();
const publicMode = process.env.NEVERA_DASHBOARD_PUBLIC === "true";
const token = process.env.NEVERA_DASHBOARD_TOKEN ?? "";
const generationProvider = new GenerationProvider();
const host = publicMode ? "0.0.0.0" : "127.0.0.1";

if (publicMode && !token) throw new Error("DASHBOARD_TOKEN_REQUIRED");

function authorized(req) {
  if (!publicMode) return true;
  const header = req.headers.authorization ?? "";
  if (header === `Bearer ${token}`) return true;
  if (header.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
      const separator = decoded.indexOf(":");
      return separator >= 0 && decoded.slice(separator + 1) === token;
    } catch { return false; }
  }
  return false;
}

function unauthorized(res) {
  res.writeHead(401, {"content-type":"application/json; charset=utf-8","cache-control":"no-store","www-authenticate":'Basic realm="NEVERA"'});
  res.end(JSON.stringify({error:"UNAUTHORIZED"}));
}

function publicState(state) {
  const guardrails = state.guardrails ?? {};
  const telemetry = Array.isArray(state.telemetry) ? state.telemetry : Array.isArray(state.telemetry?.events) ? state.telemetry.events : [];
  const revenueEngine = state.revenueEngine ?? {};
  const offers = Array.isArray(revenueEngine.offers) ? revenueEngine.offers : [];
  const payments = Array.isArray(revenueEngine.paymentIntents) ? revenueEngine.paymentIntents : [];
  const opportunities = Array.isArray(state.publicOpportunities) ? state.publicOpportunities : [];
  const realCapital = { mode: "SIMULATION_ONLY", balance: 0, totalFunded: 0, totalSpent: 0, totalReturned: 0, fundingStatus: "SIMULATION_ONLY", transactions: [] };
  const executionPipeline = state.executionPipeline ?? { stats: {}, records: [] };
  const applications = Array.isArray(state.applications) ? state.applications : [];
  const browser = state.browser ?? {};

  return {
    balance: state.balance,
    realCapital,
    executionPipeline,
    applications: applications.slice(-20),
    browser: {
      automationEnabled: browser.automationEnabled ?? false,
      allowDomains: browser.allowDomains ?? [],
      activeSessions: browser.activeSessions ?? []
    },
    cycle: state.cycle,
    status: state.status ?? state.lastResult?.agent?.status ?? "UNKNOWN",
    metrics: state.metrics ?? null,
    objective: state.objective ?? null,
    runtime: state.runtime ?? null,
    recovery: state.recovery ?? null,
    autonomousRuntime: state.autonomousRuntime ?? null,
    marketState: state.marketState ?? null,
    guardrails: {
      losses: guardrails.losses ?? 0,
      cooldownRemaining: guardrails.cooldownRemaining ?? 0,
      killSwitch: guardrails.killSwitch ?? false,
      peakBalance: guardrails.peakBalance ?? null
    },
    opportunities: opportunities.slice(-20).map((item) => ({
      name: item.name,
      source: item.source,
      signal: item.signal,
      url: item.url,
      category: item.category,
      score: item.score ?? item.viability ?? null,
      status: item.status ?? "AVAILABLE"
    })),
    revenue: {
      mode: "SIMULATION",
      provider: revenueEngine.paymentAdapter?.provider ?? "HTTP",
      liveAuthorized: false,
      offersCreated: revenueEngine.stats?.offersCreated ?? 0,
      paymentsPending: revenueEngine.stats?.paymentsPending ?? 0,
      paymentsConfirmed: 0,
      grossRevenue: 0,
      netRevenue: 0,
      offers: offers.slice(-20),
      payments: payments.slice(-20).map((payment) => ({
        id: payment.id,
        offerId: payment.offerId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        checkoutStatus: payment.checkout?.status ?? null,
        checkoutUrl: payment.checkout?.checkoutUrl ?? null,
        checkoutError: payment.checkout?.error ?? null,
        createdAt: payment.createdAt,
        confirmedAt: payment.confirmedAt ?? null
      }))
    },
    strategyLab: Array.isArray(state.strategyLab) ? state.strategyLab.slice(-5).map((s) => ({name:s.name,status:s.status,generation:s.generation})) : [],
    telemetry: telemetry.slice(-10).map((event) => ({type:event.type,at:event.at ?? event.timestamp}))
  };
}

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NEVERA — Operational Control</title>
<style>
body{font-family:system-ui;margin:0;padding:20px;background:#090909;color:#eee}
h1{margin:0}.sub{color:#888;margin:4px 0 20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
.card{padding:15px;border:1px solid #333;border-radius:12px;background:#111}.label{color:#999;font-size:12px}.value{font-size:23px;font-weight:700;margin-top:5px}
.ok{border-color:#285b3a}.warn{border-color:#665522}.wide{margin-top:12px}.section{margin-top:12px}.rows{display:grid;gap:8px}
.row{padding:12px;border:1px solid #292929;border-radius:10px;background:#101010}.muted{color:#888;font-size:12px}.pill{display:inline-block;padding:3px 8px;border-radius:999px;background:#222;margin-right:5px;font-size:12px}
a{color:#9ad;text-decoration:none}a:hover{text-decoration:underline}.empty{color:#777;padding:12px}
pre{white-space:pre-wrap;overflow:auto;max-height:420px}
</style></head><body>
<h1>NEVERA</h1><div class="sub">Painel operacional • economia 100% simulada</div>
<div id="cards" class="grid"></div>
<div class="card wide"><h3>Oportunidades detectadas</h3><div id="opportunities" class="rows">carregando...</div></div>
<div class="card wide"><h3>Ofertas simuladas</h3><div id="payments" class="rows">carregando...</div></div>\n<div class="card wide"><h3>Pipeline de receita</h3><div id="pipeline" class="rows">carregando...</div></div>
<div class="card wide"><h3>Aplicações e navegador</h3><div id="applications" class="rows">carregando...</div></div>
<div class="card wide"><h3>Operação</h3><pre id="details">carregando...</pre></div>
<script>
function card(k,v,c=""){return '<div class="card '+c+'"><div class="label">'+k+'</div><div class="value">'+String(v??"—")+'</div></div>'}
function esc(v){return String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
async function refresh(){
 try{

  const r=await fetch('/state',{cache:'no-store'}); if(!r.ok) throw new Error('HTTP '+r.status);
  const s=await r.json(), e=s.metrics||{},g=s.guardrails||{},rt=s.runtime||{},recoveryState=s.recovery||{}, realCapital=s.realCapital||{}, rev=s.revenue||{};
  const status=s.status||"UNKNOWN", heartbeat=s.autonomousRuntime?.heartbeatAt||"—", pipeline=s.executionPipeline||{stats:{},records:[]};
  document.getElementById('cards').innerHTML=[
   card("Saldo virtual",s.balance),card("Capital real","DESATIVADO","warn"),card("Ciclo",s.cycle),card("Status",status,status==="ALIVE"?"ok":"warn"),card("Resultado simulado",e.net),
   card("Drawdown",e.maxDrawdown),card("Perdas",g.losses),card("Cooldown",g.cooldownRemaining,g.cooldownRemaining>0?"warn":"ok"),
    card("Ganhos simulados",e.net??0),card("Pagamentos reais","DESATIVADOS","warn"),card("Modo","SIMULAÇÃO","ok"),
   card("Live","DESATIVADO","warn"),card("Restarts",recoveryState.restarts??0,recoveryState.restarts>0?"warn":"ok"),card("Heartbeat",heartbeat,"ok"),card("Qualificadas",pipeline.stats?.qualified??0),card("Propostas",pipeline.stats?.proposalsReady??0),card("Em execução",pipeline.stats?.inProgress??0),card("Entregues",pipeline.stats?.delivered??0)
  ].join('');

  const ops=(s.opportunities||[]).slice().reverse();
  document.getElementById('opportunities').innerHTML=ops.length?ops.map(o=>'<div class="row"><strong>'+esc(o.name)+'</strong><div class="muted">'+esc(o.source)+' • '+esc(o.signal)+'</div><span class="pill">score: '+esc(o.score??"—")+'</span><span class="pill">'+esc(o.category??"RESEARCH")+'</span>'+(o.url?'<div><a href="'+esc(o.url)+'" target="_blank" rel="noopener">Abrir fonte</a></div>':'')+'</div>').join(''):'<div class="empty">Nenhuma oportunidade registrada ainda.</div>';

  const payments=(rev.payments||[]).slice().reverse();
  document.getElementById("payments").innerHTML=payments.length?payments.map(p=>'<div class="row"><strong>'+esc(p.id)+'</strong> • '+esc(p.amount)+' '+esc(p.currency)+'<div class="muted">Oferta: '+esc(p.offerId)+' • status: SIMULADO</div></div>').join(""):'<div class="empty">Nenhuma oferta simulada registrada ainda.</div>';

  const browser=s.browser||{}, apps=(s.applications||[]).slice().reverse();
  document.getElementById('applications').innerHTML='<div class="row"><strong>Navegador: '+(browser.automationEnabled?'ATIVO':'MODO RASCUNHO')+'</strong><div class="muted">Domínios autorizados: '+esc((browser.allowDomains||[]).join(', ')||'nenhum')+'</div></div>'+(apps.length?apps.slice(0,20).map(a=>'<div class="row"><strong>'+esc(a.title)+'</strong><div class="muted">'+esc(a.id)+' • '+esc(a.status)+' • política: '+esc(a.policy)+'</div>'+(a.proposal?'<pre>'+esc(a.proposal)+'</pre>':'')+'</div>').join(''):'<div class="empty">Nenhuma aplicação preparada.</div>');

  const records=(pipeline.records||[]).slice().reverse();
  document.getElementById('pipeline').innerHTML=records.length?records.slice(0,20).map(o=>'<div class="row"><strong>'+esc(o.title)+'</strong><div class="muted">'+esc(o.company??"")+' • '+esc(o.category??"")+'</div><span class="pill">score: '+esc(o.score??"—")+'</span><span class="pill">'+esc(o.stage??o.status)+'</span><span class="pill">estimado: '+esc(o.estimatedRevenue??0)+' '+esc(o.market??"BR")+'</span>'+(o.applicationUrl?'<div><a href="'+esc(o.applicationUrl)+'" target="_blank" rel="noopener">Abrir oportunidade</a></div>':'')+(o.proposal?.content?'<div class="muted" style="margin-top:6px">Proposta pronta para revisão/uso: '+esc(o.proposal.status)+'</div>':'')+'</div>').join(''):'<div class="empty">Nenhuma oportunidade qualificada ainda.</div>';

  document.getElementById('details').textContent=JSON.stringify({objective:s.objective,runtime:rt,recovery:recoveryState,guardrails:g,revenue:rev,executionPipeline:pipeline,applications:s.applications,browser:s.browser,realCapital:realCapital,marketState:s.marketState,strategyLab:s.strategyLab,telemetry:s.telemetry},null,2);
 }catch(error){document.getElementById('details').textContent="DASHBOARD_ERROR: "+error}
}
refresh();setInterval(refresh,2000);
</script></body></html>`;

function proxyPaymentRequest(req,res){
 const targetPort=Number(process.env.NEVERA_PAYMENT_WEBHOOK_PORT ?? process.env.PORT ?? 8080);
 const options={hostname:"127.0.0.1",port:targetPort,path:req.url,method:req.method,headers:{...req.headers,host:`127.0.0.1:${targetPort}`,...(req.url.startsWith('/capital/reconcile')?{authorization:`Bearer ${token}`}:{})}};
 const upstream=httpRequest(options,upstreamRes=>{res.writeHead(upstreamRes.statusCode??502,upstreamRes.headers);upstreamRes.pipe(res)});
 upstream.on("error",error=>{res.writeHead(502,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify({error:"PAYMENT_SERVICE_UNAVAILABLE",message:error.message}))});
 req.pipe(upstream);
}

createServer(async(req,res)=>{
 if(req.url.startsWith("/generation-test")){
  if(!authorized(req)){unauthorized(res);return}
  try{
    const requestUrl=new URL(req.url,"http://nevera.local");
    const queryToken=requestUrl.searchParams.get("token")??"";
    if(!token || queryToken!==token){res.writeHead(401,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify({error:"UNAUTHORIZED"}));return}
    const content=await generationProvider.generate({
      system:"You are NEVERA's production engine. Return only the requested test deliverable. Do not claim external actions were performed.",
      prompt:"Generate a short professional test deliverable in Portuguese proving that the connected generation provider can produce useful work. Include a title, three concrete bullet points and a final line: GERACAO_REAL_OK.",
      maxTokens:700
    });
    res.writeHead(200,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});
    res.end(JSON.stringify({ok:Boolean(content),generation:generationProvider.status(),content:content??null}));
  }catch(error){
    res.writeHead(502,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});
    res.end(JSON.stringify({ok:false,generation:generationProvider.status(),error:String(error?.message??error)}));
  }
  return;
}
 if(req.url==="/latest-checkout"||req.url.startsWith("/pay/")||req.url.startsWith("/capital/funding-checkout")||req.url.startsWith("/capital/reconcile")||req.url.startsWith("/webhooks/payments")){res.writeHead(410,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify({ok:false,mode:"SIMULATION_ONLY",error:"REAL_PAYMENTS_DISABLED"}));return}
 if(req.url==="/payment-status"||req.url==="/health"){proxyPaymentRequest(req,res);return}
 if(!authorized(req)){unauthorized(res);return}
 if(req.url==="/health"){
  try{await readFile(statePath,"utf8");res.writeHead(200,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify({ok:true,stateAvailable:true,checkedAt:new Date().toISOString()}))}
  catch{res.writeHead(503,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify({ok:false,stateAvailable:false}))}
  return
 }
 if(req.url==="/state"){
  try{const raw=await readFile(statePath,"utf8"),state=JSON.parse(raw);res.writeHead(200,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});res.end(JSON.stringify(publicState(state)))}
  catch(error){res.writeHead(500,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify({error:"STATE_NOT_AVAILABLE",code:error?.code??"UNKNOWN",message:error?.message??"STATE_READ_FAILED",statePath}))}
  return
 }
 res.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store"});res.end(html);
}).listen(port,host,()=>console.log(`NEVERA dashboard listening on ${host}:${port}`));