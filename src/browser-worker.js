import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function safeName(value) {
  return String(value ?? "default").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

export class BrowserWorker {
  constructor({
    storageDir = "/data/nevera-browser",
    allowDomains = [],
    headless = true,
    timeoutMs = 15000,
    automationEnabled = false
  } = {}) {
    this.storageDir = storageDir;
    this.allowDomains = new Set(allowDomains.map((v) => String(v).trim().toLowerCase()).filter(Boolean));
    this.headless = headless;
    this.timeoutMs = timeoutMs;
    this.automationEnabled = Boolean(automationEnabled);
    this.browser = null;
    this.sessions = new Map();
    this.actions = [];
  }

  status() {
    return {
      configured: true,
      automationEnabled: this.automationEnabled,
      allowDomains: [...this.allowDomains],
      activeSessions: [...this.sessions.keys()],
      actions: this.actions.slice(-50)
    };
  }

  canAccess(url) {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      (this.allowDomains.size === 0 || this.allowDomains.has(parsed.hostname));
  }

  async openSession(name = "default") {
    if (!this.automationEnabled) throw new Error("BROWSER_AUTOMATION_DISABLED");
    const { chromium } = await import("playwright");
    if (!this.browser) this.browser = await chromium.launch({ headless: this.headless });
    const key = safeName(name);
    const storagePath = path.join(this.storageDir, key + ".json");
    await mkdir(this.storageDir, { recursive: true });
    let context;
    try {
      const storage = await readFile(storagePath, "utf8");
      context = await this.browser.newContext({ storageState: JSON.parse(storage) });
    } catch {
      context = await this.browser.newContext();
    }
    context.setDefaultTimeout(this.timeoutMs);
    const page = await context.newPage();
    this.sessions.set(key, { context, page, storagePath });
    this.#record("SESSION_OPENED", { session: key });
    return { session: key };
  }

  async saveSession(name = "default") {
    const session = this.sessions.get(safeName(name));
    if (!session) throw new Error("BROWSER_SESSION_NOT_FOUND");
    await session.context.storageState({ path: session.storagePath });
    this.#record("SESSION_SAVED", { session: safeName(name) });
    return { saved: true, session: safeName(name) };
  }

  async closeSession(name = "default") {
    const key = safeName(name);
    const session = this.sessions.get(key);
    if (!session) return { closed: false };
    await session.context.close();
    this.sessions.delete(key);
    this.#record("SESSION_CLOSED", { session: key });
    return { closed: true };
  }

  async navigate(name, url) {
    this.#assertEnabled();
    if (!this.canAccess(url)) throw new Error("BROWSER_DOMAIN_NOT_ALLOWED");
    const session = this.#session(name);
    await session.page.goto(url, { waitUntil: "domcontentloaded" });
    const result = { url: session.page.url(), title: await session.page.title() };
    this.#record("NAVIGATE", { session: safeName(name), ...result });
    return result;
  }

  async snapshot(name = "default") {
    const session = this.#session(name);
    const data = await session.page.locator("body").innerText({ timeout: this.timeoutMs }).catch(() => "");
    return data.slice(0, 20000);
  }

  async fill(name, selector, value) {
    this.#assertEnabled();
    const session = this.#session(name);
    await session.page.locator(selector).fill(String(value ?? ""));
    this.#record("FILL", { session: safeName(name), selector });
    return { ok: true };
  }

  async click(name, selector) {
    this.#assertEnabled();
    const session = this.#session(name);
    await session.page.locator(selector).click();
    this.#record("CLICK", { session: safeName(name), selector });
    return { ok: true };
  }

  async upload(name, selector, filePath) {
    this.#assertEnabled();
    const session = this.#session(name);
    await session.page.locator(selector).setInputFiles(filePath);
    this.#record("UPLOAD", { session: safeName(name), selector, filePath });
    return { ok: true };
  }

  async extract(name, selector) {
    const session = this.#session(name);
    const value = await session.page.locator(selector).innerText();
    this.#record("EXTRACT", { session: safeName(name), selector });
    return value;
  }

  async close() {
    for (const key of [...this.sessions.keys()]) await this.closeSession(key);
    if (this.browser) await this.browser.close();
    this.browser = null;
  }

  #assertEnabled() {
    if (!this.automationEnabled) throw new Error("BROWSER_AUTOMATION_DISABLED");
  }

  #session(name) {
    const session = this.sessions.get(safeName(name));
    if (!session) throw new Error("BROWSER_SESSION_NOT_FOUND");
    return session;
  }

  #record(type, data) {
    this.actions.push({ type, ...data, timestamp: new Date().toISOString() });
    if (this.actions.length > 200) this.actions.splice(0, this.actions.length - 200);
  }
}
