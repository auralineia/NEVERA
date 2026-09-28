export class NeveraLoop {
  constructor(nevera, brain) {
    this.nevera = nevera;
    this.brain = brain;
    this.cycle = 0;
  }

  runOnce() {
    this.cycle += 1;

    const state = this.nevera.snapshot();
    const decision = this.brain.think(state);

    this.nevera.log("THINK", {
      cycle: this.cycle,
      decision
    });

    return decision;
  }
}
