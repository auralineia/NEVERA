import test from "node:test";
import assert from "node:assert/strict";
import { unlink } from "node:fs/promises";
import { Persistence } from "../src/persistence.js";

test("memória persistente salva e recupera estado", async () => {
  const path = "./test-nevera-state.json";
  const persistence = new Persistence(path);

  const state = {
    balance: 17,
    cycle: 3,
    memories: ["primeira receita"]
  };

  await persistence.save(state);
  const loaded = await persistence.load();

  assert.equal(loaded.balance, state.balance);
  assert.equal(loaded.cycle, state.cycle);
  assert.equal(loaded.checkpointVersion, 2);
  await unlink(path);
  await unlink(`${path}.bak`).catch(() => {});
  await unlink(`${path}.tmp`).catch(() => {});
});

test("memória inexistente começa vazia", async () => {
  const persistence = new Persistence("./arquivo-que-nao-existe.json");
  assert.equal(await persistence.load(), null);
});
