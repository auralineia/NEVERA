import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const port = Number(process.env.NEVERA_DASHBOARD_PORT ?? 8787);
const statePath = process.env.NEVERA_STATE_FILE ?? "./nevera-state.json";

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
  const r=await fetch('/state',{cache:'no-store'}); const s=await r.json();
  const e=s.metrics||{},g=s.guardrails||{},rt=s.runtime||{},rc=s.recovery||{};
  const status=s.lastResult?.agent?.status||s.status||"UNKNOWN";
  const heartbeat=s.autonomousRuntime?.heartbeatAt||s.heartbeatAt||"—";
  document.getElementById('cards').innerHTML=[
   card("Saldo",s.balance),card("Ciclo",s.cycle),
   card("Status",status,status==="ALIVE"?"ok":"warn"),card("Receita líquida",e.net),
   card("Drawdown",e.maxDrawdown),card("Perdas",g.losses),
   card("Cooldown",g.cooldownRemaining,g.cooldownRemaining>0?"warn":"ok"),
   card("Restarts",rc.restarts??0,rc.restarts>0?"warn":"ok"),card("Heartbeat",heartbeat,"ok")
  ].join('');
  document.getElementById('details').textContent=JSON.stringify({
   objective:s.objective,runtime:rt,recovery:rc,guardrails:g,marketState:s.marketState,
   strategyLab:s.strategyLab?.slice(-5),riskMemory:s.riskMemory?.slice(-5),
   telemetry:s.telemetry?.slice?.(-10)||s.telemetry||null
  },null,2);
 }catch(error){document.getElementById('details').textContent="DASHBOARD_ERROR: "+error}
}
refresh();setInterval(refresh,2000);
</script></body></html>`;

createServer(async (req,res)=>{
 if(req.url==="/health"){
  try{await readFile(statePath,"utf8");res.writeHead(200,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify({ok:true,stateAvailable:true,checkedAt:new Date().toISOString()}))}
  catch{res.writeHead(503,{"content-type":"application/json"});res.end(JSON.stringify({ok:false,stateAvailable:false}))}
  return;
 }
 if(req.url==="/state"){
  try{const raw=await readFile(statePath,"utf8");res.writeHead(200,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});res.end(raw)}
  catch{res.writeHead(404,{"content-type":"application/json"});res.end(JSON.stringify({error:"STATE_NOT_AVAILABLE"}))}
  return;
 }
 res.writeHead(200,{"content-type":"text/html; charset=utf-8"});res.end(html);
}).listen(port,()=>console.log(`NEVERA dashboard: http://localhost:${port}`));