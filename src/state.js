export function operationalState({
  nevera,
  runtime,
  recovery,
  telemetry,
  guardrails,
  opportunityQueue,
  survival
}) {
  return {
    agent: nevera.snapshot(),
    runtime: runtime.snapshot(),
    recovery: recovery.snapshot(),
    telemetry: telemetry.snapshot(),
    guardrails: guardrails.snapshot(),
    opportunityQueue,
    survival,
    timestamp: new Date().toISOString()
  };
}
