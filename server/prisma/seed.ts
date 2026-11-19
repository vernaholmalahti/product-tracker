// Seed data from docs/CONTENT_GUIDELINES.md. Run: npx prisma db seed
// Safe to run many times: it updates what exists and only adds missing events.
// StatusEvents are never deleted (DATA_MODEL.md), so this script never deletes either.
import { prisma } from "../src/db/client";
import type {
  Category,
  DatePrecision,
  SourceType,
  Stage,
} from "../src/generated/prisma/client";

// ─── Data ───────────────────────────────────────────────────────────────────

const markets = [
  { code: "EU", name: "European Union" },
  { code: "US", name: "United States" },
  { code: "UK", name: "United Kingdom" },
  { code: "SG", name: "Singapore" },
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
        currentStage: "POSITIVE_SAFETY_OPINION",
        expectedNext: "Company estimate: FDA \"no questions\" letter by the end of 2026",
        events: [
          {
            stage: "POSITIVE_SAFETY_OPINION",
            date: "2024-09-02",
            precision: "DAY",
            title: "Solein reaches self-affirmed GRAS status",
            summary:
              "An independent expert panel concluded Solein is generally recognised as safe (GRAS). This is the company's own conclusion, not an FDA decision. Solar Foods filed a GRAS notice with the FDA in September 2025; the FDA's answer is pending.",
            sourceUrl:
              "https://solarfoods.com/solar-foods-obtains-self-affirmed-gras-status-for-solein-in-the-united-states/",
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

// ─── Seeding functions ──────────────────────────────────────────────────────

async function seedMarkets(): Promise<void> {
  for (const market of markets) {
    await prisma.market.upsert({
      where: { code: market.code },
      update: { name: market.name },
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
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
