# Automaton Experiment — Setup Notes

> Base experimental project. No wallet, API key, seed phrase or real funds are stored here.

## Upstream

Automaton upstream repository:
https://github.com/Conway-Research/automaton

Current upstream package version checked: **0.2.1**.

The upstream project requires Node.js >=20 and uses pnpm 10.28.1. Its normal source install is `pnpm install`, `pnpm build`, then `node dist/index.js --run`.

## Important current limitation

As of September 2026, there are open reports of Conway API/SIWE provisioning failures and API 404s. Therefore **do not fund or run a production-like autonomous agent yet**.

We will first validate the runtime and setup path, with zero funds.

## Experiment rules

- Separate wallet only.
- Zero balance during setup.
- No Aura/RIMAK credentials.
- No automatic replication.
- No autonomous financial transfers beyond manually approved limits.
- Record costs and revenue separately.

## Next step

Run the upstream code in an isolated environment and stop at the first setup/provisioning issue. Do not add secrets to this repository.
