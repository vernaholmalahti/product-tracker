import { prisma } from "../../db/client";
import type { SourceWatch } from "../../generated/prisma/client";
import { fetchPage } from "./fetchPage";

export type SourceChange = { sourceWatchId: string; label: string; url: string };
export type RunError = { where: string; message: string };

export type SourceCheckResult = {
  itemsChecked: number;
  changes: SourceChange[];
  errors: RunError[];
};

type Outcome = "baseline" | "unchanged" | "changed" | "error";

// Checks one watched page and saves what we learned on its SourceWatch row.
// Phase 5 only records changes; Phase 6 gives changed pages to the AI (AI_UPDATE_PIPELINE.md §10).
async function checkOne(watch: SourceWatch, now: Date): Promise<{ outcome: Outcome; error?: string }> {
  if (watch.kind === "RSS") {
    return { outcome: "error", error: "RSS feeds are not supported yet" };
  }

  try {
    const page = await fetchPage(watch.url);
    const isFirstCheck = watch.lastHash === null;
    const changed = !isFirstCheck && page.hash !== watch.lastHash;

    await prisma.sourceWatch.update({
      where: { id: watch.id },
      data: {
        lastHash: page.hash,
        lastCheckedAt: now,
        lastError: null,
        ...(changed ? { lastChangedAt: now } : {}),
      },
    });
    // The first check only stores a baseline: we can't know what "changed" means yet.
    return { outcome: isFirstCheck ? "baseline" : changed ? "changed" : "unchanged" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Keep the old hash, so the next successful check still compares against real content.
    await prisma.sourceWatch.update({ where: { id: watch.id }, data: { lastCheckedAt: now, lastError: message } });
    return { outcome: "error", error: message };
  }
}

// Checks every watched page, one after another (polite: one request at a time).
// A failing page is logged and skipped; it never stops the run.
export async function checkSources(): Promise<SourceCheckResult> {
  const watches = await prisma.sourceWatch.findMany({ orderBy: { label: "asc" } });
  const result: SourceCheckResult = { itemsChecked: 0, changes: [], errors: [] };
  const now = new Date();

  for (const watch of watches) {
    const { outcome, error } = await checkOne(watch, now);
    result.itemsChecked++;
    console.log(`  [${outcome.padEnd(9)}] ${watch.label}${error ? ` – ${error}` : ""}`);

    if (outcome === "changed") {
      result.changes.push({ sourceWatchId: watch.id, label: watch.label, url: watch.url });
    }
    if (outcome === "error" && error) {
      result.errors.push({ where: watch.label, message: error });
    }
  }
  return result;
}
