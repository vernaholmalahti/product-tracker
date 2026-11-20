import { findBannedWords } from "../content/bannedWords";
import type { Category, SourceType, Stage } from "../generated/prisma/client";
import { isOfficialSource } from "./officialDomains";
import { isForwardMove } from "./stageOrder";

// Everything the rules need to decide about one update. quoteFoundOnPage comes from
// verifyQuoteOnPage() (the only part that needs the network), so the rules stay pure.
export type AutoPublishInput = {
  category: Category;
  marketCode: string;
  currentStage: Stage;
  proposedStage: Stage;
  sourceType: SourceType;
  sourceUrl: string;
  confidence: number | null;
  eventDate: string | null;
  title: string;
  summary: string;
  quoteFoundOnPage: boolean | null; // null = couldn't check (PDF, fetch error…)
};

export const MIN_CONFIDENCE = 0.85;
const AUTO_STAGES: Stage[] = ["APPLICATION_SUBMITTED", "UNDER_ASSESSMENT", "POSITIVE_SAFETY_OPINION", "AUTHORISED"];

// Each rule returns null when it passes, or a short reason when it fails.
// The reasons are shown to the admin, so they say what a person should check.
type Rule = (input: AutoPublishInput) => string | null;

const RULES: Rule[] = [
  // 1. Official source: labelled OFFICIAL by the AI AND on our own domain list for the market.
  (i) =>
    i.sourceType === "OFFICIAL" && isOfficialSource(i.sourceUrl, i.marketCode)
      ? null
      : "source is not on the official domain list for this market",
  // 2. We fetched the page ourselves and found the quote on it.
  (i) =>
    i.quoteFoundOnPage === true
      ? null
      : i.quoteFoundOnPage === false
        ? "quote was not found on the source page"
        : "could not check the quote on the source page",
  // 3. The AI is confident enough.
  (i) => (i.confidence !== null && i.confidence >= MIN_CONFIDENCE ? null : `confidence below ${MIN_CONFIDENCE}`),
  // 4. Only the "normal" stages. ON_MARKET, REJECTED and WITHDRAWN always need a person.
  (i) => (AUTO_STAGES.includes(i.proposedStage) ? null : `${i.proposedStage} always needs human review`),
  // 5. Moves forward on the normal path.
  (i) => (isForwardMove(i.currentStage, i.proposedStage) ? null : "not a forward move from the current stage"),
  // 6. Has a real date for the timeline.
  (i) => (i.eventDate ? null : "no event date"),
  // 7. Supplements: no health-claim or dosing wording (ground rule 4).
  (i) => {
    if (i.category !== "SUPPLEMENT_INGREDIENT") return null;
    const words = findBannedWords(`${i.title} ${i.summary}`);
    return words.length === 0 ? null : `possible health claim wording: ${words.join(", ")}`;
  },
];

// Auto-publish only if EVERY rule passes (docs/AI_UPDATE_PIPELINE.md section 7).
// failedRules is empty when publishing automatically, and explains the decision otherwise.
export function evaluateAutoPublish(input: AutoPublishInput): { autoPublish: boolean; failedRules: string[] } {
  const failedRules = RULES.map((rule) => rule(input)).filter((reason): reason is string => reason !== null);
  return { autoPublish: failedRules.length === 0, failedRules };
}
