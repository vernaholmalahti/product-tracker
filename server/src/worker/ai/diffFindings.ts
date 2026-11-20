import type { Stage } from "../../generated/prisma/client";
import type { CheckedFinding } from "./validateReport";

// What the database already knows about one product in one market.
export type MarketState = {
  marketCode: string;
  eventStages: Stage[]; // stages already on the timeline
  latestEventDate: string | null; // "YYYY-MM-DD"
  pendingStages: Stage[]; // stages already waiting for review
};

export type KnownFinding = { finding: CheckedFinding; reason: string };

// Keeps only findings that are real news (AI_UPDATE_PIPELINE.md section 6). Pure function:
// the caller loads MarketState from the database, so this is easy to unit test.
export function diffFindings(findings: CheckedFinding[], states: MarketState[]) {
  const fresh: CheckedFinding[] = [];
  const known: KnownFinding[] = [];
  const takenInThisReport = new Set<string>(); // market+stage already accepted from this same report

  // Higher confidence first, so a duplicate inside one report keeps the best-supported version.
  const sorted = [...findings].sort((a, b) => b.confidence - a.confidence);

  for (const finding of sorted) {
    const state = states.find((s) => s.marketCode === finding.marketCode);
    const key = `${finding.marketCode}:${finding.proposedStage}`;

    if (state?.eventStages.includes(finding.proposedStage)) {
      known.push({ finding, reason: "this stage is already on the timeline" });
    } else if (state?.pendingStages.includes(finding.proposedStage)) {
      known.push({ finding, reason: "an update for this stage is already waiting for review" });
    } else if (finding.eventDate && state?.latestEventDate && finding.eventDate < state.latestEventDate) {
      known.push({ finding, reason: `older (${finding.eventDate}) than the latest known event (${state.latestEventDate})` });
    } else if (takenInThisReport.has(key)) {
      known.push({ finding, reason: "duplicate of another finding in the same report" });
    } else {
      takenInThisReport.add(key);
      fresh.push(finding);
    }
  }
  return { fresh, known };
}
