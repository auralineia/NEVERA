function normalizeJob(item, source) {
  const title = item?.title ?? item?.position ?? item?.name ?? item?.role ?? null;
  const company = item?.company_name ?? item?.company ?? item?.companyName ?? null;
  const url = item?.url ?? item?.job_url ?? item?.application_url ?? item?.apply_url ?? item?.link ?? null;
  const location = item?.location ?? item?.candidate_required_location ?? item?.country ?? "Worldwide";
  if (!title || !url) return null;
  return {
    name: `Demanda: ${title}${company ? ` — ${company}` : ""}`,
    title,
    company,
    location,
    url,
    source: source.name,
    signal: source.signal ?? "REMOTE_JOB_DEMAND"
  };
}

function extractJobs(data, source) {
  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.jobs) ? data.jobs
    : Array.isArray(data?.data) ? data.data
    : [];
  return raw.map((item) => normalizeJob(item, source)).filter(Boolean).slice(0, 50);
}

export class OpportunityDiscovery {
  constructor({ sandbox, sources = [] } = {}) {
    this.sandbox = sandbox;
    this.sources = sources;
  }

  async scan() {
    const results = [];
    for (const source of this.sources) {
      try {
        const result = await this.sandbox.fetchPublic(source.url);
        results.push({
          source: source.name,
          url: source.url,
          status: result.ok ? "AVAILABLE" : "UNAVAILABLE",
          signal: source.signal ?? "PUBLIC_DATA",
          bytes: result.bytes,
          jobs: result.ok ? extractJobs(result.data, source) : []
        });
      } catch (error) {
        results.push({
          source: source.name,
          url: source.url,
          status: "FAILED",
          reason: error.message,
          jobs: []
        });
      }
    }
    return results;
  }
}