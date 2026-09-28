import { betaGate } from "./beta-gate.js";

export class AutonomousRuntime {
  constructor({ recovery, runtime, telemetry, stateReader = null, heartbeatMs = 5000 } = {}) {
    this.recovery = recovery;
    this.runtime = runtime;
    this.telemetry = telemetry;
    this.stateReader = stateReader;
    this.heartbeatMs = Math.max(1000, Number(heartbeatMs));
    this.lastHeartbeatAt = null;
    this.lastState = null;
  }

  async heartbeat({ mode = "BETA", balance = 0, killSwitch = false, realMoney = false } = {}) {
    let state = null;
    if (this.stateReader) {
      try { state = await this.stateReader(); }
      catch (error) {
        this.telemetry?.record("STATE_READ_ERROR", { error: String(error) });
        this.recovery?.failure?.(error);
      }
    }

    const snapshot = state ?? {
      balance,
      status: "UNKNOWN"
    };

    const gate = betaGate({
      mode,
      balance: snapshot.balance ?? balance,
      killSwitch,
      realMoney,
      preflight: true,
      health: "OK"
    });

    this.lastHeartbeatAt = new Date().toISOString();
    this.lastState = snapshot;
    this.telemetry?.record("HEARTBEAT", {
      mode: gate.mode,
      allowed: gate.allowed,
      balance: snapshot.balance,
      status: snapshot.status,
      at: this.lastHeartbeatAt
    });

    return {
      ok: gate.allowed,
      heartbeatAt: this.lastHeartbeatAt,
      state: snapshot,
      gate,
      recovery: this.recovery?.snapshot?.() ?? null,
      runtime: this.runtime?.snapshot?.() ?? null
    };
  }

  snapshot() {
    return {
      heartbeatAt: this.lastHeartbeatAt,
      state: this.lastState,
      recovery: this.recovery?.snapshot?.() ?? null,
      runtime: this.runtime?.snapshot?.() ?? null
    };
  }
}
