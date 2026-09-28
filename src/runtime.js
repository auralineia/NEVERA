export class Runtime {
  constructor() {
    this.startedAt = new Date().toISOString();
    this.lastCycleAt = null;
    this.lastError = null;
    this.cycles = 0;
  }

  cycleStarted(cycle) {
    this.cycles += 1;
    this.lastCycleAt = new Date().toISOString();
    this.lastError = null;
    return { cycle, at: this.lastCycleAt };
  }

  error(error) {
    this.lastError = {
      message: error?.message ?? String(error),
      at: new Date().toISOString()
    };
  }

  snapshot() {
    return {
      startedAt: this.startedAt,
      lastCycleAt: this.lastCycleAt,
      lastError: this.lastError,
      cycles: this.cycles,
      uptimeMs: Math.max(0, Date.now() - Date.parse(this.startedAt))
    };
  }
}
