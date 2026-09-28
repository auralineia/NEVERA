# Segurança da NEVERA

## Princípios

- Nunca colocar private keys, seed phrases, API keys, access tokens ou arquivos de carteira no GitHub.
- A NEVERA permanece isolada de Aura/RIMAK e não reutiliza credenciais de outros projetos.
- O estado econômico inicial é virtual/simulado.
- Pagamentos, transferências, carteiras e dinheiro real permanecem desabilitados na fase atual.

## Sandbox

A camada externa permite somente operações públicas explicitamente autorizadas, sem credenciais e sem pagamentos.

O kill switch e os limites econômicos devem permanecer disponíveis no ambiente de execução.

## Preflight

Antes de uma execução de beta, `npm run preflight` verifica:

- Node.js 20+;
- arquivos e scripts essenciais;
- ausência de variáveis de ambiente sensíveis;
- kill switch inativo;
- dinheiro real explicitamente desabilitado.

## Próxima fase

Qualquer experimento com dinheiro real deverá ser tratado como uma fase separada, com limites independentes, revisão de segurança e opt-in explícito. Nenhuma capacidade de dinheiro real é ativada automaticamente pela NEVERA.
