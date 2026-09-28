export class GenerationProvider {
  constructor({ apiUrl = process.env.NEVERA_LLM_API_URL ?? "", apiKey = process.env.NEVERA_LLM_API_KEY ?? "", model = process.env.NEVERA_LLM_MODEL ?? "gpt-5.6-mini" } = {}) {
    this.apiUrl = String(apiUrl).replace(/\/$/, "");
    this.apiKey = String(apiKey).trim();
    this.model = String(model);
  }

  get configured() { return Boolean(this.apiUrl && this.apiKey); }

  async generate({ system = "", prompt = "", maxTokens = 3000 } = {}) {
    if (!this.configured) return null;
    const response = await fetch(this.apiUrl + "/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + this.apiKey },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: maxTokens
      })
    });
    if (!response.ok) throw new Error("GENERATION_PROVIDER_HTTP_" + response.status);
    const payload = await response.json();
    return payload?.choices?.[0]?.message?.content?.trim() ?? null;
  }

  status() {
    return { configured: this.configured, provider: this.configured ? "OPENAI_COMPATIBLE" : "LOCAL", model: this.model };
  }
}
