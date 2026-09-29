# NEVERA — Ruflo Agent Instructions

## Mission
NEVERA is an autonomous-agent experiment. Preserve its existing safety model: simulation first, explicit authorization for real-money operations, auditable actions, and no secrets in Git.

## Ruflo operating policy
- Use a hierarchical swarm with a small specialized team.
- Prefer parallel read-only analysis; serialize conflicting writes.
- Never deploy or enable real-money operation as part of an autonomous coding task.
- Never commit secrets, tokens, API keys, seeds, wallet material, or production credentials.
- Before changing behavior, inspect the existing implementation and tests.
- Every code change must be followed by npm test and, when relevant, npm run preflight.
- Treat main as protected production code. Work on a feature branch and open a PR.
- Keep changes focused and reversible.

## NEVERA agent roles
1. architect — architecture and dependency impact
2. coder — implementation
3. tester — tests and regression checks
4. security — security/safety review
5. reviewer — final code review

## Critical NEVERA boundaries
- Payment mode remains SIMULATION unless a human explicitly changes environment configuration.
- Never place payment secrets in repository files.
- Never connect this experiment to Aura/RIMAK credentials or wallets.
- Do not modify unrelated repositories.

## Suggested workflow
Plan → inspect → implement → test → security review → review → PR.
