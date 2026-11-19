import type { Category, SourceType, Stage } from "@/api/types";
import { colors } from "@/theme";

// Plain-English labels for each stage (docs/CONTENT_GUIDELINES.md).
const stageLabels: Record<Stage, string> = {
  NOT_SUBMITTED: "Not submitted",
  APPLICATION_SUBMITTED: "Application submitted",
  UNDER_ASSESSMENT: "Under assessment",
  POSITIVE_SAFETY_OPINION: "Positive safety opinion",
  AUTHORISED: "Authorised",
  ON_MARKET: "On the market",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

// Ring colours from docs/BRANDING.md. Always shown together with a text label,
// never colour alone (colour-blind users).
const stageColors: Record<Stage, string> = {
  NOT_SUBMITTED: colors.neutral,
  APPLICATION_SUBMITTED: colors.sprout,
  UNDER_ASSESSMENT: colors.zest,
  POSITIVE_SAFETY_OPINION: colors.amber,
  AUTHORISED: colors.amber,
  ON_MARKET: colors.ripe,
  REJECTED: colors.neutral,
  WITHDRAWN: colors.neutral,
};

type StageContext = { category: Category; marketCode: string };

// FDA doesn't "authorise" supplement ingredients, so US supplements get their
// own label (decision in docs/CONTENT_GUIDELINES.md).
export function stageLabel(stage: Stage, context: StageContext): string {
  if (stage === "AUTHORISED" && context.category === "SUPPLEMENT_INGREDIENT" && context.marketCode === "US") {
    return "Allowed in supplements";
  }
  return stageLabels[stage];
}

export function stageColor(stage: Stage): string {
  return stageColors[stage];
}

export function categoryLabel(category: Category): string {
  return category === "NOVEL_FOOD" ? "Novel food" : "Supplement ingredient";
}

// Extra plain-language note for stages that are easy to misread.
// CONTENT_GUIDELINES.md: explain that an EU safety opinion is not yet permission to sell.
export function stageExplanation(stage: Stage, marketCode: string): string | null {
  if (stage === "POSITIVE_SAFETY_OPINION" && marketCode === "EU") {
    return "A positive safety opinion is not yet permission to sell. The European Commission and EU countries still have to approve it.";
  }
  return null;
}

const sourceTypeLabels: Record<SourceType, string> = {
  OFFICIAL: "Official source",
  COMPANY: "Company announcement",
  NEWS: "News report",
};

export function sourceTypeLabel(sourceType: SourceType): string {
  return sourceTypeLabels[sourceType];
}
