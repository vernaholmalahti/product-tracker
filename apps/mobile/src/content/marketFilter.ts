import type { Market, MarketStatus, ProductSummary, Region } from "@/api/types";

// What the user picked: everything, a whole region, or one market in a region.
export type MarketFilter =
  | { kind: "all" }
  | { kind: "region"; region: Region }
  | { kind: "market"; region: Region; marketCode: string };

export const ALL_MARKETS: MarketFilter = { kind: "all" };

// Display order and labels for regions (CONTENT_GUIDELINES.md → Markets).
export const REGIONS: { region: Region; label: string }[] = [
  { region: "EUROPE", label: "Europe" },
  { region: "AMERICAS", label: "Americas" },
  { region: "ASIA", label: "Asia" },
];

export function regionLabel(region: Region): string {
  return REGIONS.find((r) => r.region === region)?.label ?? region;
}

export function marketsInRegion(markets: Market[], region: Region): Market[] {
  return markets.filter((market) => market.region === region);
}

function matchesFilter(status: MarketStatus, filter: MarketFilter): boolean {
  switch (filter.kind) {
    case "all":
      return true;
    case "region":
      return status.marketRegion === filter.region;
    case "market":
      return status.marketCode === filter.marketCode;
  }
}

// Keeps only the selected markets on each product, and drops products
// that have no data in the selection. Pure function: easy to unit test (Phase 7).
export function filterProducts(products: ProductSummary[], filter: MarketFilter): ProductSummary[] {
  return products
    .map((product) => ({
      ...product,
      markets: product.markets.filter((status) => matchesFilter(status, filter)),
    }))
    .filter((product) => product.markets.length > 0);
}

// Human description of the filter, for the empty-list message.
export function describeFilter(filter: MarketFilter, markets: Market[]): string {
  switch (filter.kind) {
    case "all":
      return "any market";
    case "region":
      return regionLabel(filter.region);
    case "market":
      return markets.find((m) => m.code === filter.marketCode)?.name ?? filter.marketCode;
  }
}
