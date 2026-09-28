import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const port = Number(process.env.NEVERA_DASHBOARD_PORT ?? 8787);
const statePath = process.env.NEVERA_STATE_FILE ?? "./nevera-state.json";

const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>NEVERA — Observabilidade</title>
<style>
body{font-family:system-ui;margin:0;padding:24px;background:#090909;color:#eee}
h1{margin:0 0 8px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.card{padding:16px;border:1px solid #333;border-radius:12px;background:#111}.label{color:#999;font-size:12px}.value{font-size:24px;font-weight:700;margin-top:6px}
pre{white-space:pre-wrap;overflow:auto}
</style></head>
<body><h1>NEVERA</h1><p>Estado local da simulação</p>
<div id="cards" class="grid"></div><div class="card"><h3>Decisões recentes</h3><pre id="details">carregando...</pre></div>
<script>
async function refresh(){
 const r=await fetch('/state'); const s=await r.json();
 const e=s.metrics||{}; const g=s.guardrails||{}; const rt=s.runtime||{};
 const cards={
  "Saldo":s.balance,
  "Ciclo":s.cycle,
  "Status":s.lastResult?.agent?.status||"—",
  "Receita líquida":e.net,
  "Drawdown máx.":e.maxDrawdown,
  "Falhas":s.learning?.filter?.(()=>false)||"ver memória",
  "Risco":g.losses,
  "Cooldown":g.cooldownRemaining
 };
 document.getElementById('cards').innerHTML=Object.entries(cards).map(([k,v])=>'<div class="card"><div class="label">'+k+'</div><div class="value">'+String(v??"—")+'</div></div>').join('');
 document.getElementById('details').textContent=JSON.stringify({
  objective:s.objective, strategyLab:s.strategyLab?.slice(-5), riskMemory:s.riskMemory?.slice(-5),
  marketState:s.marketState, runtime:rt, recovery:s.recovery
 },null,2);
}
refresh(); setInterval(refresh,2000);
</script></body></html>`;

createServer(async (req,res)=>{
  if(req.url==="/state"){
    try{
      const raw=await readFile(statePath,"utf8");
      res.writeHead(200,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});
      res.end(raw);
    }catch{
      res.writeHead(404,{"content-type":"application/json"});
      res.end(JSON.stringify({error:"STATE_NOT_AVAILABLE"}));
    }
    return;
  }
  res.writeHead(200,{"content-type":"text/html; charset=utf-8"});
  res.end(html);
}).listen(port,()=>console.log(`NEVERA dashboard: http://localhost:${port}`));
