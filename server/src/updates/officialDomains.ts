// Regulators and official journals per market (docs/AI_UPDATE_PIPELINE.md section 7).
// Only these count as OFFICIAL for auto-publishing – the AI's own label is not enough.
// Subdomains count too: "efsa.europa.eu" also covers "www.efsa.europa.eu".
export const OFFICIAL_DOMAINS: Record<string, string[]> = {
  EU: ["efsa.europa.eu", "efsa.onlinelibrary.wiley.com", "eur-lex.europa.eu", "food.ec.europa.eu"],
  US: ["fda.gov", "regulations.gov", "federalregister.gov"],
  UK: ["food.gov.uk", "foodstandards.gov.scot", "legislation.gov.uk"],
  SG: ["sfa.gov.sg"],
};

// True if the URL is https and its host is one of the market's official domains (or a subdomain).
export function isOfficialSource(url: string, marketCode: string): boolean {
  let host: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    host = parsed.hostname.toLowerCase();
  } catch {
    return false;
  }
  const domains = OFFICIAL_DOMAINS[marketCode] ?? [];
  // "endsWith('.' + domain)" – NOT just endsWith(domain), or "fakefda.gov" would match "fda.gov".
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}
