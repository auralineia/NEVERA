import { readFile, writeFile, rename, copyFile } from "node:fs/promises";

export class Persistence {
  constructor(filePath = "./nevera-state.json") {
    this.filePath = filePath;
    this.tempPath = filePath + ".tmp";
    this.backupPath = filePath + ".bak";
  }

  #validate(state) {
    return Boolean(state && typeof state === "object" &&
      Number.isFinite(Number(state.balance)) &&
      Number.isFinite(Number(state.cycle)));
  }

  async save(state) {
    if (!this.#validate(state)) throw new Error("INVALID_STATE_CHECKPOINT");
    const payload = JSON.stringify({
      ...state,
      checkpointVersion: 2,
      checkpointAt: new Date().toISOString()
    }, null, 2);
    await writeFile(this.tempPath, payload, "utf8");
    try {
      JSON.parse(await readFile(this.tempPath, "utf8"));
    } catch {
      throw new Error("CHECKPOINT_VERIFY_FAILED");
    }
    try {
      await copyFile(this.filePath, this.backupPath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await rename(this.tempPath, this.filePath);
    return true;
  }

  async #readValid(path) {
    try {
      const state = JSON.parse(await readFile(path, "utf8"));
      return this.#validate(state) ? state : null;
    } catch {
      return null;
    }
  }

  async load() {
    return (await this.#readValid(this.filePath))
      ?? (await this.#readValid(this.backupPath))
      ?? (await this.#readValid(this.tempPath))
      ?? null;
  }
}
