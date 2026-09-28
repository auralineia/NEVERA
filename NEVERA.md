# NEVERA

NEVERA é um agente autônomo experimental desenvolvido do zero neste projeto.

## Conceito

NEVERA possui um saldo operacional, recebe objetivos, executa ações permitidas, contabiliza receitas e despesas e precisa manter recursos suficientes para continuar operando.

### Ciclo

**PERCEBER → PENSAR → PLANEJAR → AGIR → OBSERVAR → CONTABILIZAR → REPETIR**

## Regra de sobrevivência

Na primeira fase, o dinheiro é **100% virtual**.

Saldo inicial de simulação: **R$10,00**

Se o saldo chegar a **R$0,00**, NEVERA entra no estado:

**DEAD**

Um agente DEAD não executa novas ações até ser reiniciado manualmente.

## Economia

Toda operação deve registrar:

- receita;
- despesa;
- saldo anterior;
- saldo posterior;
- motivo;
- resultado;
- timestamp.

## Segurança

NEVERA não terá acesso à Aura/RIMAK, às suas carteiras ou às suas credenciais.

A replicação de agentes ficará desativada na primeira fase.

Nenhum dinheiro real será utilizado enquanto o sistema não passar pelos testes de simulação.
