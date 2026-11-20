import { prisma } from "../db/client";
import { verifyQuoteOnPage } from "../updates/verifyQuote";
import { isAiConfigured } from "./ai/anthropicClient";
import { askClaudeAboutProduct } from "./ai/askClaude";
import { type AiDependencies, runAiChecks } from "./ai/runAiChecks";
import type { ChangedPage } from "./ai/schedule";
import { checkSources, type RunError, type SourceChange } from "./sources/checkSources";

export type RunSummary = {
  updateRunId: string;
  itemsChecked: number;
  changes: SourceChange[];
  errors: RunError[];
  aiCallsUsed: number;
  aiCostUsd: number;
  pendingCreated: number;
  autoPublished: number;
};

export type RunOptions = {
  // undefined = real Claude if ANTHROPIC_API_KEY is set; null = no AI; an object = fakes (tests).
  ai?: AiDependencies | null;
  now?: Date;
  // Tests only: don't fetch the real regulator sites; pretend these pages changed instead.
  fakeSourceChanges?: SourceChange[];
};

function defaultAiDependencies(): AiDependencies | null {
  return isAiConfigured() ? { askClaude: askClaudeAboutProduct, verifyQuote: verifyQuoteOnPage } : null;
}

// Phase 6 needs each changed page's market and product, not just its label.
async function toChangedPages(changes: SourceChange[]): Promise<ChangedPage[]> {
  if (changes.length === 0) return [];
  return prisma.sourceWatch.findMany({
    where: { id: { in: changes.map((c) => c.sourceWatchId) } },
    select: { label: true, url: true, marketCode: true, productId: true },
  });
}

// One complete worker run. Always writes an UpdateRun row – also when something crashes –
// so every run is visible afterwards (started, finished, counts, errors).
export async function runUpdate(options: RunOptions = {}): Promise<RunSummary> {
  const run = await prisma.updateRun.create({ data: {} }); // startedAt = now
  const summary: RunSummary = {
    updateRunId: run.id,
    itemsChecked: 0,
    changes: [],
    errors: [],
    aiCallsUsed: 0,
    aiCostUsd: 0,
    pendingCreated: 0,
    autoPublished: 0,
  };
  const ai = options.ai === undefined ? defaultAiDependencies() : options.ai;

  try {
    // Phase 5: official pages, no AI.
    const sources = options.fakeSourceChanges
      ? { itemsChecked: 0, changes: options.fakeSourceChanges, errors: [] }
      : await checkSources();
    summary.itemsChecked += sources.itemsChecked;
    summary.changes.push(...sources.changes);
    summary.errors.push(...sources.errors);

    // Phase 6: AI search per product (limited by AI_MAX_CALLS_PER_RUN). Skipped without an API key.
    if (ai) {
      const aiStep = await runAiChecks(run.id, await toChangedPages(sources.changes), ai, options.now);
      summary.itemsChecked += aiStep.productsChecked;
      summary.aiCallsUsed = aiStep.aiCallsUsed;
      summary.aiCostUsd = aiStep.costUsd;
      summary.pendingCreated = aiStep.pendingCreated;
      summary.autoPublished = aiStep.autoPublished;
      summary.errors.push(...aiStep.errors);
    } else {
      console.log("  [skipped  ] AI search – ANTHROPIC_API_KEY is not set");
    }
  } catch (error) {
    // Something unexpected (e.g. the database went away): record it instead of losing the run.
    summary.errors.push({ where: "runUpdate", message: error instanceof Error ? error.message : String(error) });
  } finally {
    await prisma.updateRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        itemsChecked: summary.itemsChecked,
        changesFound: summary.changes.length + summary.pendingCreated, // changed pages + new proposed updates
        aiCallsUsed: summary.aiCallsUsed,
        aiCostUsd: summary.aiCostUsd,
        sourceChanges: summary.changes,
        errors: summary.errors,
      },
    });
  }
  return summary;
}
