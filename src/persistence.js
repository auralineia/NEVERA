import { readFile, writeFile } from "node:fs/promises";

export class Persistence {
  constructor(filePath = "./nevera-state.json") {
    this.filePath = filePath;
  }

  async save(state) {
    await writeFile(this.filePath, JSON.stringify(state, null, 2), "utf8");
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
