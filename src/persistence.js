import { readFile, writeFile, rename, copyFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export class Persistence {
  constructor(filePath = "./nevera-state.json") {
    this.filePath = String(filePath).trim();
    this.tempPath = this.filePath + ".tmp";
    this.backupPath = this.filePath + ".bak";
  }

  #validate(state) {
    return Boolean(state && typeof state === "object" &&
      Number.isFinite(Number(state.balance)) &&
      Number.isFinite(Number(state.cycle)));
  }

  async save(state) {
    if (!this.#validate(state)) throw new Error("INVALID_STATE_CHECKPOINT");
    await mkdir(dirname(this.filePath), { recursive: true });
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
