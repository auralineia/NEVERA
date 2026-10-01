# Automaton Experiment

Projeto experimental separado para estudar e testar o Automaton, da Conway Research.

## Regra principal de isolamento

Este repositório é independente dos projetos Aura/RIMAK.

- Não usar nem armazenar chaves privadas, seeds ou credenciais da Aura/RIMAK.
- Não conectar este experimento às carteiras da Aura/RIMAK.
- Não alterar os repositórios `auralineia/Aura-line` ou `auralineia/-aura-mobile`.
- Qualquer carteira criada para o experimento deve ser exclusiva deste projeto.
- O experimento deve permanecer sem fundos reais até a configuração ser revisada.

## Objetivo inicial

Preparar uma execução controlada do Automaton e medir:

1. custo de infraestrutura;
2. custo de inferência;
3. receitas realmente recebidas;
4. saldo líquido;
5. tarefas executadas;
6. falhas e ações automáticas.

O primeiro teste financeiro, quando a infraestrutura estiver validada, terá orçamento máximo de R$10.

> R$10 é um limite experimental, não uma expectativa de lucro.

## Status

Base inicial criada. Próximo passo: preparar a estrutura de execução do Automaton sem colocar nenhum segredo no GitHub.


## Real Sandbox

A primeira ponte com o mundo real é deliberadamente sem dinheiro:
- somente requisições HTTPS;
- domínios permitidos explicitamente;
- nenhum pagamento;
- nenhuma carteira;
- nenhuma credencial;
- limite de custo por operação;
- reserva mínima de sobrevivência;
- limite de perdas;
- kill switch via `NEVERA_KILL_SWITCH=1`.

Execute com `npm run sandbox`.


## Continuous runtime

Para manter o processo executando continuamente:
`NEVERA_CYCLES=0 NEVERA_CYCLE_DELAY_MS=5000 npm start`

O modo contínuo ainda é exclusivamente simulado. O Real Sandbox é separado e não movimenta dinheiro.


## Operação atual

O fluxo operacional da NEVERA agora inclui:

1. descoberta de sinais públicos;
2. normalização das fontes;
3. transformação em oportunidades;
4. avaliação de viabilidade;
5. ranking econômico;
6. planejamento de tarefas;
7. execução somente através do sandbox;
8. telemetria e recuperação de falhas;
9. persistência do estado.

A camada econômica continua simulada. Não há pagamentos, carteiras ou credenciais reais.


## Global Revenue Engine

A camada de receita agora foi estruturada para operar globalmente, sem limitar a NEVERA ao Brasil.

- mercados internacionais e múltiplas moedas;
- seleção de mercado e método de cobrança por oferta;
- precificação por canal e mercado;
- propostas/ofertas com identificador próprio;
- payment intents e ledger de receita;
- canais de receita múltiplos;
- arquitetura preparada para adaptadores de provedores de pagamento.

### Canais

A NEVERA pode testar serviços digitais, automação empresarial, conteúdo e mídia, produtos digitais, e-commerce, dados e pesquisa, micro-SaaS, apps e ferramentas, afiliados, contratos B2B, arbitragem legítima e pesquisa de investimentos.

### Pagamentos

O Revenue Engine está conectado ao ciclo operacional, mas **pagamentos reais continuam desativados** até que um provedor seja configurado e a camada de autorização seja revisada. O sistema não armazena dados de cartão, chaves privadas ou credenciais de pagamento no GitHub.

O modo atual é de simulação e serve para validar oferta, preço, mercado, fluxo de cobrança, telemetria e persistência antes de qualquer movimentação financeira real.


## Simulation-only operation

The deployed NEVERA is locked to simulation mode. Real checkout creation, payment reconciliation, payment redirects, and payment webhooks are disabled in the application. Simulated outcomes and balances are experimental estimates only; they are not received revenue, available funds, or a promise of profitability.

Keep payment credentials out of the repository. Any future request to enable real-money operations requires a separate security review and explicit authorization.
