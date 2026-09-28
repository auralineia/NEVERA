# Arquitetura inicial da NEVERA

## Componentes

### 1. Core
Controla o ciclo de vida e o estado do agente.

Estados iniciais:

- BOOTING
- ALIVE
- WORKING
- WAITING
- DEAD

### 2. Brain
Recebe o estado atual e produz um plano de ação.

O Brain não movimenta dinheiro diretamente.

### 3. Task Engine
Mantém objetivos e tarefas disponíveis.

### 4. Action Layer
Executa somente ações previamente permitidas.

### 5. Economy
Mantém o livro-caixa e calcula o saldo.

### 6. Survival Manager
Verifica se o saldo cobre os custos necessários para continuar.

### 7. Memory
Guarda experiências relevantes, resultados e decisões.

### 8. Audit Log
Registra todas as decisões e operações para permitir análise posterior.

## Primeira versão

A primeira versão será uma simulação local, sem carteira real, sem pagamentos reais e sem replicação.
