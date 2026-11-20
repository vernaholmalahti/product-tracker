// When is a product worth an AI check? (Cost decision, Nov 2026 – see AI_UPDATE_PIPELINE.md section 8.)
// Regulatory news is slow, so instead of asking Claude every day we ask when:
//  - one of the product's official pages changed today (found for free by the source checks), or
//  - it hasn't had a full check for `fullCheckDays` days (catches news the watched pages miss).
// And never twice within 20 hours, whatever the reason.

export type ChangedPage = { label: string; url: string; marketCode: string; productId: string | null };

const MIN_HOURS_BETWEEN_CHECKS = 20;
const HOUR_MS = 60 * 60 * 1000;

// Changed pages that matter for this product: pages about the product itself, or
// general pages (productId null) for one of the markets it is tracked in.
export function relevantChangedPages(productId: string, marketCodes: string[], pages: ChangedPage[]): ChangedPage[] {
  return pages.filter((page) => page.productId === productId || (page.productId === null && marketCodes.includes(page.marketCode)));
}

export type CheckDecision = { check: boolean; reason: string };

export function shouldCheckProduct(input: {
  lastAiCheckAt: Date | null;
  hasRelevantChangedPage: boolean;
  now: Date;
  fullCheckDays: number;
}): CheckDecision {
  const { lastAiCheckAt, hasRelevantChangedPage, now, fullCheckDays } = input;
  if (lastAiCheckAt === null) return { check: true, reason: "never checked" };

  const hoursSince = (now.getTime() - lastAiCheckAt.getTime()) / HOUR_MS;
  if (hoursSince < MIN_HOURS_BETWEEN_CHECKS) {
    return { check: false, reason: `checked ${Math.round(hoursSince)} h ago` };
  }
  if (hasRelevantChangedPage) return { check: true, reason: "an official page for this product changed" };
  if (hoursSince >= fullCheckDays * 24) return { check: true, reason: `weekly full check (${fullCheckDays} days)` };
  return { check: false, reason: `no page changes; next full check in ${Math.ceil(fullCheckDays - hoursSince / 24)} days` };
}
