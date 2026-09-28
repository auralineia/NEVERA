export function defaultOpportunitySources() {
  return [
    {
      name: "jobicy-remote-jobs",
      url: "https://jobicy.com/api/v2/remote-jobs?count=50",
      signal: "REMOTE_JOB_DEMAND"
    },
    {
      name: "himalayas-remote-jobs",
      url: "https://himalayas.app/jobs/api?limit=20",
      signal: "REMOTE_JOB_DEMAND"
    },
    {
      name: "remoteok-remote-jobs",
      url: "https://remoteok.com/api",
      signal: "REMOTE_JOB_DEMAND"
    },
    {
      name: "remotive-remote-jobs",
      url: "https://remotive.com/api/remote-jobs",
      signal: "REMOTE_JOB_DEMAND"
    },
    {
      name: "arbeitnow-job-board",
      url: "https://arbeitnow.com/api/job-board-api",
      signal: "REMOTE_JOB_DEMAND"
    },
    {
      name: "weworkremotely-rss",
      url: "https://weworkremotely.com/remote-jobs.rss",
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
