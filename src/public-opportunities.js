const COUNTRY_MARKETS = [
  ["Brazil", "BR"], ["Brasil", "BR"], ["United States", "US"], ["USA", "US"], ["US", "US"],
  ["Canada", "CA"], ["United Kingdom", "GB"], ["UK", "GB"], ["Europe", "EU"], ["European Union", "EU"],
  ["Australia", "AU"], ["Japan", "JP"], ["Singapore", "SG"], ["United Arab Emirates", "AE"],
  ["Mexico", "MX"], ["Chile", "CL"], ["Argentina", "AR"]
];

function marketFor(location, index = 0) {
  const text = String(location ?? "").toLowerCase();
  const match = COUNTRY_MARKETS.find(([name]) => text.includes(name.toLowerCase()));
  if (match) return match[1];
  return ["US", "EU", "GB", "CA", "AU", "SG", "AE"][index % 7];
}

function serviceCategory(title = "") {
  const text = title.toLowerCase();
  if (/automat|workflow|zapier|make\.com|process/.test(text)) return "BUSINESS_AUTOMATION";
  if (/data|analyst|research|sql|bi|insight/.test(text)) return "DATA_AND_RESEARCH";
  if (/content|copy|writer|seo|social|marketing/.test(text)) return "CONTENT_AND_MEDIA";
  if (/software|developer|engineer|frontend|backend|full stack|app/.test(text)) return "APPS_AND_TOOLS";
  if (/design|ui|ux|graphic/.test(text)) return "DIGITAL_SERVICES";
  return "DIGITAL_SERVICES";
}

export function translatePublicSignals(scanResults = []) {
  const opportunities = [];
  for (const item of scanResults.filter((entry) => entry.status === "AVAILABLE")) {
    const jobs = Array.isArray(item.jobs) ? item.jobs : [];
    if (!jobs.length) {
      opportunities.push({
        name: `Demanda pública: ${item.source}`,
        category: "RESEARCH",
        estimatedRevenue: 0,
        estimatedCost: 0,
        risk: 0.05,
        effort: 1,
        demand: 1,
        competition: 1,
        source: "PUBLIC_SIGNAL",
        signal: item.signal,
        url: item.url,
        market: ["US", "EU", "GB"][opportunities.length % 3]
      });
      continue;
    }

    jobs.forEach((job, index) => {
      const category = serviceCategory(job.title);
      opportunities.push({
        name: job.name,
        category,
        estimatedRevenue: category === "B2B_CONTRACTS" ? 1500 : category === "BUSINESS_AUTOMATION" ? 500 : 150,
        estimatedCost: 0,
        risk: 0.08,
        effort: 1,
        demand: 1,
        competition: 1,
        source: job.source,
        signal: job.signal,
        url: job.url,
        applicationUrl: job.url,
        company: job.company,
        location: job.location,
        market: marketFor(job.location, index),
        index
      });
    });
  }
  return opportunities.slice(0, 100);
}