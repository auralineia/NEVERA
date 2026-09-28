import { readFile, writeFile, rename } from "node:fs/promises";

export class Persistence {
  constructor(filePath = "./nevera-state.json") {
    this.filePath = filePath;
    this.tempPath = `${filePath}.tmp`;
  }

  async save(state) {
    const payload = JSON.stringify(state, null, 2);
    await writeFile(this.tempPath, payload, "utf8");
    await rename(this.tempPath, this.filePath);
    return true;
  }

  async load() {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw);
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }
}
