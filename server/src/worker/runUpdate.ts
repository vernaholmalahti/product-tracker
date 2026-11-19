import { prisma } from "../db/client";
import { checkSources, type RunError, type SourceChange } from "./sources/checkSources";

export type RunSummary = {
  updateRunId: string;
  itemsChecked: number;
  changes: SourceChange[];
  errors: RunError[];
};

// One complete worker run. Always writes an UpdateRun row – also when something crashes –
// so every run is visible afterwards (started, finished, counts, errors).
export async function runUpdate(): Promise<RunSummary> {
  const run = await prisma.updateRun.create({ data: {} }); // startedAt = now
  const summary: RunSummary = { updateRunId: run.id, itemsChecked: 0, changes: [], errors: [] };

  try {
    // Phase 5: official pages, no AI.
    const sources = await checkSources();
    summary.itemsChecked += sources.itemsChecked;
    summary.changes.push(...sources.changes);
    summary.errors.push(...sources.errors);

    // Phase 6 adds: AI search per product (limited by AI_MAX_CALLS_PER_RUN).
  } catch (error) {
    // Something unexpected (e.g. the database went away): record it instead of losing the run.
    summary.errors.push({ where: "runUpdate", message: error instanceof Error ? error.message : String(error) });
  } finally {
    await prisma.updateRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        itemsChecked: summary.itemsChecked,
        changesFound: summary.changes.length,
        sourceChanges: summary.changes,
        errors: summary.errors,
      },
    });
  }
  return summary;
}
