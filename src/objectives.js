export class ObjectiveManager {
  constructor() {
    this.current = "Preservar capital e encontrar receita sustentável";
    this.history = [];
  }

  update({ balance, initialBalance, successRate = 0, failures = 0 }) {
    const next = balance <= 0
      ? "Sobreviver: interromper operações e preservar o estado"
      : failures >= 3
        ? "Recuperar: reduzir risco e testar apenas operações conservadoras"
        : successRate >= 0.6
          ? "Expandir: buscar oportunidades sustentáveis com risco controlado"
          : balance < initialBalance
            ? "Recuperar capital: priorizar baixo custo e alta previsibilidade"
            : "Aprender: testar oportunidades com custo controlado";
    if (next !== this.current) {
      this.history.push({ from: this.current, to: next, timestamp: new Date().toISOString() });
      this.current = next;
    }
    return this.current;
  }

  snapshot() {
    return { current: this.current, history: this.history.slice() };
  }
}
