# NEVERA — Autonomous Revenue Operations

> Scope: NEVERA only. This document defines the intended end-to-end operating loop and acceptance gates. It does not enable live payments, external messaging, applications, purchases, trading, or other irreversible actions.

## Mission
Discover legitimate opportunities across markets, estimate feasibility and risk, prepare useful deliverables, support a human-approved route to customers, verify outcomes, and learn from evidence. NEVERA is a personal system; it is not a promise of earnings.

## Operating loop
1. **Discover:** ingest public opportunity sources and normalize each signal (source URL, captured time, market, category, requirements, deadline, and source evidence).
2. **Deduplicate and validate:** collapse repeated listings, reject expired or unverifiable items, retain provenance, and flag terms that prohibit automation.
3. **Evaluate:** estimate fit, effort, direct cost, delivery risk, likely value range, and confidence. Unknown values stay unknown; scores are prioritization aids, not a guarantee.
4. **Select a portfolio:** enforce per-cycle limits, budget/cooldown/kill-switch rules, category diversity, and repeat-failure memory.
5. **Prepare:** generate a specific work plan, draft proposal, and client-ready sample/deliverable. Mark AI-generated content as draft until reviewed; do not fabricate credentials, evidence, customer demand, or completed work.
6. **Human approval gate:** require explicit approval before sending a message, submitting an application, publishing, making a purchase, signing up, or committing funds. No unsolicited outreach.
7. **Commercial tracking:** track draft → approved → sent by user → response → accepted/rejected → work authorized → delivered → invoice/payment pending → payment verified. A generated checkout or invoice is not revenue.
8. **Fulfill and verify:** create the promised output within the authorized scope, store it persistently, check required files/quality criteria, and provide an honest delivery record.
9. **Reconcile and learn:** record only provider-confirmed receipts, net fees/costs, refunds, and disputes. Compare estimates with observed results and update strategy without treating simulations as cash.
10. **Report:** expose cycle status, source freshness, opportunities, decisions/reasons, drafts awaiting approval, delivery state, simulated balance, verified real receipts (if later authorized), costs, and errors.

## Opportunity portfolio
Keep discovery broad rather than tied to one offer:
- Digital services and content/media
- Business automation and workflow setup
- Research, data organization, and reports
- Digital products, apps, tools, and micro-SaaS validation
- E-commerce and affiliate opportunities, subject to platform rules and transparent disclosure
- Remote contract/work opportunities
- Investment research as informational analysis only; no autonomous trading or investment execution

## Safety and financial controls
- Default to simulation. Simulated balance, estimates, offers, and intents must be visibly labeled simulated/pending.
- Real payment collection remains disabled until separately configured and explicitly authorized. Never create or represent a live payment as successful without provider verification.
- No autonomous trading, borrowing, paid ads, purchases, subscriptions, legal commitments, or transfer of funds.
- Human approval is required for external communication, job applications, publishing, account creation, customer commitments, and any use of personal data.
- Respect source terms, privacy, copyright, spam rules, and applicable law. Use only data needed for the opportunity.
- Keep a kill switch, cycle spend cap, request throttling, retry limits, audit trail, and safe failure state.
- Do not claim income, clients, delivery, or self-sustainability without verifiable evidence.

## Dashboard requirements
Show:
- Runtime health, last successful cycle, next cycle, source errors/freshness
- Opportunity counts by discovered / screened / qualified / rejected, with rejection reasons
- Selected tasks and expected effort/cost/value range with confidence
- Drafts/proposals awaiting human review (not auto-sent)
- Deliverable checklist and artifact location
- Commercial status and payment reconciliation state
- Simulated funds separate from verified real capital and receipts
- Operating costs, failed runs, alerts, pause/kill-switch state, and audit history

## Release gates
### Gate A — Reliable simulation
- Unit/integration tests cover normalization, duplicate handling, scoring, limits, failure/retry behavior, persistence, and no-real-money invariants.
- Dashboard and state endpoint distinguish estimates, simulated values, and verified values.
- Restart preserves cycle state and records without double-counting.

### Gate B — Useful outputs
- Representative opportunities produce specific, reviewable deliverables rather than generic filler.
- Each output includes source, assumptions, quality checklist, and known limitations.
- Failed generation is recorded as failed, never marked delivered.

### Gate C — Human-operated commercial pilot
- User can review/edit/copy a proposal and approve each external action.
- Responses, authorization, scope, revisions, delivery, and payment status are recorded.
- A completed sale is counted only after independent payment confirmation.

### Gate D — Carefully authorized live payments
- Separate explicit authorization, verified provider configuration, webhook signature validation, idempotent reconciliation, refund/dispute handling, and end-to-end tests are required.
- Live mode is off by default and must never be enabled by a documentation or code change alone.

## Immediate implementation order
1. Verify current runtime and existing API contracts before touching production.
2. Add transparent opportunity lifecycle and evidence/provenance to persisted state.
3. Improve category-specific deliverable generation and automated quality checks.
4. Expose a mobile-friendly review queue and copy-ready drafts; keep sending manual.
5. Add test coverage for restart/idempotency and all financial safety invariants.
6. Run CI and a simulation-only pilot; review results before considering the next gate.

## Definition of “working”
A successful cycle means sources were processed and decisions/artifacts were persisted. It does **not** mean a customer was contacted, a job was won, a deliverable was accepted, or money was earned. Revenue means a provider-confirmed payment net of applicable fees/refunds.
