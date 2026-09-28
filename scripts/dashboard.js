import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const port = Number(process.env.NEVERA_DASHBOARD_PORT ?? 8787);
const statePath = (process.env.NEVERA_STATE_FILE ?? "./nevera-state.json").trim();
const publicMode = process.env.NEVERA_DASHBOARD_PUBLIC === "true";
const token = process.env.NEVERA_DASHBOARD_TOKEN ?? "";
const host = publicMode ? "0.0.0.0" : "127.0.0.1";

if (publicMode && !token) {
  throw new Error("DASHBOARD_TOKEN_REQUIRED");
}

function authorized(req) {
  if (!publicMode) return true;
  const header = req.headers.authorization ?? "";
  if (header === `Bearer ${token}`) return true;
  if (header.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
      const separator = decoded.indexOf(":");
      return separator >= 0 && decoded.slice(separator + 1) === token;
    } catch {
      return false;
    }
  }
  return false;
}

function unauthorized(res) {
  res.writeHead(401, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "www-authenticate": 'Basic realm="NEVERA"',
  });
  res.end(JSON.stringify({ error: "UNAUTHORIZED" }));
}

function publicState(state) {
  const guardrails = state.guardrails ?? {};
  const telemetry = Array.isArray(state.telemetry)
    ? state.telemetry
    : Array.isArray(state.telemetry?.events) ? state.telemetry.events : [];

  return {
    balance: state.balance,
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
    strategyLab: Array.isArray(state.strategyLab)
      ? state.strategyLab.slice(-5).map((s) => ({
          name: s.name,
          status: s.status,
          generation: s.generation
        }))
      : [],
    telemetry: telemetry.slice(-10)
      .map((event) => ({ type: event.type, at: event.at ?? event.timestamp }))
  };
}

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NEVERA — Operational Control</title>
<style>
body{font-family:system-ui;margin:0;padding:20px;background:#090909;color:#eee}h1{margin:0}.sub{color:#888;margin:4px 0 20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.card{padding:15px;border:1px solid #333;border-radius:12px;background:#111}.label{color:#999;font-size:12px}.value{font-size:23px;font-weight:700;margin-top:5px}.ok{border-color:#285b3a}.warn{border-color:#665522}pre{white-space:pre-wrap;overflow:auto;max-height:420px}.wide{margin-top:12px}
</style></head><body>
<h1>NEVERA</h1><div class="sub">Operational Control • atualização automática</div>
<div id="cards" class="grid"></div>
<div class="card wide"><h3>Operação</h3><pre id="details">carregando...</pre></div>
<script>
function card(k,v,c=""){return '<div class="card '+c+'"><div class="label">'+k+'</div><div class="value">'+String(v??"—")+'</div></div>'}
async function refresh(){
 try{
  const r=await fetch('/state',{cache:'no-store'}); if(!r.ok) throw new Error('HTTP '+r.status);
  const s=await r.json();
  const e=s.metrics||{},g=s.guardrails||{},rt=s.runtime||{},rc=s.recovery||{};
  const status=s.status||"UNKNOWN";
  const heartbeat=s.autonomousRuntime?.heartbeatAt||"—";
  document.getElementById('cards').innerHTML=[
   card("Saldo",s.balance),card("Ciclo",s.cycle),
   card("Status",status,status==="ALIVE"?"ok":"warn"),card("Receita líquida",e.net),
   card("Drawdown",e.maxDrawdown),card("Perdas",g.losses),
   card("Cooldown",g.cooldownRemaining,g.cooldownRemaining>0?"warn":"ok"),
   card("Restarts",rc.restarts??0,rc.restarts>0?"warn":"ok"),card("Heartbeat",heartbeat,"ok")
  ].join('');
  document.getElementById('details').textContent=JSON.stringify({
   objective:s.objective,runtime:rt,recovery:rc,guardrails:g,marketState:s.marketState,
   strategyLab:s.strategyLab,telemetry:s.telemetry
  },null,2);
 }catch(error){document.getElementById('details').textContent="DASHBOARD_ERROR: "+error}
}
refresh();setInterval(refresh,2000);
</script></body></html>`;

createServer(async (req,res)=>{
 if(!authorized(req)){ unauthorized(res); return; }

 if(req.url==="/health"){
  try{
   await readFile(statePath,"utf8");
   res.writeHead(200,{"content-type":"application/json","cache-control":"no-store"});
   res.end(JSON.stringify({ok:true,stateAvailable:true,checkedAt:new Date().toISOString()}));
  } catch {
   res.writeHead(503,{"content-type":"application/json","cache-control":"no-store"});
   res.end(JSON.stringify({ok:false,stateAvailable:false}));
  }
  return;
 }
 if(req.url==="/state"){
  try{
   const raw=await readFile(statePath,"utf8");
   const state=JSON.parse(raw);
   res.writeHead(200,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});
   res.end(JSON.stringify(publicState(state)));
  } catch (error) {
   res.writeHead(500,{"content-type":"application/json","cache-control":"no-store"});
   res.end(JSON.stringify({
    error:"STATE_NOT_AVAILABLE",
    code:error?.code ?? "UNKNOWN",
    message:error?.message ?? "STATE_READ_FAILED",
    statePath
   }));
  }
  return;
 }
 res.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store"});
 res.end(html);
}).listen(port,host,()=>console.log(`NEVERA dashboard listening on ${host}:${port}`));