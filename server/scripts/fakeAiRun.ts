// End-to-end test of the whole AI pipeline with a FAKE Claude – no API key, no costs,
// and no requests to the real regulator sites.
//
//   npm run ai:fake-run
//
// It pretends the EU Union list page changed and that Claude answered with three findings:
//   A. EU authorisation on EUR-Lex (official, quote found)  → should be AUTO-PUBLISHED
//   B. US news article                                       → should WAIT for the admin, with reasons
//   C. a source Claude never saw (invented)                  → should be DISCARDED
// The results stay in the database so you can look at them on /admin and in the app.
// Remove them afterwards with: npm run test-data:clean
import { prisma } from "../src/db/client";
import type { AiResult } from "../src/worker/ai/askClaude";
import type { AiDependencies } from "../src/worker/ai/runAiChecks";
import { runUpdate } from "../src/worker/runUpdate";
import { cleanTestData, TEST_TITLE_PREFIX } from "./testData";

const OFFICIAL_URL = "https://eur-lex.europa.eu/eli/reg_impl/2026/2201/oj";
const NEWS_URL = "https://www.foodnavigator-usa.com/Article/2026/11/18/ripe-test-solein-gras";
const INVENTED_URL = "https://example.com/invented-by-the-model";

const noUsage = { requests: 1, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, webSearches: 0 };

// What fake Claude "answers" for each product.
const fakeReports: Record<string, AiResult> = {
  solein: {
    seenUrls: new Set([OFFICIAL_URL, NEWS_URL]), // C's URL is NOT here: Claude never saw it
    usage: noUsage,
    problem: null,
    report: {
      productSlug: "solein",
      notes: "Fake answer for the end-to-end test.",
      findings: [
        {
          marketCode: "EU",
          proposedStage: "AUTHORISED",
          eventDate: "2026-11-18",
          eventDatePrecision: "DAY",
          title: `${TEST_TITLE_PREFIX} Commission authorises Solein as a novel food`,
          summary: "Test data: the European Commission added Solein to the Union list of novel foods.",
          sourceUrl: OFFICIAL_URL,
          sourceType: "OFFICIAL",
          evidenceQuote: "authorising the placing on the market of dried biomass of Xanthobacter sp. SoF1",
          confidence: 0.93,
        },
        {
          marketCode: "US",
          proposedStage: "UNDER_ASSESSMENT",
          eventDate: "2026-11-17",
          eventDatePrecision: "DAY",
          title: `${TEST_TITLE_PREFIX} FDA files Solar Foods' GRAS notice for Solein`,
          summary: "Test data: a trade news site reports that FDA has filed the GRAS notice.",
          sourceUrl: NEWS_URL,
          sourceType: "NEWS",
          evidenceQuote: "FDA has filed the notice and assigned it a GRN number",
          confidence: 0.7,
        },
        {
          marketCode: "SG",
          proposedStage: "ON_MARKET",
          eventDate: "2026-11-10",
          eventDatePrecision: "DAY",
          title: `${TEST_TITLE_PREFIX} Solein products on sale in Singapore`,
          summary: "Test data: this finding has a source the model never saw.",
          sourceUrl: INVENTED_URL,
          sourceType: "COMPANY",
          evidenceQuote: "now available in stores",
          confidence: 0.8,
        },
      ],
    },
  },
  nmn: {
    seenUrls: new Set(),
    usage: noUsage,
    problem: null,
    report: { productSlug: "nmn", findings: [], notes: "Fake answer: nothing new." },
  },
};

const fakeAi: AiDependencies = {
  askClaude: async (input) => fakeReports[input.slug] ?? { report: null, seenUrls: new Set(), usage: noUsage, problem: "no fake answer" },
  // Pretend the quote is on the EUR-Lex page (the real check fetches the page).
  verifyQuote: async (url) => url === OFFICIAL_URL,
};

let failures = 0;
function expect(label: string, ok: boolean, detail = ""): void {
  console.log(`${ok ? "  ✓" : "  ✗"} ${label}${detail ? ` – ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main(): Promise<void> {
  console.log("Preparing: removing old test data…");
  await cleanTestData();

  // Make both products "due" for this test, and put their real timestamps back afterwards.
  const saved = await prisma.product.findMany({ select: { id: true, lastAiCheckAt: true } });
  await prisma.product.updateMany({ data: { lastAiCheckAt: null } });

  const euUnionList = await prisma.sourceWatch.findFirstOrThrow({ where: { label: { contains: "Union list" } } });
  try {
    console.log("\nRunning the worker with fake Claude:");
    const summary = await runUpdate({
      ai: fakeAi,
      fakeSourceChanges: [{ sourceWatchId: euUnionList.id, label: euUnionList.label, url: euUnionList.url }],
    });

    console.log("\nChecking the results:");
    const pending = await prisma.pendingUpdate.findMany({
      where: { updateRunId: summary.updateRunId },
      include: { productMarketStatus: true },
    });
    const a = pending.find((p) => p.sourceUrl === OFFICIAL_URL);
    const b = pending.find((p) => p.sourceUrl === NEWS_URL);
    const c = pending.find((p) => p.sourceUrl === INVENTED_URL);

    expect("A (official EU) was auto-published", a?.status === "AUTO_PUBLISHED", a?.status);
    expect("A's stage is now AUTHORISED in the EU", a?.productMarketStatus.currentStage === "AUTHORISED");
    const event = await prisma.statusEvent.findFirst({ where: { sourceUrl: OFFICIAL_URL } });
    expect("A is on the timeline with its source, publishedBy AUTO", event?.publishedBy === "AUTO");
    expect("B (news) is waiting for the admin", b?.status === "PENDING", b?.status);
    expect("B explains why it wasn't auto-published", (b?.checkNotes.length ?? 0) > 0, b?.checkNotes.join(" | "));
    expect("C (invented source) was discarded", c === undefined);
    expect("the run logged C as discarded", summary.errors.some((e) => e.message.includes("possibly invented")));
    expect("NMN produced nothing (empty answer)", !pending.some((p) => p.title.includes("NMN")));
    console.log(
      `\nSummary: ${summary.pendingCreated} new updates, ${summary.autoPublished} auto-published, ` +
        `${summary.errors.length} logged problems (UpdateRun ${summary.updateRunId})`,
    );
  } finally {
    for (const product of saved) {
      await prisma.product.update({ where: { id: product.id }, data: { lastAiCheckAt: product.lastAiCheckAt } });
    }
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
  console.log("Look at /admin and Solein in the app, then run: npm run test-data:clean");
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error("Fake AI run failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
