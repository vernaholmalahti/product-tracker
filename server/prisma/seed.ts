// Seed data from docs/CONTENT_GUIDELINES.md. Run: npx prisma db seed
// Safe to run many times: it updates what exists and only adds missing events.
// StatusEvents are never deleted (DATA_MODEL.md), so this script never deletes either.
import { prisma } from "../src/db/client";
import type {
  Category,
  DatePrecision,
  Region,
  SourceType,
  SourceWatchKind,
  Stage,
} from "../src/generated/prisma/client";

// ─── Data ───────────────────────────────────────────────────────────────────

const markets: { code: string; name: string; region: Region }[] = [
  { code: "EU", name: "European Union", region: "EUROPE" },
  { code: "US", name: "United States", region: "AMERICAS" },
  { code: "UK", name: "United Kingdom", region: "EUROPE" },
  { code: "SG", name: "Singapore", region: "ASIA" },
];

type SeedEvent = {
  stage: Stage;
  date: string; // YYYY-MM-DD (for MONTH precision: the 1st of the month)
  precision: DatePrecision;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceType: SourceType;
};

type SeedMarketStatus = {
  marketCode: string;
  currentStage: Stage;
  expectedNext?: string;
  events: SeedEvent[];
};

type SeedProduct = {
  slug: string;
  name: string;
  category: Category;
  company: string | null;
  shortDescription: string;
  searchKeywords: string[];
  markets: SeedMarketStatus[];
};

const products: SeedProduct[] = [
  {
    slug: "solein",
    name: "Solein",
    category: "NOVEL_FOOD",
    company: "Solar Foods",
    shortDescription:
      "Protein powder made from microbes grown using CO₂ and hydrogen (gas fermentation).",
    searchKeywords: ["Solein", "Solar Foods", "Xanthobacter", "air protein"],
    markets: [
      {
        marketCode: "SG",
        currentStage: "AUTHORISED",
        events: [
          {
            stage: "AUTHORISED",
            date: "2022-09-01",
            precision: "MONTH",
            title: "Singapore Food Agency approves Solein",
            summary:
              "Singapore was the first country to approve Solein as a novel food, allowing food products containing it to be sold there.",
            sourceUrl: "https://solarfoods.com/solar-foods-receives-novel-food-reg",
            sourceType: "COMPANY",
          },
        ],
      },
      {
        marketCode: "US",
        currentStage: "APPLICATION_SUBMITTED",
        expectedNext: "Company estimate: FDA \"no questions\" letter by the end of 2026",
        events: [
          {
            // Self-affirmed GRAS (Sep 2024) is not a stage – CONTENT_GUIDELINES.md, decision 20 Nov 2026.
            stage: "APPLICATION_SUBMITTED",
            date: "2025-09-16",
            precision: "DAY",
            title: "Solar Foods files GRAS notice with the FDA",
            summary:
              "Solar Foods asked the FDA to review its conclusion that Solein is generally recognised as safe (GRAS). Since September 2024 Solein has had self-affirmed GRAS status – the company's own expert conclusion, not an FDA decision – which allows it to be sold in the US.",
            sourceUrl:
              "https://solarfoods.com/solar-foods-has-submitted-a-gras-notification-on-solein-in-the-united-states-to-obtain-a-no-questions-letter-from-the-fda/",
            sourceType: "COMPANY",
          },
        ],
      },
      {
        marketCode: "EU",
        currentStage: "POSITIVE_SAFETY_OPINION",
        expectedNext: "Company estimate: authorisation June–August 2027",
        events: [
          {
            stage: "APPLICATION_SUBMITTED",
            date: "2021-10-29",
            precision: "DAY",
            title: "Novel food application submitted",
            summary:
              "Solar Foods submitted a novel food application for Solein to the European Commission.",
            sourceUrl:
              "https://solarfoods.com/solein-submitted-to-the-european-commission-for-novel-food-approval/",
            sourceType: "COMPANY",
          },
          {
            stage: "POSITIVE_SAFETY_OPINION",
            date: "2026-08-31",
            precision: "DAY",
            title: "EFSA adopts positive safety opinion",
            summary:
              "EFSA's expert panel concluded Solein is safe under the proposed conditions of use (announced 9 Nov 2026). This is not yet permission to sell: the European Commission and EU countries still have to vote.",
            sourceUrl: "https://www.foodingredientsfirst.com/news/solar-foods-efsa-solein-fazer.html",
            sourceType: "NEWS",
          },
        ],
      },
    ],
  },
  {
    slug: "nmn",
    name: "NMN (nicotinamide mononucleotide)",
    category: "SUPPLEMENT_INGREDIENT",
    company: null, // several manufacturers
    shortDescription:
      "A compound related to vitamin B3 that is sold as a supplement ingredient in some markets. Its legal status differs between countries.",
    searchKeywords: ["NMN", "nicotinamide mononucleotide", "β-NMN", "beta-NMN"],
    markets: [
      {
        marketCode: "US",
        currentStage: "AUTHORISED", // shown as "Allowed in supplements" (CONTENT_GUIDELINES.md)
        events: [
          {
            stage: "AUTHORISED",
            date: "2025-12-02",
            precision: "DAY",
            title: "FDA confirms NMN may be used in dietary supplements",
            summary:
              "FDA reversed its 2022 position that NMN was excluded from dietary supplements, and confirmed this in letters to ingredient companies. Each company must still notify FDA before selling NMN as a new dietary ingredient.",
            sourceUrl:
              "https://www.nutraingredients.com/Article/2025/12/09/fda-reinstates-ndi-status-of-nmn-with-new-letters-to-ingredient-players/",
            sourceType: "NEWS",
          },
        ],
      },
      {
        marketCode: "EU",
        currentStage: "POSITIVE_SAFETY_OPINION",
        expectedNext: "European Commission decision pending – no date announced",
        events: [
          {
            stage: "POSITIVE_SAFETY_OPINION",
            date: "2026-03-04",
            precision: "DAY",
            title: "EFSA adopts positive safety opinion on one company's NMN",
            summary:
              "EFSA's opinion covers EffePharm's β-NMN only, not NMN in general (published May 2026). NMN is not yet authorised in the EU and cannot legally be sold as food or a food supplement until the European Commission adopts an implementing act.",
            sourceUrl:
              "https://effepharm.com/nmn-novel-food-updates-uthever-nmn-moves-closer-to-eu-market-compliance/",
            sourceType: "COMPANY",
          },
        ],
      },
    ],
  },
];

// Official pages the worker checks without AI (docs/AI_UPDATE_PIPELINE.md section 3).
// productSlug = null means a general source for all products.
// The EFSA RSS feed is added once its exact feed URL is confirmed.
// The ACNFP Solein pages were removed (404/410 in Nov 2026); UK status is covered by the FSA register.
const sourceWatches: {
  label: string;
  url: string;
  marketCode: string;
  kind: SourceWatchKind;
  productSlug: string | null;
}[] = [
  {
    label: "EU – Commission: summaries of novel food applications",
    url: "https://food.ec.europa.eu/safety/novel-food/authorisations/summary-applications-and-notifications_en",
    marketCode: "EU",
    kind: "PAGE_HASH",
    productSlug: null,
  },
  {
    label: "EU – Commission: Union list of novel foods",
    url: "https://food.ec.europa.eu/food-safety/novel-food/authorisations/union-list-novel-foods_en",
    marketCode: "EU",
    kind: "PAGE_HASH",
    productSlug: null,
  },
  {
    label: "US – FDA: recently published GRAS notices and letters",
    url: "https://www.fda.gov/food/gras-notice-inventory/recently-published-gras-notices-and-fda-letters",
    marketCode: "US",
    kind: "PAGE_HASH",
    productSlug: null,
  },
  {
    label: "UK – FSA: register of regulated product applications",
    url: "https://data.food.gov.uk/regulated-product-applications",
    marketCode: "UK",
    kind: "SEARCH_PAGE",
    productSlug: null,
  },
  {
    label: "UK – FSA: authorised novel foods",
    url: "https://data.food.gov.uk/regulated-products/novel_authorisations",
    marketCode: "UK",
    kind: "PAGE_HASH",
    productSlug: null,
  },
  {
    label: "SG – SFA: novel food (links the list of approved novel foods)",
    url: "https://www.sfa.gov.sg/food-information/novel-food",
    marketCode: "SG",
    kind: "PAGE_HASH",
    productSlug: null,
  },
];

// ─── Seeding functions ──────────────────────────────────────────────────────

// Creates or updates each watched page. Never touches lastHash/lastCheckedAt,
// so re-running the seed doesn't reset what the worker has learned.
async function seedSourceWatches(): Promise<number> {
  for (const watch of sourceWatches) {
    const product = watch.productSlug
      ? await prisma.product.findUniqueOrThrow({ where: { slug: watch.productSlug }, select: { id: true } })
      : null;
    const fields = { label: watch.label, marketCode: watch.marketCode, kind: watch.kind, productId: product?.id ?? null };
    await prisma.sourceWatch.upsert({
      where: { url: watch.url },
      update: fields,
      create: { url: watch.url, ...fields },
    });
  }
  return sourceWatches.length;
}

async function seedMarkets(): Promise<void> {
  for (const market of markets) {
    await prisma.market.upsert({
      where: { code: market.code },
      update: { name: market.name, region: market.region },
      create: market,
    });
  }
}

// Adds the event only if this status has no SEED event for the same stage yet.
async function seedEvent(productMarketStatusId: string, event: SeedEvent): Promise<boolean> {
  const existing = await prisma.statusEvent.findFirst({
    where: { productMarketStatusId, stage: event.stage, publishedBy: "SEED" },
  });
  if (existing) return false;

  await prisma.statusEvent.create({
    data: {
      productMarketStatusId,
      stage: event.stage,
      eventDate: new Date(event.date),
      eventDatePrecision: event.precision,
      title: event.title,
      summary: event.summary,
      sourceUrl: event.sourceUrl,
      sourceType: event.sourceType,
      publishedBy: "SEED",
    },
  });
  return true;
}

async function seedProduct(product: SeedProduct): Promise<number> {
  const { markets: productMarkets, ...productFields } = product;
  const saved = await prisma.product.upsert({
    where: { slug: product.slug },
    update: productFields,
    create: productFields,
  });

  let eventsAdded = 0;
  for (const status of productMarkets) {
    const savedStatus = await prisma.productMarketStatus.upsert({
      where: { productId_marketCode: { productId: saved.id, marketCode: status.marketCode } },
      update: { currentStage: status.currentStage, expectedNext: status.expectedNext ?? null },
      create: {
        productId: saved.id,
        marketCode: status.marketCode,
        currentStage: status.currentStage,
        expectedNext: status.expectedNext ?? null,
      },
    });
    for (const event of status.events) {
      if (await seedEvent(savedStatus.id, event)) eventsAdded++;
    }
  }
  return eventsAdded;
}

async function main(): Promise<void> {
  await seedMarkets();
  for (const product of products) {
    const added = await seedProduct(product);
    console.log(`Seeded ${product.name}: ${product.markets.length} markets, ${added} new events`);
  }
  // After products, because some watches belong to a product.
  console.log(`Seeded ${await seedSourceWatches()} source watches`);
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
