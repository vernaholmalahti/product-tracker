import { prisma } from "../../db/client";
import type { ProductPromptInput } from "./prompt";
import { type ChangedPage, relevantChangedPages } from "./schedule";

// Builds what Claude is told about one product: its markets, current stage and the
// latest known event per market (so it only reports what's newer), plus any official
// pages that changed in this run (Phase 5 hints) for this product's markets.
export async function loadProductInput(
  productId: string,
  changedPages: ChangedPage[],
): Promise<ProductPromptInput> {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: {
      marketStatuses: {
        orderBy: { marketCode: "asc" },
        include: {
          market: true,
          events: { orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }], take: 1 }, // latest only
        },
      },
    },
  });

  const marketCodes = product.marketStatuses.map((s) => s.marketCode);
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    company: product.company,
    searchKeywords: product.searchKeywords,
    markets: product.marketStatuses.map((status) => {
      const latest = status.events[0];
      return {
        marketCode: status.marketCode,
        marketName: status.market.name,
        currentStage: status.currentStage,
        expectedNext: status.expectedNext,
        latestKnownEvent: latest
          ? { date: latest.eventDate.toISOString().slice(0, 10), stage: latest.stage, title: latest.title }
          : null,
      };
    }),
    changedOfficialPages: relevantChangedPages(product.id, marketCodes, changedPages).map(({ label, url }) => ({ label, url })),
  };
}
