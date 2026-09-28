export class HypothesisEngine {
  generate({ strategy, strategyStats = [], experimentStats = {} }) {
    const current = strategyStats.find((item) => item.strategy === strategy.name);

    if (!current || current.attempts < 2) {
      return `Testar ${strategy.name} para obter evidência suficiente antes de concluir seu desempenho.`;
    }

    if (current.successRate >= 0.7 && current.confidence >= 0.6) {
      return `A estratégia ${strategy.name} pode manter desempenho positivo com evidência suficiente; testar novamente para confirmar consistência.`;
    }

    if (current.successRate < 0.5) {
      return `A estratégia ${strategy.name} pode estar apresentando risco elevado ou retorno insuficiente; testar uma alternativa controlada.`;
    }

    if ((experimentStats.successRate ?? 0) < 0.5) {
      return `O conjunto atual de experimentos pode estar pouco eficiente; explorar uma estratégia diferente sem comprometer a reserva de capital.`;
    }

    return `Testar novamente ${strategy.name} para aumentar a evidência antes de alterar a estratégia.`;
  }
}
