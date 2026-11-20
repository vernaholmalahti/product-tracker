import { config } from "../../config";
import { prisma } from "../../db/client";
import type { Stage } from "../../generated/prisma/client";
import { evaluateAutoPublish } from "../../updates/approvalRules";
import { isOfficialSource } from "../../updates/officialDomains";
import { publishUpdate } from "../../updates/publishUpdate";
import type { RunError } from "../sources/checkSources";
import type { AiResult } from "./askClaude";
import { estimateCostUsd } from "./costEstimate";
import { diffFindings, type MarketState } from "./diffFindings";
import { loadProductInput } from "./productInput";
import type { ProductPromptInput } from "./prompt";
import { type ChangedPage, relevantChangedPages, shouldCheckProduct } from "./schedule";
import { type CheckedFinding, validateReport } from "./validateReport";

// The two outside services, passed in so tests can use fakes (no API costs, no network).
export type AiDependencies = {
  askClaude: (input: ProductPromptInput, today: string) => Promise<AiResult>;
  verifyQuote: (url: string, quote: string) => Promise<boolean | null>;
};

export type AiStepResult = {
  productsChecked: number;
  aiCallsUsed: number;
  costUsd: number;
  pendingCreated: number;
  autoPublished: number;
  errors: RunError[];
};

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// What the database already knows, per market, for diffFindings().
async function loadMarketStates(productId: string): Promise<{ states: MarketState[]; currentStage: Map<string, Stage> }> {
  const statuses = await prisma.productMarketStatus.findMany({
    where: { productId },
    include: {
      events: { select: { stage: true, eventDate: true } },
      pendingUpdates: { where: { status: "PENDING" }, select: { proposedStage: true } },
    },
  });
  const states = statuses.map((s) => ({
    marketCode: s.marketCode,
    eventStages: s.events.map((e) => e.stage),
    latestEventDate: s.events.map((e) => toDateString(e.eventDate)).sort().at(-1) ?? null,
    pendingStages: s.pendingUpdates.map((p) => p.proposedStage),
  }));
  return { states, currentStage: new Map(statuses.map((s) => [s.marketCode, s.currentStage])) };
}

// Saves one new finding as a PendingUpdate, applies the auto-publish rules,
// and publishes it if every rule passes. Returns true if it was auto-published.
async function saveFinding(
  finding: CheckedFinding,
  product: { id: string; category: "NOVEL_FOOD" | "SUPPLEMENT_INGREDIENT" },
  currentStage: Stage,
  updateRunId: string,
  deps: AiDependencies,
): Promise<boolean> {
  // Only fetch the page when the other rules could still pass (official domain) – saves time.
  const quoteFoundOnPage = isOfficialSource(finding.sourceUrl, finding.marketCode)
    ? await deps.verifyQuote(finding.sourceUrl, finding.evidenceQuote)
    : null;
  const decision = evaluateAutoPublish({ ...finding, category: product.category, currentStage, quoteFoundOnPage });
  const checkNotes = [...new Set([...decision.failedRules, ...finding.warnings])];

  const status = await prisma.productMarketStatus.findUniqueOrThrow({
    where: { productId_marketCode: { productId: product.id, marketCode: finding.marketCode } },
    select: { id: true },
  });
  const pending = await prisma.pendingUpdate.create({
    data: {
      productMarketStatusId: status.id,
      proposedStage: finding.proposedStage,
      eventDate: finding.eventDate ? new Date(finding.eventDate) : null,
      eventDatePrecision: finding.eventDatePrecision,
      title: finding.title,
      summary: finding.summary,
      sourceUrl: finding.sourceUrl,
      sourceType: finding.sourceType,
      evidenceQuote: finding.evidenceQuote,
      confidence: finding.confidence,
      origin: "AI_SEARCH",
      checkNotes,
      updateRunId,
    },
  });
  if (!decision.autoPublish) return false;

  await publishUpdate(pending.id, { publishedBy: "AUTO" }); // same code path as the admin's Approve
  return true;
}

// Phase 6: AI search for each product that's due, within AI_MAX_CALLS_PER_RUN.
export async function runAiChecks(
  updateRunId: string,
  changedPages: ChangedPage[],
  deps: AiDependencies,
  now: Date = new Date(),
): Promise<AiStepResult> {
  const result: AiStepResult = { productsChecked: 0, aiCallsUsed: 0, costUsd: 0, pendingCreated: 0, autoPublished: 0, errors: [] };
  const products = await prisma.product.findMany({
    orderBy: { lastAiCheckAt: { sort: "asc", nulls: "first" } }, // longest-unchecked first
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      lastAiCheckAt: true,
      marketStatuses: { select: { marketCode: true } },
    },
  });

  for (const product of products) {
    const marketCodes = product.marketStatuses.map((s) => s.marketCode);
    const decision = shouldCheckProduct({
      lastAiCheckAt: product.lastAiCheckAt,
      hasRelevantChangedPage: relevantChangedPages(product.id, marketCodes, changedPages).length > 0,
      now,
      fullCheckDays: config.aiFullCheckDays,
    });
    if (!decision.check) {
      console.log(`  [skipped  ] ${product.name} – ${decision.reason}`);
      continue;
    }
    if (result.aiCallsUsed >= config.aiMaxCallsPerRun) {
      console.log(`  [limit    ] AI_MAX_CALLS_PER_RUN (${config.aiMaxCallsPerRun}) reached – remaining products wait for the next run`);
      break;
    }

    try {
      const input = await loadProductInput(product.id, changedPages);
      const ai = await deps.askClaude(input, toDateString(now));
      result.productsChecked++;
      result.aiCallsUsed += ai.usage.requests;
      result.costUsd += estimateCostUsd(ai.usage);
      // Mark as checked even if the answer was unusable, so a broken product can't burn money every run.
      await prisma.product.update({ where: { id: product.id }, data: { lastAiCheckAt: now } });

      if (!ai.report) {
        result.errors.push({ where: `AI ${product.name}`, message: `no usable report: ${ai.problem ?? "unknown"}` });
        continue;
      }
      const validation = validateReport(ai.report, {
        productSlug: product.slug,
        category: product.category,
        marketCodes: input.markets.map((m) => m.marketCode),
        seenUrls: ai.seenUrls,
        today: toDateString(now),
      });
      if (!validation.ok) {
        result.errors.push({ where: `AI ${product.name}`, message: `invalid report discarded: ${validation.error}` });
        continue;
      }
      for (const rejected of validation.rejected) {
        result.errors.push({ where: `AI ${product.name}`, message: `finding discarded: ${rejected.reason}` });
      }

      const { states, currentStage } = await loadMarketStates(product.id);
      const { fresh, known } = diffFindings(validation.findings, states);
      for (const finding of fresh) {
        const stage = currentStage.get(finding.marketCode) ?? "NOT_SUBMITTED";
        const published = await saveFinding(finding, product, stage, updateRunId, deps);
        result.pendingCreated++;
        if (published) result.autoPublished++;
      }
      console.log(
        `  [ai       ] ${product.name}: ${validation.findings.length} valid, ${fresh.length} new ` +
          `(${known.length} already known, ${validation.rejected.length} discarded)`,
      );
    } catch (error) {
      result.errors.push({ where: `AI ${product.name}`, message: error instanceof Error ? error.message : String(error) });
    }
  }
  return result;
}
