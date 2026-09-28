# NEVERA — Deployment

A execução contínua deve usar um worker/serviço persistente.

Requisitos:
- Node.js 20+
- armazenamento persistente para nevera-state.json
- variáveis de ambiente para limites
- NEVERA_KILL_SWITCH disponível para parada emergencial
- sem secrets no repositório

Variáveis:
- NEVERA_CYCLES=0 para modo contínuo
- NEVERA_CYCLE_DELAY_MS=5000
- NEVERA_RESERVE_RATIO=0.5
- NEVERA_MAX_OPERATION_COST=1
- NEVERA_DAILY_LOSS_LIMIT=2
- NEVERA_ALLOWED_DOMAINS=example.com
- NEVERA_SANDBOX_URL=https://example.com

O ambiente de produção inicial continua sem pagamentos, carteiras ou credenciais.
