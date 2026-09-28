export function defaultOpportunitySources() {
  return [
    {
      name: "jobicy-remote-jobs",
      url: "https://jobicy.com/api/v2/remote-jobs?count=50",
      signal: "REMOTE_JOB_DEMAND"
    },
    {
      name: "himalayas-remote-jobs",
      url: "https://himalayas.app/jobs/api?limit=20&offset=0",
      signal: "REMOTE_JOB_DEMAND"
    }
  ];
}

export function normalizeSources(sources = []) {
  return sources
    .filter((source) => source?.url && source?.name)
    .map((source) => ({
      name: String(source.name),
      url: String(source.url),
      signal: source.signal ?? "PUBLIC_DATA"
    }));
}
